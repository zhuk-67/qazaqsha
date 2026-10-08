'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { levelDefs, isLevelFinished, doneInLevel, type LevelId } from '@/lib/levels'
import { buildCheckpoint, loadCheckpoints, saveCheckpoint, PASS_PERCENT } from '@/lib/checkpoint'
import { addHistory } from '@/lib/history'
import type { PQ } from '@/lib/practice'
import PracticeCard from '@/components/PracticeCard'

export default function CheckpointPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const [cps, setCps] = useState<Record<string, number>>({})
  const [level, setLevel] = useState<LevelId | null>(null)
  const [items, setItems] = useState<PQ[]>([])
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [finished, setFinished] = useState(false)

  function start(l: LevelId) {
    setItems(buildCheckpoint(l))
    setLevel(l)
    setI(0)
    setScore(0)
    setAnswered(false)
    setFinished(false)
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
      setCps(loadCheckpoints())
      setReady(true)
      const hash = window.location.hash.replace('#', '')
      const def = levelDefs.find((l) => l.id === hash)
      if (def && isLevelFinished(def, c)) start(def.id)
    }
    load()
  }, [router])

  const shell = (children: ReactNode) => (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link href="/path" className="text-sm text-teal-300 font-bold hover:text-teal-200">
            ← Оқу жолы
          </Link>
          <span className="text-xs text-slate-400">Checkpoint-тест</span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </main>
  )

  if (!ready) return shell(<p className="text-slate-400">Жүктелуде...</p>)

  if (level && finished) {
    const percent = Math.round((score / items.length) * 100)
    const passed = percent >= PASS_PERCENT
    return shell(
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-sm text-slate-400">Checkpoint {level}</p>
        <p className={`text-5xl font-extrabold my-2 ${passed ? 'text-emerald-400' : 'text-red-400'}`}>{percent}%</p>
        <p className="text-slate-300">
          {score} / {items.length} дұрыс жауап
        </p>
        <p className="text-sm mt-3 text-slate-400">
          {passed ? 'Тест тапсырылды. Келесі деңгейге сеніммен өте аласыз.' : `Өту үшін кемінде ${PASS_PERCENT}% керек. Сабақтар мен «Қате дәптерін» қайталап, қайта тапсырыңыз.`}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => start(level)} className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-bold text-sm">
            Қайта тапсыру
          </button>
          <Link href="/path" className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm">
            Оқу жолына
          </Link>
        </div>
      </div>,
    )
  }

  if (level) {
    return shell(
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>
            Checkpoint {level} · {i + 1} / {items.length}
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
                const percent = Math.round((score / items.length) * 100)
                setCps(saveCheckpoint(level, percent))
                addHistory(`checkpoint:${level}`, score, items.length)
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

  return shell(
    <div>
      <h1 className="text-3xl font-extrabold mb-2">Checkpoint-тесттер</h1>
      <p className="text-slate-300 mb-6">Деңгейдің барлық сабағын аяқтағаннан кейін ашылады: 18 сұрақ, өту үшін {PASS_PERCENT}%.</p>
      <div className="space-y-3">
        {levelDefs.map((l) => {
          const fin = isLevelFinished(l, completed)
          const cp = cps[l.id]
          return (
            <div key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
              <div>
                <p className="font-bold">{l.title}</p>
                <p className="text-xs text-slate-500">
                  {fin ? (cp !== undefined ? `Ең жақсы нәтиже: ${cp}%` : 'Әлі тапсырылмаған') : `Сабақтар: ${doneInLevel(l, completed)} / ${l.lessons.length}`}
                </p>
              </div>
              {fin ? (
                <button onClick={() => start(l.id)} className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold">
                  Тапсыру
                </button>
              ) : (
                <span className="text-xs text-slate-500">🔒 жабық</span>
              )}
            </div>
          )
        })}
      </div>
    </div>,
  )
}
