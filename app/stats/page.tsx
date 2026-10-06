'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { lessonContent } from '@/lib/lessons'

interface Attempt {
  lesson_id: string
  score: number
  total: number
  passed: boolean
  created_at: string
}

interface MistakeRow {
  lesson_id: string
  question_id: string
  wrong_count: number
}

const WEEKDAYS = ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб']

function localDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function StatsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [completed, setCompleted] = useState<string[]>([])
  const [points, setPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [topMistakes, setTopMistakes] = useState<MistakeRow[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('completed_lessons, points, streak, last_activity_date')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        setCompleted(profile.completed_lessons ?? [])
        setPoints(profile.points ?? 0)
        // Стрик үзілген болса, 0 көрсетеміз
        const today = localDateString(new Date())
        const y = new Date()
        y.setDate(y.getDate() - 1)
        const yesterday = localDateString(y)
        const last: string | null = profile.last_activity_date ?? null
        setStreak(last === today || last === yesterday ? (profile.streak ?? 0) : 0)
      }

      const { data: att, error: attError } = await supabase
        .from('lesson_attempts')
        .select('lesson_id, score, total, passed, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000)
      if (attError) {
        setLoadError(attError.message)
      } else {
        setAttempts((att ?? []) as Attempt[])
      }

      const { data: mis } = await supabase
        .from('mistakes')
        .select('lesson_id, question_id, wrong_count')
        .eq('user_id', user.id)
        .order('wrong_count', { ascending: false })
        .limit(5)
      setTopMistakes((mis ?? []) as MistakeRow[])

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-teal-400 font-medium animate-pulse">Жүктелуде...</p>
      </div>
    )
  }

  // Негізгі көрсеткіштер
  const attemptCount = attempts.length
  const sumScore = attempts.reduce((s, a) => s + a.score, 0)
  const sumTotal = attempts.reduce((s, a) => s + a.total, 0)
  const accuracy = sumTotal > 0 ? Math.round((sumScore / sumTotal) * 100) : null

  // Өтілген сабақтардағы сөздер
  const learnedWords = new Set<string>()
  for (const id of completed) {
    const lesson = lessonContent[id]
    if (!lesson) continue
    for (const letter of lesson.letters ?? []) for (const ex of letter.examples) learnedWords.add(ex.kk)
    for (const section of lesson.sections ?? []) for (const item of section.items) learnedWords.add(item.kk)
  }

  // Соңғы 7 күн
  const days: { key: string; label: string; date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({
      key: localDateString(d),
      label: WEEKDAYS[d.getDay()],
      date: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`,
      count: 0,
    })
  }
  for (const a of attempts) {
    const key = localDateString(new Date(a.created_at))
    const day = days.find((d) => d.key === key)
    if (day) day.count += 1
  }
  const maxCount = Math.max(1, ...days.map((d) => d.count))

  // Сабақтар бойынша кесте
  const lessonRows = Object.values(lessonContent).map((lesson) => {
    const list = attempts.filter((a) => a.lesson_id === lesson.id)
    const best = list.reduce((m, a) => Math.max(m, a.score), -1)
    return {
      id: lesson.id,
      title: lesson.title,
      tries: list.length,
      best: best >= 0 ? `${best} / ${lesson.questions.length}` : '—',
      done: completed.includes(lesson.id),
    }
  })

  const cards = [
    { icon: '🧪', value: String(attemptCount), label: 'тапсырылған тест', color: 'text-teal-300' },
    { icon: '🎯', value: accuracy === null ? '—' : `${accuracy}%`, label: 'дұрыс жауап', color: 'text-emerald-300' },
    { icon: '🔤', value: String(learnedWords.size), label: 'үйренген сөз бен тіркес', color: 'text-sky-300' },
    { icon: '⚡', value: `${points}`, label: 'XP ұпай', color: 'text-yellow-300' },
    { icon: '🔥', value: `${streak}`, label: 'күн қатарынан', color: 'text-orange-400' },
    { icon: '✅', value: `${completed.length} / ${Object.keys(lessonContent).length}`, label: 'өтілген сабақ', color: 'text-emerald-300' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <Link
          href="/learning-path"
          className="inline-block mb-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-bold rounded-xl transition-all"
        >
          ← Оқу траекториясына оралу
        </Link>

        <h1 className="text-3xl font-extrabold mb-2">📊 Статистика</h1>
        <p className="text-slate-400 mb-8">
          Сіздің нақты нәтижелеріңіз. Тест нәтижелері осы бөлім қосылғаннан кейін жиналады.
        </p>

        {loadError && (
          <div className="mb-6 p-3 rounded-lg text-sm border bg-red-500/10 border-red-500/30 text-red-400">
            Тест нәтижелерін жүктеу мүмкін болмады: {loadError}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {cards.map((c) => (
            <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-2xl mb-2">{c.icon}</p>
              <p className={`text-3xl font-extrabold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-slate-400 mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Соңғы 7 күн */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-10">
          <h2 className="font-bold mb-1">Соңғы 7 күн</h2>
          <p className="text-xs text-slate-500 mb-5">Күн сайын тапсырылған тест саны</p>
          <div className="flex items-end justify-between gap-2 h-40">
            {days.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-xs text-slate-300 mb-1">{d.count > 0 ? d.count : ''}</span>
                <div
                  className={`w-full max-w-[40px] rounded-t-lg ${d.count > 0 ? 'bg-gradient-to-t from-teal-500 to-emerald-400' : 'bg-slate-800'}`}
                  style={{ height: `${d.count > 0 ? Math.max(8, (d.count / maxCount) * 100) : 4}%` }}
                />
                <span className="text-xs text-slate-400 mt-2">{d.label}</span>
                <span className="text-[10px] text-slate-600">{d.date}</span>
              </div>
            ))}
          </div>
          {attemptCount === 0 && !loadError && (
            <p className="text-xs text-slate-500 mt-4">Әзірге тест нәтижелері жоқ. Бір тест тапсырсаңыз, мұнда көрінеді.</p>
          )}
        </div>

        {/* Сабақтар бойынша */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-10 overflow-x-auto">
          <h2 className="font-bold mb-4">Сабақтар бойынша</h2>
          <table className="w-full text-sm text-left">
            <thead className="text-slate-400 text-xs">
              <tr>
                <th className="pb-3 font-medium">Сабақ</th>
                <th className="pb-3 font-medium">Талпыныс</th>
                <th className="pb-3 font-medium">Ең жақсы нәтиже</th>
                <th className="pb-3 font-medium">Күйі</th>
              </tr>
            </thead>
            <tbody>
              {lessonRows.map((r) => (
                <tr key={r.id} className="border-t border-slate-800">
                  <td className="py-3 pr-4 font-medium">{r.title}</td>
                  <td className="py-3 pr-4 text-slate-300">{r.tries}</td>
                  <td className="py-3 pr-4 text-slate-300">{r.best}</td>
                  <td className="py-3">
                    {r.done ? (
                      <span className="text-emerald-400 font-bold">✓ Өтілді</span>
                    ) : (
                      <span className="text-slate-500">Өтілмеген</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ең көп қателесетін сұрақтар */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="font-bold mb-4">Ең көп қателескен сұрақтар</h2>
          {topMistakes.length === 0 ? (
            <p className="text-sm text-slate-400">Қазір қателер жоқ.</p>
          ) : (
            <div className="space-y-3">
              {topMistakes.map((m) => {
                const lesson = lessonContent[m.lesson_id]
                const question = lesson?.questions.find((q) => q.id === m.question_id)
                if (!lesson || !question) return null
                return (
                  <div key={`${m.lesson_id}-${m.question_id}`} className="bg-slate-800/50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">{lesson.title}</p>
                    <p className="text-sm font-medium">{question.prompt}</p>
                    <p className="text-xs text-red-300 mt-1">Қате: {m.wrong_count} рет</p>
                  </div>
                )
              })}
              <Link href="/review" className="inline-block text-sm text-teal-300 font-bold hover:text-teal-200">
                🔁 Қателерді қайталау
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}