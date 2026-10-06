'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { lessonContent } from '@/lib/lessons'
import VocabTab from '@/components/VocabTab'
import GrammarTab from '@/components/GrammarTab'

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
  const [activeTab, setActiveTab] = useState<'path' | 'vocab' | 'grammar' | 'achievements'>('path')
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

      if (data) {
        // Стрик үзілген болса (кеше де, бүгін де оқымаса), 0 көрсетеміз
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
      // Қателер санын санаймыз (кесте болмаса, 0 көрсетеміз)
      const { count } = await supabase
        .from('mistakes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setMistakeCount(count ?? 0)

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
  const doneCount = a1Lessons.filter((l) => completed.includes(l.id)).length
  const percent = Math.round((doneCount / a1Lessons.length) * 100)

  const achievements = [
    {
      icon: '🌟',
      title: 'Алғашқы қадам',
      desc: 'Алғашқы сабақты аяқтадыңыз',
      earned: doneCount >= 1,
    },
    {
      icon: '🏅',
      title: 'А1 деңгейі аяқталды',
      desc: 'А1 деңгейінің барлық сабағын өттіңіз',
      earned: doneCount === a1Lessons.length,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col md:flex-row">

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center space-x-3 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center font-bold text-slate-900 text-xl">
              ҚҰ
            </div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              QazaqQadam
            </span>
          </Link>

          <Link
            href="/"
            className="w-full mb-6 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            ← Басты бетке оралу
          </Link>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('path')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                activeTab === 'path' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              🗺️ Оқу траекториясы
            </button>
            <button
              onClick={() => setActiveTab('vocab')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                activeTab === 'vocab' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📚 Сөздік
            </button>
            <button
              onClick={() => setActiveTab('grammar')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                activeTab === 'grammar' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              ✍️ Грамматика
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                activeTab === 'achievements' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              🏆 Жетістіктер
            </button>
            <Link
              href="/review"
              className="w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 text-slate-400 hover:bg-slate-800"
            >
              🔁 Қателер мен қайталау
              {mistakeCount > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-red-500/20 text-red-300 text-xs font-bold rounded-full border border-red-500/30">
                  {mistakeCount}
                </span>
              )}
            </Link>
            <Link
              href="/check"
              className="w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 text-slate-400 hover:bg-slate-800"
            >
              ✍️ Мәтінді тексеру
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-400 text-teal-300 flex items-center justify-center font-bold">
              {profile?.username?.[0]?.toUpperCase() ?? 'Қ'}
            </div>
            <div>
              <p className="text-sm font-semibold">{profile?.username}</p>
              <p className="text-xs text-slate-400">Деңгей: {profile?.level}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition-all"
          >
            Шығу
          </button>
        </div>
      </aside>

      {/* Контент */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {loadError && (
          <div className="mb-6 p-3 rounded-lg text-sm border bg-red-500/10 border-red-500/30 text-red-400">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="text-2xl font-bold text-orange-400">{profile?.streak} күн</p>
              <p className="text-xs text-slate-400">Үздіксіз стрик</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-3xl">🎯</span>
            <div>
              <p className="text-2xl font-bold text-teal-400">{profile?.level}</p>
              <p className="text-xs text-slate-400">Қазіргі деңгей</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-3xl">⚡</span>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{profile?.points} XP</p>
              <p className="text-xs text-slate-400">Жинаған ұпай</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{doneCount} / {a1Lessons.length}</p>
              <p className="text-xs text-slate-400">Өтілген сабақ</p>
            </div>
          </div>
        </div>

        {activeTab === 'path' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">А1 деңгейі: Бастауыш</h2>

            <div className="max-w-3xl mb-6">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Деңгей бойынша прогресс</span>
                <span className="font-bold text-teal-300">{percent}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div className="space-y-4 max-w-3xl">
              {a1Lessons.map((lesson, idx) => {
                const isCompleted = completed.includes(lesson.id)
                const isUnlocked = idx === 0 || completed.includes(a1Lessons[idx - 1].id)

                return (
                  <div
                    key={lesson.id}
                    className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
                      isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : isUnlocked
                        ? 'bg-slate-900 border-teal-500/50'
                        : 'bg-slate-900/40 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl bg-slate-800 p-3 rounded-xl border border-slate-700">
                        {lesson.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{lesson.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">{lesson.desc}</p>
                      </div>
                    </div>

                    <div>
                      {isCompleted ? (
                        <div className="flex items-center gap-2">
                          <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold">
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
                          <span className="px-4 py-2 bg-slate-800 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold">
                            Сабақ жақында ашылады
                          </span>
                        )
                      ) : (
                        <span className="px-4 py-2 bg-slate-800 text-slate-500 border border-slate-700 rounded-xl text-xs font-bold">
                          🔒 Құлыпталған
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
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
                  className={`p-6 rounded-2xl flex items-center gap-4 border ${
                    a.earned
                      ? 'bg-slate-900 border-emerald-500/40'
                      : 'bg-slate-900/40 border-slate-800 opacity-50'
                  }`}
                >
                  <span className="text-4xl">{a.earned ? a.icon : '🔒'}</span>
                  <div>
                    <h4 className="font-bold">{a.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{a.desc}</p>
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