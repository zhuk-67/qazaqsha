'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { lessonContent } from '@/lib/lessons'
import { loadHistory, localDay, type HistoryEntry } from '@/lib/history'
import { loadSrs } from '@/lib/srs'
import { loadMyWords } from '@/lib/mywords'
import { loadCheckpoints, PASS_PERCENT } from '@/lib/checkpoint'
import { situations } from '@/lib/situations'

interface Item {
  at: string
  title: string
  icon: string
  score: number
  total: number
}

interface Challenge {
  icon: string
  title: string
  desc: string
  value: number
  goal: number
  weekly: boolean
}

type Tab = 'history' | 'challenges'

function kindInfo(e: HistoryEntry): { title: string; icon: string } {
  if (e.kind === 'daily') return { title: 'Күннің тапсырмасы', icon: '📅' }
  if (e.kind === 'quick') return { title: '5 минуттық жаттығу', icon: '⏱️' }
  if (e.kind.startsWith('checkpoint:')) return { title: `Checkpoint ${e.kind.split(':')[1]}`, icon: '🏁' }
  if (e.kind.startsWith('game:')) {
    const names: Record<string, string> = { order: 'Сөйлем құрау', error: 'Қатені тап', match: 'Сәйкестендіру', blank: 'Сөзді қой', odd: 'Артығын тап' }
    return { title: `Ойын: ${names[e.kind.split(':')[1]] ?? e.kind}`, icon: '🎮' }
  }
  if (e.kind.startsWith('situation:')) {
    const sit = situations.find((x) => x.id === e.kind.split(':')[1])
    return { title: `Жағдай: ${sit?.title ?? e.kind}`, icon: '💬' }
  }
  return { title: e.kind, icon: '📝' }
}

