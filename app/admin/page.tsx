'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { lessonContent } from '@/lib/lessons'

interface LessonStat {
  lesson_id: string
  attempts: number
  accuracy: number | null
  pass_rate: number | null
}

interface HardQuestion {
  lesson_id: string
  question_id: string
  wrong: number
  users: number
}

interface UserRow {
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  lessons_done: number
  points: number
  streak: number
}

interface AdminStats {
  total_users: number
  new_users_7d: number
  active_users_7d: number
  total_attempts: number
  avg_accuracy: number | null
  lessons: LessonStat[]
  hard_questions: HardQuestion[]
  users: UserRow[]
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ru-RU')
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase.rpc('admin_stats')
      if (error) {
        if (error.message.includes('not_admin') || error.code === '42501') {
          setDenied(true)
        } else {
          setErrorText(error.message)
        }
        setLoading(false)
        return
      }
      setStats(data as AdminStats)
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

  if (denied) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-lg font-bold">Бұл бет тек әкімші үшін.</p>
        <Link
          href="/learning-path"
          className="px-5 py-2.5 bg-slate-800 border border-slate-700 text-teal-300 rounded-xl text-sm font-bold"
        >
          ← Оқу траекториясына оралу
        </Link>
      </div>
    )
  }

  if (errorText || !stats) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-bold">Деректерді жүктеу мүмкін болмады.</p>
        <p className="text-sm text-red-300 max-w-xl">{errorText}</p>
        <p className="text-xs text-slate-400 max-w-xl">
          Supabase SQL Editor-де supabase-admin.sql файлын іске қосқаныңызға көз жеткізіңіз.
        </p>
        <Link
          href="/learning-path"
          className="px-5 py-2.5 bg-slate-800 border border-slate-700 text-teal-300 rounded-xl text-sm font-bold"
        >
          ← Оқу траекториясына оралу
        </Link>
      </div>
    )
  }

  const cards = [
    { icon: '👥', value: String(stats.total_users), label: 'барлық пайдаланушы' },
    { icon: '🆕', value: String(stats.new_users_7d), label: 'соңғы 7 күнде тіркелді' },
    { icon: '🔥', value: String(stats.active_users_7d), label: 'соңғы 7 күнде тест тапсырды' },
    { icon: '🧪', value: String(stats.total_attempts), label: 'барлық тест' },
    { icon: '🎯', value: stats.avg_accuracy === null ? '—' : `${stats.avg_accuracy}%`, label: 'орташа дұрыс жауап' },
  ]

  // Ең төмен нәтиже көрсеткен сабақты белгілейміз
  const lessonsWithAccuracy = stats.lessons.filter((l) => l.accuracy !== null)
  const hardestLessonId =
    lessonsWithAccuracy.length > 1
      ? lessonsWithAccuracy.reduce((min, l) => ((l.accuracy ?? 100) < (min.accuracy ?? 100) ? l : min)).lesson_id
      : null

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        <Link
          href="/learning-path"
          className="inline-block mb-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-bold rounded-xl transition-all"
        >
          ← Оқу траекториясына оралу
        </Link>

        <h1 className="text-3xl font-extrabold mb-2">🛠️ Әкімші панелі</h1>
        <p className="text-slate-400 mb-8">
          Платформадағы нақты деректер. Бұл бетті тек сіз көре аласыз. Пайдаланушылардың поштасын басқаларға көрсетпеңіз.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {cards.map((c) => (
            <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-2xl mb-1">{c.icon}</p>
              <p className="text-2xl font-extrabold text-teal-300">{c.value}</p>
              <p className="text-xs text-slate-400 mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Сабақтар */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 overflow-x-auto">
          <h2 className="font-bold mb-4">Сабақтар бойынша</h2>
          {stats.lessons.length === 0 ? (
            <p className="text-sm text-slate-400">Әзірге тест нәтижелері жоқ.</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-slate-400 text-xs">
                <tr>
                  <th className="pb-3 font-medium">Сабақ</th>
                  <th className="pb-3 font-medium">Тест саны</th>
                  <th className="pb-3 font-medium">Дұрыс жауап</th>
                  <th className="pb-3 font-medium">Өту пайызы</th>
                </tr>
              </thead>
              <tbody>
                {stats.lessons.map((l) => (
                  <tr key={l.lesson_id} className="border-t border-slate-800">
                    <td className="py-3 pr-4 font-medium">
                      {lessonContent[l.lesson_id]?.title ?? l.lesson_id}
                      {l.lesson_id === hardestLessonId && (
                        <span className="ml-2 text-xs text-orange-300">ең қиыны</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{l.attempts}</td>
                    <td className="py-3 pr-4 text-slate-300">{l.accuracy === null ? '—' : `${l.accuracy}%`}</td>
                    <td className="py-3 text-slate-300">{l.pass_rate === null ? '—' : `${l.pass_rate}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Қиын сұрақтар */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <h2 className="font-bold mb-4">Ең көп қателесетін сұрақтар</h2>
          {stats.hard_questions.length === 0 ? (
            <p className="text-sm text-slate-400">Әзірге қателер жоқ.</p>
          ) : (
            <div className="space-y-3">
              {stats.hard_questions.map((q) => {
                const lesson = lessonContent[q.lesson_id]
                const question = lesson?.questions.find((x) => x.id === q.question_id)
                return (
                  <div key={`${q.lesson_id}-${q.question_id}`} className="bg-slate-800/50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">{lesson?.title ?? q.lesson_id}</p>
                    <p className="text-sm font-medium">{question?.prompt ?? q.question_id}</p>
                    <p className="text-xs text-red-300 mt-1">
                      Қате: {q.wrong} рет, қателескен адам: {q.users}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Пайдаланушылар */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
          <h2 className="font-bold mb-4">Пайдаланушылар (соңғы 200)</h2>
          <table className="w-full text-sm text-left">
            <thead className="text-slate-400 text-xs">
              <tr>
                <th className="pb-3 font-medium">Пошта</th>
                <th className="pb-3 font-medium">Тіркелген күні</th>
                <th className="pb-3 font-medium">Соңғы кіру</th>
                <th className="pb-3 font-medium">Сабақ</th>
                <th className="pb-3 font-medium">XP</th>
                <th className="pb-3 font-medium">Стрик</th>
              </tr>
            </thead>
            <tbody>
              {stats.users.map((u, i) => (
                <tr key={`${u.email}-${i}`} className="border-t border-slate-800">
                  <td className="py-3 pr-4 font-medium">{u.email ?? '—'}</td>
                  <td className="py-3 pr-4 text-slate-300">{formatDate(u.created_at)}</td>
                  <td className="py-3 pr-4 text-slate-300">{formatDate(u.last_sign_in_at)}</td>
                  <td className="py-3 pr-4 text-slate-300">{u.lessons_done}</td>
                  <td className="py-3 pr-4 text-slate-300">{u.points}</td>
                  <td className="py-3 text-slate-300">{u.streak}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-500 mt-4">
            Стрик осында соңғы сақталған мән болып көрінеді: үзілген стрик кабинетте 0 болып көрсетіледі.
          </p>
        </div>
      </div>
    </div>
  )
}