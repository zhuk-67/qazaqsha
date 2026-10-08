'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PracticeCard from '@/components/PracticeCard'
import { pick, userWords, wordQuestions, writeQuestions, grammarQuestions, type PQ } from '@/lib/practice'
import { addHistory } from '@/lib/history'

const SECONDS = 300

function buildQuick(completed: string[]): PQ[] {
  const rnd = Math.random
  const { pool, all } = userWords(completed)
  const mixed = [
    ...grammarQuestions(completed, 25, rnd),
    ...wordQuestions(pool, all, 15, rnd),
    ...wordQuestions(pool, all, 5, rnd, true),
    ...writeQuestions(pool, all, 8, rnd),
  ]
  return pick(mixed, mixed.length, rnd)
}

export default function QuickPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState<string[]>([])
  const [items, setItems] = useState<PQ[]>([])
  const [running, setRunning] = useState(false)
  const [left, setLeft] = useState(SECONDS)
  const [i, setI] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [over, setOver] = useState(false)
  const savedRef = useRef(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase.from('profiles').select('completed_lessons').eq('id', user.id).maybeSingle()
      setCompleted((data?.completed_lessons as string[] | null) ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [running])

  useEffect(() => {
    if (running && left <= 0) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, running])

  function start() {
    const list = buildQuick(completed)
    setItems(list)
    setI(0)
    setCorrect(0)
    setAnsweredCount(0)
    setAnswered(false)
    setLeft(SECONDS)
    setOver(false)
    savedRef.current = false
    setRunning(true)
  }

  function finish() {
    setRunning(false)
    setOver(true)
  }

  useEffect(() => {
    if (over && !savedRef.current && answeredCount > 0) {
      savedRef.current = true
      addHistory('quick', correct, answeredCount)
    }
  }, [over, answeredCount, correct])

  const shell = (children: ReactNode) => (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-teal-300 font-bold hover:text-teal-200">
            ← QAZIR
          </Link>
          <span className="text-xs text-slate-400">5 минуттық жаттығу</span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </main>
  )

  if (loading) return shell(<p className="text-slate-400">Жүктелуде...</p>)

  if (over) {
    const percent = answeredCount ? Math.round((correct / answeredCount) * 100) : 0
    return shell(
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-sm text-slate-400">Жаттығу аяқталды</p>
        <p className="text-5xl font-extrabold text-teal-400 my-2">{correct}</p>
        <p className="text-slate-300 text-sm">
          дұрыс жауап · барлығы {answeredCount} сұраққа жауап берілді{answeredCount > 0 && ` · ${percent}%`}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={start} className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm">
            Тағы 5 минут
          </button>
          <Link href="/" className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-bold text-sm">
            Басты бет
          </Link>
        </div>
      </div>,
    )
  }

  if (!running) {
    return shell(
      <div>
        <h1 className="text-3xl font-extrabold mb-2">5 минуттық жаттығу</h1>
        <p className="text-slate-300 mb-6">
          Бес минут ішінде мүмкіндігінше көп сұраққа жауап беріңіз: грамматика, сөздер, тыңдау және жазу араласып келеді.
        </p>
        <button onClick={start} className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold">
          Бастау
        </button>
      </div>,
    )
  }

  const mm = String(Math.floor(Math.max(left, 0) / 60)).padStart(1, '0')
  const ss = String(Math.max(left, 0) % 60).padStart(2, '0')
  const q = items[i]

  return shell(
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className={`text-2xl font-extrabold ${left <= 30 ? 'text-red-400' : 'text-teal-400'}`}>
          {mm}:{ss}
        </span>
        <span className="text-xs text-slate-400">Дұрыс: {correct} · Жауап: {answeredCount}</span>
        <button onClick={finish} className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-red-300">
          Аяқтау
        </button>
      </div>
      {q ? (
        <>
          <PracticeCard
            key={i}
            q={q}
            onDone={(ok) => {
              setAnswered(true)
              setAnsweredCount((n) => n + 1)
              if (ok) setCorrect((c) => c + 1)
            }}
          />
          {answered && (
            <button
              onClick={() => {
                if (i + 1 >= items.length) finish()
                else {
                  setI(i + 1)
                  setAnswered(false)
                }
              }}
              className="mt-5 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm"
            >
              Келесі →
            </button>
          )}
        </>
      ) : (
        <p className="text-slate-400">Сұрақтар құрастырылмады. Алдымен бір сабақ өтіңіз.</p>
      )}
    </div>,
  )
}