function readNumKeys(key: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

export default function HistoryPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<Tab>('history')
  const [items, setItems] = useState<Item[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const local = loadHistory()
      const list: Item[] = local.map((e) => ({ at: e.at, ...kindInfo(e), score: e.score, total: e.total }))

      const { data, error: err } = await supabase
        .from('lesson_attempts')
        .select('lesson_id, score, total, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200)
      if (err) setError(err.message)
      for (const a of (data ?? []) as { lesson_id: string; score: number; total: number; created_at: string }[]) {
        list.push({
          at: a.created_at,
          title: lessonContent[a.lesson_id]?.title ?? a.lesson_id,
          icon: '📚',
          score: a.score,
          total: a.total,
        })
      }
      list.sort((a, b) => (a.at < b.at ? 1 : -1))
      setItems(list.slice(0, 150))

      // Челлендждер
      const weekAgo = Date.now() - 7 * 24 * 3600 * 1000
      const week = local.filter((e) => new Date(e.at).getTime() >= weekAgo)
      const dailyDays = new Set(week.filter((e) => e.kind === 'daily').map((e) => localDay(e.at)))
      const quickGood = week.filter((e) => e.kind === 'quick' && e.total >= 10 && e.score / e.total >= 0.8).length
      const srs = Object.values(loadSrs()).filter((e) => e.box >= 2).length
      const mine = loadMyWords().length
      const cps = Object.values(loadCheckpoints()).filter((p) => p >= PASS_PERCENT).length
      const texts = Object.keys(readNumKeys('qq_texts_best')).length
      const grammar = Object.values(readNumKeys('qq_grammar_best')).filter((p) => p >= 80).length
      setChallenges([
        { icon: '📅', title: 'Күннің тапсырмасын 3 күн орында', desc: 'Соңғы 7 күн ішінде', value: dailyDays.size, goal: 3, weekly: true },
        { icon: '⏱️', title: '5 минуттық жаттығу: 10+ жауап, 80%-дан жоғары', desc: 'Соңғы 7 күн ішінде', value: quickGood, goal: 1, weekly: true },
        { icon: '🧩', title: '20 сөзді жақсы біл', desc: 'Қайталауда қорапшасы 3+ сөздер', value: srs, goal: 20, weekly: false },
        { icon: '⭐', title: '10 сөзден «Менің сөздерім» жина', desc: 'Сөздікте немесе мәтіндерде сөз қос', value: mine, goal: 10, weekly: false },
        { icon: '🏁', title: 'Бір checkpoint-ті тапсыр', desc: `${PASS_PERCENT}% және одан жоғары`, value: cps, goal: 1, weekly: false },
        { icon: '📰', title: '3 мәтінді сұрақтарымен орында', desc: 'Қазақша мәтіндер бөлімі', value: texts, goal: 3, weekly: false },
        { icon: '🧠', title: '5 грамматика тақырыбының тестін 80%+ тапсыр', desc: 'Грамматика бөлімі', value: grammar, goal: 5, weekly: false },
      ])
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
          <span className="text-xs text-slate-400">Тарих және челлендждер</span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </main>
  )

  if (!ready) return shell(<p className="text-slate-400">Жүктелуде...</p>)

  const chip = (a: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold border ${a ? 'bg-teal-500 text-slate-950 border-teal-500' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-teal-500'}`

  const month = Date.now() - 30 * 24 * 3600 * 1000
  const activeDays = new Set(items.filter((i) => new Date(i.at).getTime() >= month).map((i) => localDay(i.at))).size
  const doneChallenges = challenges.filter((c) => c.value >= c.goal).length

  const groups: { day: string; rows: Item[] }[] = []
  for (const it of items) {
    const d = localDay(it.at)
    const last = groups[groups.length - 1]
    if (last && last.day === d) last.rows.push(it)
    else groups.push({ day: d, rows: [it] })
  }

  return shell(
    <div>
      <h1 className="text-3xl font-extrabold mb-4">Тарих және челлендждер</h1>
      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('history')} className={chip(tab === 'history')}>
          Оқу тарихы
        </button>
        <button onClick={() => setTab('challenges')} className={chip(tab === 'challenges')}>
          Челлендждер ({doneChallenges} / {challenges.length})
        </button>
      </div>
      {error && <p className="text-sm text-red-400 mb-3">Сабақ тарихын жүктеу қатесі: {error}</p>}

      {tab === 'history' && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs text-slate-400">Әрекеттер</p>
              <p className="text-2xl font-extrabold mt-1">{items.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs text-slate-400">Белсенді күн (30 күнде)</p>
              <p className="text-2xl font-extrabold mt-1">{activeDays}</p>
            </div>
          </div>
          {groups.length === 0 ? (
            <p className="text-slate-400 text-sm">Тарих әзірге бос. Сабақ өтіңіз немесе күннің тапсырмасын орындаңыз.</p>
          ) : (
            <div className="space-y-5">
              {groups.map((g) => (
                <div key={g.day}>
                  <p className="text-xs font-bold text-teal-400 mb-2">{g.day}</p>
                  <div className="space-y-2">
                    {g.rows.map((r, k) => {
                      const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0
                      return (
                        <div key={k} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm">
                          <span>{r.icon}</span>
                          <span className="flex-1 min-w-0 truncate">{r.title}</span>
                          <span className="text-xs text-slate-500">{new Date(r.at).toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className={`text-xs font-bold ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-300' : 'text-red-300'}`}>
                            {r.score}/{r.total}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-6 text-xs text-slate-500">Сабақтар тарихы аккаунтта, ал күн тапсырмасы, жаттығу және checkpoint тарихы осы құрылғыда сақталады.</p>
        </>
      )}

      {tab === 'challenges' && (
        <div className="space-y-3">
          {challenges.map((c, k) => {
            const done = c.value >= c.goal
            return (
              <div key={k} className={`rounded-2xl border p-4 ${done ? 'border-emerald-500/40 bg-slate-900' : 'border-slate-800 bg-slate-900'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{done ? '✅' : c.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{c.title}</p>
                    <p className="text-xs text-slate-500">
                      {c.weekly ? 'Апталық' : 'Жалпы'} · {c.desc}
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full ${done ? 'bg-emerald-500' : 'bg-teal-500'}`} style={{ width: `${Math.min(100, (c.value / c.goal) * 100)}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {Math.min(c.value, c.goal)} / {c.goal}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>,
  )
}
