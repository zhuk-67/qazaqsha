'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { situations, type Situation } from '@/lib/situations'
import { addHistory } from '@/lib/history'
import PracticeCard from '@/components/PracticeCard'

const STORE = 'qq_situations_best'

function loadBest(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORE)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

export default function SituationsPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [best, setBest] = useState<Record<string, number>>({})
  const [active, setActive] = useState<Situation | null>(null)
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
      else {
        setBest(loadBest())
        setReady(true)
      }
    }
    check()
  }, [router])

  function start(s: Situation) {
    setActive(s)
    setI(0)
    setScore(0)
    setAnswered(false)
    setFinished(false)
  }

  const shell = (children: ReactNode) => (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-teal-300 font-bold hover:text-teal-200">
            ← QAZIR
          </Link>
          <span className="text-xs text-slate-400">Өмірлік жағдайлар</span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </main>
  )

  if (!ready) return shell(<p className="text-slate-400">Жүктелуде...</p>)

  if (active && finished) {
    return shell(
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-sm text-slate-400">{active.title}</p>
        <p className="text-5xl font-extrabold text-teal-400 my-2">
          {score} / {active.steps.length}
        </p>
        <p className="text-sm text-slate-400">{score === active.steps.length ? 'Тамаша, диалог сәтті аяқталды!' : 'Қателерді қарап шығып, диалогты қайта өтіп көріңіз.'}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => start(active)} className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-bold text-sm">
            Қайта өту
          </button>
          <button onClick={() => setActive(null)} className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm">
            Басқа жағдай
          </button>
        </div>
      </div>,
    )
  }

  if (active) {
    const step = { ...active.steps[i], tag: active.title }
    return shell(
      <div>
        <p className="text-xs text-slate-400 mb-1">
          {active.title} · {i + 1} / {active.steps.length}
        </p>
        <p className="text-sm text-slate-300 mb-4">{active.intro}</p>
        <PracticeCard
          key={i}
          q={step}
          onDone={(ok) => {
            setAnswered(true)
            if (ok) setScore((s) => s + 1)
          }}
        />
        {answered && (
          <button
            onClick={() => {
              if (i + 1 >= active.steps.length) {
                const all = loadBest()
                if (score > (all[active.id] ?? -1)) {
                  all[active.id] = score
                  try {
                    localStorage.setItem(STORE, JSON.stringify(all))
                  } catch {
                    // сақтау мүмкін болмаса, өткізіп жібереміз
                  }
                  setBest(all)
                }
                addHistory(`situation:${active.id}`, score, active.steps.length)
                setFinished(true)
              } else {
                setI(i + 1)
                setAnswered(false)
              }
            }}
            className="mt-5 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm"
          >
            {i + 1 >= active.steps.length ? 'Нәтижені көру' : 'Келесі →'}
          </button>
        )}
      </div>,
    )
  }

  return shell(
    <div>
      <h1 className="text-3xl font-extrabold mb-2">Өмірлік жағдайлар</h1>
      <p className="text-slate-300 mb-6">Күнделікті диалогтар: жағдайды оқыңыз, дұрыс жауапты таңдаңыз немесе жазыңыз.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {situations.map((s) => (
          <button key={s.id} onClick={() => start(s)} className="text-left rounded-xl border border-slate-800 bg-slate-900 hover:border-teal-500 p-4 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 text-[11px] font-bold rounded border border-teal-500/20">{s.level}</span>
              {best[s.id] !== undefined && (
                <span className="ml-auto text-[11px] font-bold text-emerald-400">
                  {best[s.id]} / {s.steps.length}
                </span>
              )}
            </div>
            <p className="font-bold text-white">{s.title}</p>
            <p className="text-xs text-slate-400 mt-1">{s.intro}</p>
          </button>
        ))}
      </div>
    </div>,
  )
}
