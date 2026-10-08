'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { levelDefs, doneInLevel, isLevelFinished, isLevelUnlocked, currentLevelId } from '@/lib/levels'
import { loadCheckpoints, PASS_PERCENT } from '@/lib/checkpoint'

export default function PathPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const [cps, setCps] = useState<Record<string, number>>({})

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase.from('profiles').select('completed_lessons').eq('id', user.id).maybeSingle()
      setCompleted((data?.completed_lessons as string[] | null) ?? [])
      setCps(loadCheckpoints())
      setReady(true)
    }
    load()
  }, [router])

  const shell = (children: ReactNode) => (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-teal-300 font-bold hover:text-teal-200">
            ← QAZIR
          </Link>
          <span className="text-xs text-slate-400">Оқу жолы</span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </main>
  )

  if (!ready) return shell(<p className="text-slate-400">Жүктелуде...</p>)

  const current = currentLevelId(completed)

  return shell(
    <div>
      <h1 className="text-3xl font-extrabold mb-2">Оқу жолы</h1>
      <p className="text-slate-300 mb-8">A1-ден C1-ге дейінгі жол. Әр деңгейдің соңында checkpoint-тест бар (өту үшін {PASS_PERCENT}%).</p>

      <div className="relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-800" />
        {levelDefs.map((lvl, li) => {
          const unlocked = isLevelUnlocked(li, completed)
          const done = doneInLevel(lvl, completed)
          const finished = isLevelFinished(lvl, completed)
          const cp = cps[lvl.id]
          const firstOpen = lvl.lessons.find((l) => !completed.includes(l.id))
          return (
            <section key={lvl.id} className="relative pl-14 pb-10">
              <div
                className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm border-2 ${
                  finished ? 'bg-emerald-500 border-emerald-400 text-slate-950' : unlocked ? 'bg-teal-500/20 border-teal-400 text-teal-300' : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                {finished ? '✓' : lvl.id}
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold">{lvl.title}</h2>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {done} / {lvl.lessons.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">{lvl.subtitle}</p>
              {lvl.id === current && <p className="text-xs text-teal-300 font-bold mb-2">Қазір осы деңгейдесіз</p>}

              <div className="space-y-2">
                {lvl.lessons.map((l) => {
                  const isDone = completed.includes(l.id)
                  const isNext = unlocked && firstOpen?.id === l.id
                  const body = (
                    <div
                      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm ${
                        isDone ? 'border-emerald-500/30 bg-slate-900' : isNext ? 'border-teal-500/60 bg-slate-900' : 'border-slate-800 bg-slate-900/50'
                      } ${!unlocked ? 'opacity-50' : ''}`}
                    >
                      <span>{isDone ? '✅' : unlocked ? l.icon : '🔒'}</span>
                      <span className="flex-1">{l.title}</span>
                      {isNext && <span className="text-[11px] font-bold text-teal-300">Келесі</span>}
                    </div>
                  )
                  return unlocked ? (
                    <Link key={l.id} href={`/lesson/${l.id}`} className="block hover:opacity-90">
                      {body}
                    </Link>
                  ) : (
                    <div key={l.id}>{body}</div>
                  )
                })}

                {/* Checkpoint */}
                {finished ? (
                  <Link
                    href={`/checkpoint#${lvl.id}`}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold ${
                      cp !== undefined && cp >= PASS_PERCENT ? 'border-emerald-500/40 text-emerald-300 bg-slate-900' : 'border-teal-500/60 text-teal-300 bg-slate-900'
                    }`}
                  >
                    <span>🏁</span>
                    <span className="flex-1">Checkpoint {lvl.id}</span>
                    <span className="text-xs">
                      {cp !== undefined ? (cp >= PASS_PERCENT ? `Тапсырылды ${cp}%` : `Ең жақсы: ${cp}% — қайта тапсыру`) : 'Тапсыру'}
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-800 px-4 py-3 text-sm text-slate-500 bg-slate-900/50">
                    <span>🔒</span>
                    <span>Checkpoint {lvl.id}: деңгейдің сабақтарын аяқтағанда ашылады</span>
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>,
  )
}
