'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { lessonContent } from '@/lib/lessons'
import VocabTab from '@/components/VocabTab'
import GrammarTab from '@/components/GrammarTab'
import { useTheme } from '@/components/ThemeProvider'

interface Profile {
  username: string
  level: string
  streak: number
  points: number
  completed_lessons: string[]
}

const a1Lessons = [
  { id: 'a1-1', title: '1. Алфавит және дыбыстар', desc: 'Ерекше дыбыстар: Ә, Ғ, Қ, Ң, Ө, Ү, Ұ, І, Һ', icon: '🔤' },
  { id: 'a1-2', title: '2. Сәлемдесу мен танысу', desc: 'Сәлеметсіз бе! Есіміңіз кім?', icon: '👋' },
  { id: 'a1-3', title: '3. Сандар мен уақыт', desc: '1-ден 100-ге дейін санау', icon: '🔢' },
  { id: 'a1-4', title: '4. Жіктеу есімдіктері', desc: 'Мен, сен, ол, біз, сіздер...', icon: '👥' },
  { id: 'a1-5', title: '5. Отбасы және мүшелері', desc: 'Әке, ана, аға, әпке, қарындас', icon: '🏠' },
]

const a2Lessons = [
  { id: 'a2-1', title: '1. Тамақ және сусындар', desc: 'Нан, шай, сүт және мейрамханада тапсырыс', icon: '🍽️' },
  { id: 'a2-2', title: '2. Қала және бағыт', desc: 'Дүкен қайда? Оңға бұрылыңыз', icon: '🏙️' },
  { id: 'a2-3', title: '3. Күнделікті өмір', desc: 'Оқимын, жазамын, келемін: осы шақ', icon: '⏰' },
  { id: 'a2-4', title: '4. Өткен шақ', desc: 'Бардым, келдім, жаздым', icon: '⏪' },
  { id: 'a2-5', title: '5. Сын есім және түстер', desc: 'Үлкен, жаңа, қызыл, көк', icon: '🎨' },
]

