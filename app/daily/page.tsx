'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PracticeCard from '@/components/PracticeCard'
import { seeded, userWords, wordQuestions, writeQuestions, grammarQuestions, type PQ } from '@/lib/practice'
import { addHistory, loadHistory, localDay } from '@/lib/history'
import { todayStr } from '@/lib/srs'

function buildDaily(completed: string[], day: string): PQ[] {
  const rnd = seeded(`daily-${day}`)
  const { pool, all } = userWords(completed)
  return [
    ...grammarQuestions(completed, 3, rnd),
    ...wordQuestions(pool, all, 3, rnd),
    ...wordQuestions(pool, all, 2, rnd, true),
    ...writeQuestions(pool, all, 2, rnd),
  ]
}

export default function DailyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState<string[]>([])
  const [items, setItems] = useState<PQ[]>([])
  const [started, setStarted] = useState(false)
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [finished, setFinished] = useState(false)
  const [doneToday, setDoneToday] = useState<{ score: number; total: number } | null>(null)
  const [dailyStreak, setDailyStreak] = useState(0)

  const today = todayStr()

  function refreshHistory() {
    const h = loadHistory().filter((e) => e.kind === 'daily')
    const days = new Set(h.map((e) => localDay(e.at)))
    const last = [...h].reverse().find((e) => localDay(e.at) === today)
    setDoneToday(last ? { score: last.score, total: last.total } : null)
    let streak = 0
    const d = new Date()
    if (!days.has(today)) d.setDate(d.getDate() - 1)
    while (days.has(localDay(d.toISOString()))) {
      streak += 1
      d.setDate(d.getDate() - 1)
    }
    setDailyStreak(streak)
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase.from('profiles').select('completed_lessons').eq('id', user.id).maybeSingle()
      const c = (data?.completed_lessons as string[] | null) ?? []
      setCompleted(c)
      setItems(buildDaily(c, today))
      refreshHistory()
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const shell = (children: ReactNode) => (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-teal-300 font-bold hover:text-teal-200">
            ← QAZIR
          </Link>
          <span className="text-xs text-slate-400">Күннің тапсырмасы</span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </main>
  )

  if (loading) return shell(<p className="text-slate-400">Жүктелуде...</p>)

  if (finished) {
    return shell(
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-sm text-slate-400">Күннің тапсырмасы аяқталды</p>
        <p className="text-5xl font-extrabold text-teal-400 my-2">
          {score} / {items.length}
        </p>
        <p className="text-slate-300 text-sm">Ертең жаңа тапсырмалар шығады.</p>
        <p className="text-slate-400 text-sm mt-1">Қатарынан күн: {dailyStreak}</p>
        <Link href="/" className="mt-6 inline-block px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm">
          Басты бетке
        </Link>
      </div>,
    )
  }

  if (!started) {
    const blocks: [string, number][] = []
    for (const q of items) {
      const last = blocks[blocks.length - 1]
      if (last && last[0] === q.tag) last[1] += 1
      else blocks.push([q.tag, 1])
    }
    return shell(
      <div>
        <h1 className="text-3xl font-extrabold mb-2">Күннің тапсырмасы</h1>
        <p className="text-slate-300 mb-5">Бүгінгі шағын жиынтық: грамматика, сөздер, тыңдау және жазу. Күн сайын тапсырмалар өзгереді.</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {blocks.map(([t, n], k) => (
            <span key={k} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 border border-slate-700 text-slate-300">
              {t}: {n}
            </span>
          ))}
        </div>
        {doneToday && (
          <p className="mb-4 text-sm text-emerald-400">
            Бүгін орындалды: {doneToday.score} / {doneToday.total}. Қатарынан күн: {dailyStreak}. Қаласаңыз, қайта өте аласыз.
          </p>
        )}
        {items.length === 0 ? (
          <p className="text-slate-400 text-sm">Тапсырма құрастыру үшін деректер жеткіліксіз. Алдымен бір сабақ өтіңіз.</p>
        ) : (
          <button
            onClick={() => setStarted(true)}
            className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
          >
            {doneToday ? 'Қайта өту' : 'Бастау'}
          </button>
        )}
        <p className="mt-4 text-xs text-slate-500">Нәтиже осы құрылғыда сақталады. Күн тапсырмасына ({completed.length} сабақ өтілген) өткен сабақтардағы сөздер мен деңгейіңізге сай грамматика кіреді.</p>
      </div>,
    )
  }

  return shell(
    <div>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span>
          {i + 1} / {items.length}
        </span>
        <span>Ұпай: {score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 mb-5 overflow-hidden">
        <div className="h-full bg-teal-500 transition-all" style={{ width: `${(i / items.length) * 100}%` }} />
      </div>
      <PracticeCard
        key={i}
        q={items[i]}
        onDone={(ok) => {
          setAnswered(true)
          if (ok) setScore((s) => s + 1)
        }}
      />
      {answered && (
        <button
          onClick={() => {
            if (i + 1 >= items.length) {
              // score әлі жаңартылмаған болуы мүмкін емес: жауап басылғанда бұрын есептелген
              addHistory('daily', score, items.length)
              refreshHistory()
              setFinished(true)
            } else {
              setI(i + 1)
              setAnswered(false)
            }
          }}
          className="mt-5 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm"
        >
          {i + 1 >= items.length ? 'Нәтижені көру' : 'Келесі →'}
        </button>
      )}
    </div>,
  )
}
