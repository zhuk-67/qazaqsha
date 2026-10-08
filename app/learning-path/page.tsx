'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { lessonContent } from '@/lib/lessons'
import {
  levelDefs,
  doneInLevel,
  isLevelFinished,
  isLevelUnlocked,
  currentLevelId,
  totalDone,
  totalLessonCount,
  type LevelId,
} from '@/lib/levels'
import VocabTab from '@/components/VocabTab'
import GrammarTab from '@/components/GrammarTab'
import ThemeToggle from '@/components/ThemeToggle'
import Avatar from '@/components/Avatar'

interface Profile {
  username: string
  avatar?: string | null
  level: string
  streak: number
  points: number
  completed_lessons: string[]
}

type Tab = 'path' | 'vocab' | 'grammar' | 'achievements'

// Күнді жергілікті уақыт бойынша «ЖЖЖЖ-АА-КК» түрінде береді
function localDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function LearningPathPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [mistakeCount, setMistakeCount] = useState(0)
  const [hasPerfectTest, setHasPerfectTest] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('path')
  const [activeLevel, setActiveLevel] = useState<LevelId>('A1')
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      let completedNow: string[] = []

      if (data) {
        // Стрик үзілген болса (кеше де, бүгін де оқымаса), 0 көрсетеміз
        const todayStr = localDateString(new Date())
        const yesterdayDate = new Date()
        yesterdayDate.setDate(yesterdayDate.getDate() - 1)
        const yesterdayStr = localDateString(yesterdayDate)
        const lastDay: string | null = data.last_activity_date ?? null
        completedNow = data.completed_lessons ?? []

        setProfile({
          username: data.username || user.email?.split('@')[0] || 'Оқушы',
          level: data.level ?? 'A1',
          streak: lastDay === todayStr || lastDay === yesterdayStr ? (data.streak ?? 0) : 0,
          points: data.points ?? 0,
          completed_lessons: completedNow,
        })
      } else {
        // Жаңа пайдаланушы: нөлден бастаймыз
        const username = user.email?.split('@')[0] || 'Оқушы'
        const newProfile = {
          username,
          level: 'A1',
          streak: 0,
          points: 0,
          completed_lessons: [] as string[],
        }

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, ...newProfile })

        if (insertError) {
          setLoadError('Профильді сақтау мүмкін болмады: ' + insertError.message)
        }
        setProfile(newProfile)
      }

      // Сілтемеден келген бөлім мен деңгейді оқимыз: /learning-path?tab=grammar&level=B1
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get('tab')
      if (tabParam === 'vocab' || tabParam === 'grammar' || tabParam === 'achievements' || tabParam === 'path') {
        setActiveTab(tabParam)
      }
      const levelParam = params.get('level')
      const found = levelDefs.find((l) => l.id === levelParam)
      setActiveLevel(found ? found.id : currentLevelId(completedNow))

      // Қателер санын санаймыз (кесте болмаса, 0 көрсетеміз)
      const { count } = await supabase
        .from('mistakes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setMistakeCount(count ?? 0)

      // Әкімші ме (функция болмаса немесе қате шықса, жай жасырын қалады)
      const { data: adminFlag } = await supabase.rpc('is_admin')
      setIsAdmin(adminFlag === true)

      // Мінсіз тест болды ма (кесте болмаса, жай өткізіп жібереміз)
      const { data: attempts } = await supabase
        .from('lesson_attempts')
        .select('score, total')
        .eq('user_id', user.id)
        .limit(1000)
      setHasPerfectTest(
        ((attempts ?? []) as { score: number; total: number }[]).some((a) => a.total > 0 && a.score === a.total)
      )

      setLoading(false)
    }

    loadUserData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-teal-400 font-medium animate-pulse">Жүктелуде...</p>
      </div>
    )
  }

  const completed = profile?.completed_lessons ?? []
  const doneCount = totalDone(completed)
  const currentLevel = currentLevelId(completed)
  const streak = profile?.streak ?? 0
  const points = profile?.points ?? 0

  const levelFinished = (id: LevelId) => {
    const lvl = levelDefs.find((l) => l.id === id)
    return lvl ? isLevelFinished(lvl, completed) : false
  }

  const achievements = [
    { icon: '🌟', title: 'Алғашқы қадам', desc: 'Алғашқы сабақты аяқтадыңыз', earned: doneCount >= 1 },
    { icon: '📚', title: 'Бес сабақ', desc: 'Бес сабақты өттіңіз', earned: doneCount >= 5 },
    { icon: '🏅', title: 'A1 деңгейі аяқталды', desc: 'A1 деңгейінің барлық сабағын өттіңіз', earned: levelFinished('A1') },
    { icon: '🎓', title: 'A2 деңгейі аяқталды', desc: 'A2 деңгейінің барлық сабағын өттіңіз', earned: levelFinished('A2') },
    { icon: '🎖️', title: 'B1 деңгейі аяқталды', desc: 'B1 деңгейінің барлық сабағын өттіңіз', earned: levelFinished('B1') },
    { icon: '👑', title: 'B2 деңгейі аяқталды', desc: 'B2 деңгейінің барлық сабағын өттіңіз', earned: levelFinished('B2') },
    { icon: '🏆', title: 'C1 деңгейі аяқталды', desc: 'C1 деңгейінің барлық сабағын өттіңіз', earned: levelFinished('C1') },
    { icon: '💯', title: 'Мінсіз тест', desc: 'Тестті бірде-бір қатесіз тапсырдыңыз', earned: hasPerfectTest },
    { icon: '⚡', title: '100 XP', desc: '100 ұпай жинадыңыз', earned: points >= 100 },
    { icon: '🔥', title: '3 күн қатарынан', desc: 'Үш күн қатарынан оқыдыңыз', earned: streak >= 3 },
    { icon: '🚀', title: '7 күн қатарынан', desc: 'Жеті күн қатарынан оқыдыңыз', earned: streak >= 7 },
  ]

  const navBase =
    'shrink-0 whitespace-nowrap text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2'
  const navIdle = 'text-slate-400 hover:bg-slate-800'
  const navActive = 'bg-teal-500/10 text-teal-300 border border-teal-500/30'

  const levelIdx = levelDefs.findIndex((l) => l.id === activeLevel)
  const level = levelDefs[levelIdx >= 0 ? levelIdx : 0]
  const levelUnlocked = isLevelUnlocked(levelIdx >= 0 ? levelIdx : 0, completed)
  const levelDone = doneInLevel(level, completed)
  const levelPercent = Math.round((levelDone / level.lessons.length) * 100)
  const levelComplete = levelDone === level.lessons.length
  const nextLevel = levelDefs[(levelIdx >= 0 ? levelIdx : 0) + 1]

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col md:flex-row">
      {/* Сол жақ мәзір */}
      <aside className="w-full md:w-60 md:shrink-0 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-3 md:p-4 flex flex-col md:h-screen md:sticky md:top-0 md:overflow-y-auto">
        <div className="flex items-center justify-between gap-2 mb-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center font-bold text-slate-900 text-lg">
              Q
            </div>
            <span className="font-extrabold text-lg tracking-wide">QAZIR</span>
          </Link>
          <ThemeToggle />
        </div>

        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
          <Link href="/" className={`${navBase} ${navIdle}`}>🏠 Басты бет</Link>
          <button
            onClick={() => setActiveTab('path')}
            className={`${navBase} ${activeTab === 'path' ? navActive : navIdle}`}
          >
            📚 Сабақтар
          </button>
          <Link href="/listen" className={`${navBase} ${navIdle}`}>🎧 Тыңдап жаз</Link>
          <button
            onClick={() => setActiveTab('grammar')}
            className={`${navBase} ${activeTab === 'grammar' ? navActive : navIdle}`}
          >
            🧠 Грамматика
          </button>
          <button
            onClick={() => setActiveTab('vocab')}
            className={`${navBase} ${activeTab === 'vocab' ? navActive : navIdle}`}
          >
            📖 Сөздік
          </button>
          <Link href="/check" className={`${navBase} ${navIdle}`}>✍️ Жазу</Link>
          <Link href="/review" className={`${navBase} ${navIdle}`}>
            🔁 Қате дәптері
            {mistakeCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-500/20 text-red-300 text-xs font-bold rounded-full border border-red-500/30">
                {mistakeCount}
              </span>
            )}
          </Link>
          <Link href="/repeat" className={`${navBase} ${navIdle}`}>🧩 Қайталау</Link>
          <Link href="/weak" className={`${navBase} ${navIdle}`}>🎯 Әлсіз тұстарым</Link>
          <Link href="/practice" className={`${navBase} ${navIdle}`}>🏋️ Жаттығулар</Link>
          <Link href="/assessment" className={`${navBase} ${navIdle}`}>📝 Деңгей тесті</Link>
          <Link href="/stats" className={`${navBase} ${navIdle}`}>📊 Статистика</Link>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`${navBase} ${activeTab === 'achievements' ? navActive : navIdle}`}
          >
            🏆 Жетістіктер
          </button>
          {isAdmin && (
            <Link href="/admin" className={`${navBase} text-orange-300 hover:bg-slate-800`}>🛠️ Әкімші панелі</Link>
          )}
        </nav>

        <div className="hidden md:block mt-auto pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={profile?.username ?? 'Q'} src={profile?.avatar} className="w-9 h-9 text-base" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.username}</p>
              <p className="text-xs text-slate-400">Деңгей: {currentLevel}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/profile"
              className="flex-1 py-2 flex items-center justify-center text-xs text-teal-300 hover:bg-slate-800 rounded-lg border border-slate-700 transition-all"
            >
              ⚙️ Профиль
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition-all"
            >
              Шығу
            </button>
          </div>
        </div>
      </aside>

      {/* Контент */}
      <main className="flex-1 p-4 md:p-8 min-w-0">
        {loadError && (
          <div className="mb-4 p-3 rounded-lg text-sm border bg-red-500/10 border-red-500/30 text-red-400">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-lg font-bold text-orange-400">{streak} күн</p>
              <p className="text-xs text-slate-400">Үздіксіз стрик</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-lg font-bold text-teal-400">{currentLevel}</p>
              <p className="text-xs text-slate-400">Қазіргі деңгей</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-lg font-bold text-yellow-400">{points} XP</p>
              <p className="text-xs text-slate-400">Жинаған ұпай</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-lg font-bold text-emerald-400">{doneCount} / {totalLessonCount}</p>
              <p className="text-xs text-slate-400">Өтілген сабақ</p>
            </div>
          </div>
        </div>

        {activeTab === 'path' && (
          <div>
            {/* Деңгей батырмалары */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
              {levelDefs.map((l, i) => {
                const unlocked = isLevelUnlocked(i, completed)
                const active = l.id === level.id
                return (
                  <button
                    key={l.id}
                    onClick={() => setActiveLevel(l.id)}
                    className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                      active
                        ? 'bg-teal-500/10 text-teal-300 border-teal-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {unlocked ? '' : '🔒 '}
                    {l.tab}
                  </button>
                )
              })}
            </div>

            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold mb-1">{level.title}</h2>
              <p className="text-sm text-slate-400 mb-4">{level.subtitle}</p>

              {!levelUnlocked && (
                <p className="text-sm text-slate-400 mb-4">
                  Бұл деңгей алдыңғы деңгейдің барлық сабағын өткеннен кейін ашылады.
                </p>
              )}

              <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Деңгей бойынша прогресс: {levelDone} / {level.lessons.length}</span>
                  <span className="font-bold text-teal-300">{levelPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all"
                    style={{ width: `${levelPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {level.lessons.map((lesson, idx) => {
                  const isCompleted = completed.includes(lesson.id)
                  const isUnlocked =
                    levelUnlocked && (idx === 0 || completed.includes(level.lessons[idx - 1].id))

                  return (
                    <div
                      key={lesson.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : isUnlocked
                          ? 'bg-slate-900 border-teal-500/50'
                          : 'bg-slate-900/40 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-2xl bg-slate-800 p-2.5 rounded-xl border border-slate-700">{lesson.icon}</div>
                        <div className="min-w-0">
                          <h4 className="font-bold">{lesson.title}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{lesson.desc}</p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isCompleted ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold">
                              ✓ Өтілді
                            </span>
                            {lessonContent[lesson.id] && (
                              <Link
                                href={`/lesson/${lesson.id}`}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 rounded-xl text-xs font-bold transition-all"
                              >
                                Қайталау
                              </Link>
                            )}
                          </div>
                        ) : isUnlocked ? (
                          lessonContent[lesson.id] ? (
                            <Link
                              href={`/lesson/${lesson.id}`}
                              className="px-5 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl text-sm hover:scale-105 transition-all inline-block"
                            >
                              Бастау
                            </Link>
                          ) : (
                            <span className="px-3 py-2 bg-slate-800 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold">
                              Сабақ жақында ашылады
                            </span>
                          )
                        ) : (
                          <span className="px-3 py-2 bg-slate-800 text-slate-500 border border-slate-700 rounded-xl text-xs font-bold">
                            🔒 Құлыпталған
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Келесі деңгей */}
              <div className="mt-8">
                {nextLevel ? (
                  levelComplete ? (
                    <button
                      onClick={() => {
                        setActiveLevel(nextLevel.id)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl hover:scale-105 transition-all shadow-lg shadow-teal-500/20"
                    >
                      Келесі деңгейге өту → {nextLevel.id}
                    </button>
                  ) : (
                    <div>
                      <button
                        disabled
                        className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 text-slate-500 border border-slate-700 font-bold rounded-xl cursor-not-allowed"
                      >
                        Келесі деңгейге өту → {nextLevel.id}
                      </button>
                      <p className="text-xs text-slate-500 mt-2">
                        Батырма осы деңгейдің барлық сабағын өткеннен кейін қосылады.
                      </p>
                    </div>
                  )
                ) : (
                  <p className="text-sm text-emerald-300 font-bold">
                    {levelComplete ? '🎉 Сіз барлық деңгейді аяқтадыңыз!' : 'Бұл — соңғы деңгей.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vocab' && <VocabTab />}

        {activeTab === 'grammar' && <GrammarTab />}

        {activeTab === 'achievements' && (
          <div>
            <h2 className="text-2xl font-bold mb-5">🏆 Сіздің жетістіктеріңіз</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((a) => (
                <div
                  key={a.title}
                  className={`p-5 rounded-2xl flex items-center gap-4 border ${
                    a.earned
                      ? 'bg-slate-900 border-emerald-500/40'
                      : 'bg-slate-900/40 border-slate-800 opacity-50'
                  }`}
                >
                  <span className="text-3xl">{a.earned ? a.icon : '🔒'}</span>
                  <div>
                    <h4 className="font-bold">{a.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Телефонда профиль мен шығу төменде */}
        <div className="md:hidden mt-8 flex gap-2">
          <Link
            href="/profile"
            className="flex-1 py-2 flex items-center justify-center text-xs text-teal-300 rounded-lg border border-slate-700"
          >
            ⚙️ Профиль
          </Link>
          <button
            onClick={handleLogout}
            className="flex-1 py-2 text-xs text-red-400 rounded-lg border border-red-500/20"
          >
            Шығу
          </button>
        </div>
      </main>
    </div>
  )
}