const levels = [
  { id: 'A1', title: 'А1 деңгейі: Бастауыш', lessons: a1Lessons },
  { id: 'A2', title: 'А2 деңгейі: Негізгі', lessons: a2Lessons },
]

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
  const [activeTab, setActiveTab] = useState<'path' | 'vocab' | 'grammar' | 'achievements'>('path')
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()

  const isLight = theme === 'light'

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

      if (data) {
        const todayStr = localDateString(new Date())
        const yesterdayDate = new Date()
        yesterdayDate.setDate(yesterdayDate.getDate() - 1)
        const yesterdayStr = localDateString(yesterdayDate)
        const lastDay: string | null = data.last_activity_date ?? null

        setProfile({
          username: data.username || user.email?.split('@')[0] || 'Оқушы',
          level: data.level ?? 'A1',
          streak: lastDay === todayStr || lastDay === yesterdayStr ? (data.streak ?? 0) : 0,
          points: data.points ?? 0,
          completed_lessons: data.completed_lessons ?? [],
        })
      } else {
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

      const { count } = await supabase
        .from('mistakes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setMistakeCount(count ?? 0)

      const { data: adminFlag } = await supabase.rpc('is_admin')
      setIsAdmin(adminFlag === true)

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
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-900 text-white'}`}>
        <p className="text-teal-600 font-medium animate-pulse">Жүктелуде...</p>
      </div>
    )
  }

  const completed = profile?.completed_lessons ?? []
  const allLessons = [...a1Lessons, ...a2Lessons]
  const doneCount = allLessons.filter((l) => completed.includes(l.id)).length
  const a1Done = a1Lessons.filter((l) => completed.includes(l.id)).length
  const a2Done = a2Lessons.filter((l) => completed.includes(l.id)).length
  const a1Finished = a1Done === a1Lessons.length
  const a2Finished = a2Done === a2Lessons.length
  const currentLevel = a1Finished ? 'A2' : 'A1'
  const streak = profile?.streak ?? 0
  const points = profile?.points ?? 0

  const achievements = [
    { icon: '🌟', title: 'Алғашқы қадам', desc: 'Алғашқы сабақты аяқтадыңыз', earned: doneCount >= 1 },
    { icon: '📚', title: 'Бес сабақ', desc: 'Бес сабақты өттіңіз', earned: doneCount >= 5 },
    { icon: '🏅', title: 'А1 деңгейі аяқталды', desc: 'А1 деңгейінің барлық сабағын өттіңіз', earned: a1Finished },
    { icon: '🎓', title: 'А2 деңгейі аяқталды', desc: 'А2 деңгейінің барлық сабағын өттіңіз', earned: a2Finished },
    { icon: '💯', title: 'Мінсіз тест', desc: 'Тестті бірде-бір қатесіз тапсырдыңыз', earned: hasPerfectTest },
    { icon: '⚡', title: '100 XP', desc: '100 ұпай жинадыңыз', earned: points >= 100 },
    { icon: '🔥', title: '3 күн қатарынан', desc: 'Үш күн қатарынан оқыдыңыз', earned: streak >= 3 },
    { icon: '🚀', title: '7 күн қатарынан', desc: 'Жеті күн қатарынан оқыдыңыз', earned: streak >= 7 },
  ]

  return (
    <div className={`min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-200 ${
      isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'
    }`}>

      {/* Sidebar */}
      <aside className={`w-full md:w-64 border-r p-6 flex flex-col justify-between transition-colors duration-200 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div>
          <Link href="/" className="flex items-center space-x-3 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center font-bold text-slate-900 text-xl">
              ҚҰ
            </div>
            <span className={`font-extrabold text-lg ${isLight ? 'text-slate-900' : 'bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent'}`}>
              QazaqQadam
            </span>
          </Link>

          <Link
            href="/"
            className={`w-full mb-6 px-4 py-2.5 border text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-teal-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-teal-300'
            }`}
          >
            ← Басты бетке оралу
          </Link>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('path')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                activeTab === 'path'
                  ? isLight ? 'bg-teal-50 text-teal-700 border border-teal-200 font-bold' : 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              🗺️ Оқу траекториясы
            </button>
            <button
              onClick={() => setActiveTab('vocab')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                activeTab === 'vocab'
                  ? isLight ? 'bg-teal-50 text-teal-700 border border-teal-200 font-bold' : 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📚 Сөздік
            </button>
            <button
              onClick={() => setActiveTab('grammar')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                activeTab === 'grammar'
                  ? isLight ? 'bg-teal-50 text-teal-700 border border-teal-200 font-bold' : 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              ✍️ Грамматика
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                activeTab === 'achievements'
                  ? isLight ? 'bg-teal-50 text-teal-700 border border-teal-200 font-bold' : 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              🏆 Жетістіктер
            </button>
            <Link
              href="/review"
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              🔁 Қателер мен қайталау
              {mistakeCount > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-bold rounded-full border border-red-500/30">
                  {mistakeCount}
                </span>
              )}
            </Link>
            <Link
              href="/stats"
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📊 Статистика
            </Link>
            <Link
              href="/check"
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              ✍️ Мәтінді тексеру
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                  isLight ? 'text-orange-600 hover:bg-slate-100' : 'text-orange-300 hover:bg-slate-800'
                }`}
              >
                🛠️ Әкімші панелі
              </Link>
            )}
          </nav>
        </div>

        <div className={`pt-6 border-t mt-6 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          {/* Кнопка переключения темы */}
          <button
            onClick={toggleTheme}
            className={`w-full mb-4 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            <span>{isLight ? '☀️ Күндізгі режим' : '🌙 Түнгі режим'}</span>
            <span className="text-xs px-2 py-0.5 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-300">
              Ауыстыру
            </span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-400 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold">
              {profile?.username?.[0]?.toUpperCase() ?? 'Қ'}
            </div>
            <div>
              <p className="text-sm font-semibold">{profile?.username}</p>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Деңгей: {currentLevel}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition-all"
          >
            Шығу
          </button>
        </div>
      </aside>

      {/* Контент */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {loadError && (
          <div className="mb-6 p-3 rounded-lg text-sm border bg-red-500/10 border-red-500/30 text-red-500">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className={`border rounded-2xl p-4 flex items-center gap-4 transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-3xl">🔥</span>
            <div>
              <p className="text-2xl font-bold text-orange-500">{profile?.streak} күн</p>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Үздіксіз стрик</p>
            </div>
          </div>

          <div className={`border rounded-2xl p-4 flex items-center gap-4 transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-3xl">🎯</span>
            <div>
              <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{currentLevel}</p>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Қазіргі деңгей</p>
            </div>
          </div>

          <div className={`border rounded-2xl p-4 flex items-center gap-4 transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-3xl">⚡</span>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{profile?.points} XP</p>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Жинаған ұпай</p>
            </div>
          </div>

          <div className={`border rounded-2xl p-4 flex items-center gap-4 transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{doneCount} / {allLessons.length}</p>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Өтілген сабақ</p>
            </div>
          </div>
        </div>

        {activeTab === 'path' && (
          <div>
            {levels.map((level, levelIdx) => {
              const levelDone = level.lessons.filter((l) => completed.includes(l.id)).length
              const levelPercent = Math.round((levelDone / level.lessons.length) * 100)
              const prevLevelFinished =
                levelIdx === 0 || levels[levelIdx - 1].lessons.every((l) => completed.includes(l.id))

              return (
                <div key={level.id} className="mb-12">
                  <h2 className="text-2xl font-bold mb-4">{level.title}</h2>

                  {!prevLevelFinished && (
                    <p className={`text-sm mb-4 max-w-3xl ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Бұл деңгей алдыңғы деңгейдің барлық сабағын өткеннен кейін ашылады.
                    </p>
                  )}

                  <div className="max-w-3xl mb-6">
                    <div className={`flex justify-between text-xs mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>Деңгей бойынша прогресс</span>
                      <span className="font-bold text-teal-600 dark:text-teal-300">{levelPercent}%</span>
                    </div>
                    <div className={`w-full h-2.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                      <div
                        className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all"
                        style={{ width: `${levelPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 max-w-3xl">
                    {level.lessons.map((lesson, idx) => {
                      const isCompleted = completed.includes(lesson.id)
                      const isUnlocked =
                        prevLevelFinished && (idx === 0 || completed.includes(level.lessons[idx - 1].id))

                      return (
                        <div
                          key={lesson.id}
                          className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
                            isCompleted
                              ? isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/40'
                              : isUnlocked
                              ? isLight ? 'bg-white border-teal-500 shadow-sm' : 'bg-slate-900 border-teal-500/50'
                              : isLight ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-slate-900/40 border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`text-3xl p-3 rounded-xl border ${
                              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
                            }`}>
                              {lesson.icon}
                            </div>
                            <div>
                              <h4 className="font-bold text-lg">{lesson.title}</h4>
                              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{lesson.desc}</p>
                            </div>
                          </div>

                          <div>
                            {isCompleted ? (
                              <div className="flex items-center gap-2">
                                <span className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                                  isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                }`}>
                                  ✓ Өтілді
                                </span>
                                {lessonContent[lesson.id] && (
                                  <Link
                                    href={`/lesson/${lesson.id}`}
                                    className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all ${
                                      isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-teal-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-teal-300'
                                    }`}
                                  >
                                    Қайталау
                                  </Link>
                                )}
                              </div>
                            ) : isUnlocked ? (
                              lessonContent[lesson.id] ? (
                                <Link
                                  href={`/lesson/${lesson.id}`}
                                  className="px-5 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl text-sm hover:scale-105 transition-all inline-block shadow-sm"
                                >
                                  Бастау
                                </Link>
                              ) : (
                                <span className={`px-4 py-2 border rounded-xl text-xs font-bold ${
                                  isLight ? 'bg-slate-100 text-teal-700 border-teal-200' : 'bg-slate-800 text-teal-300 border-teal-500/30'
                                }`}>
                                  Сабақ жақында ашылады
                                </span>
                              )
                            ) : (
                              <span className={`px-4 py-2 border rounded-xl text-xs font-bold ${
                                isLight ? 'bg-slate-200 text-slate-400 border-slate-300' : 'bg-slate-800 text-slate-500 border-slate-700'
                              }`}>
                                🔒 Құлыпталған
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'vocab' && <VocabTab />}

        {activeTab === 'grammar' && <GrammarTab />}

        {activeTab === 'achievements' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">🏆 Сіздің жетістіктеріңіз</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((a) => (
                <div
                  key={a.title}
                  className={`p-6 rounded-2xl flex items-center gap-4 border transition-all ${
                    a.earned
                      ? isLight ? 'bg-white border-emerald-300 shadow-sm' : 'bg-slate-900 border-emerald-500/40'
                      : isLight ? 'bg-slate-100 border-slate-200 opacity-50' : 'bg-slate-900/40 border-slate-800 opacity-50'
                  }`}
                >
                  <span className="text-4xl">{a.earned ? a.icon : '🔒'}</span>
                  <div>
                    <h4 className="font-bold">{a.title}</h4>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}