'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { allEntries, type DictEntry } from '@/lib/lexicon'
import { errorItems, oddItems } from '@/lib/games'
import { pick } from '@/lib/practice'
import { shuffle } from '@/lib/helpers'
import { addHistory } from '@/lib/history'

type GameId = 'order' | 'error' | 'match' | 'blank' | 'odd'

const GAMES: { id: GameId; icon: string; title: string; desc: string; rounds: number }[] = [
  { id: 'order', icon: '🧱', title: 'Сөйлем құрау', desc: 'Сөздерден дұрыс сөйлем жина', rounds: 6 },
  { id: 'error', icon: '🔎', title: 'Қатені тап', desc: 'Сөйлемдегі қате сөзді тап', rounds: 8 },
  { id: 'match', icon: '🧩', title: 'Сәйкестендіру', desc: 'Қазақша сөзге аударманы тап', rounds: 4 },
  { id: 'blank', icon: '✏️', title: 'Сөзді қой', desc: 'Сөйлемдегі бос орынға сөз таңда', rounds: 8 },
  { id: 'odd', icon: '🎯', title: 'Артығын тап', desc: 'Топқа жатпайтын сөзді тап', rounds: 8 },
]

type Round =
  | { t: 'order'; ru: string; words: string[]; answer: string }
  | { t: 'error'; words: string[]; wrong: number; fix: string; explain: string; ru: string; level: string }
  | { t: 'match'; pairs: [string, string][] }
  | { t: 'blank'; sentence: string; ru: string; options: string[]; answer: string; explain: string }
  | { t: 'odd'; words: string[]; odd: string; explain: string }

const TOKEN = /[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]+(?:-[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]+)*/g

function build(game: GameId, entries: DictEntry[]): Round[] {
  const n = GAMES.find((g) => g.id === game)?.rounds ?? 6
  const rnd = Math.random
  if (game === 'order') {
    const src = entries.filter((e) => e.exKk && e.exRu && e.exKk.split(' ').length >= 3 && e.exKk.split(' ').length <= 7)
    const seen = new Set<string>()
    const out: Round[] = []
    for (const e of pick(src, src.length, rnd)) {
      if (seen.has(e.exKk as string)) continue
      seen.add(e.exKk as string)
      out.push({ t: 'order', ru: e.exRu as string, words: (e.exKk as string).split(' '), answer: e.exKk as string })
      if (out.length === n) break
    }
    return out
  }
  if (game === 'error') return pick(errorItems, n, rnd).map((e) => ({ t: 'error', ...e }))
  if (game === 'odd') return pick(oddItems, n, rnd).map((o) => ({ t: 'odd', words: shuffle(o.words), odd: o.words[o.odd], explain: o.explain }))
  if (game === 'match') {
    const src = entries.filter((e) => e.ru.length <= 22 && !e.ru.includes(';') && !e.kk.includes(' '))
    const out: Round[] = []
    const pool = pick(src, src.length, rnd)
    for (let r = 0; r < n; r++) {
      const used = new Set<string>()
      const pairs: [string, string][] = []
      for (const e of pool.slice(r * 12)) {
        if (used.has(e.ru)) continue
        used.add(e.ru)
        pairs.push([e.kk, e.ru])
        if (pairs.length === 5) break
      }
      if (pairs.length === 5) out.push({ t: 'match', pairs })
    }
    return out
  }
  // blank
  const out: Round[] = []
  const withEx = entries.filter((e) => e.pos && e.exKk && e.exRu)
  for (const e of pick(withEx, withEx.length, rnd)) {
    const tokens = (e.exKk as string).match(TOKEN) ?? []
    const tok = tokens.find((t) => t.toLowerCase() === e.kk.toLowerCase())
    if (!tok) continue
    const same = entries.filter((x) => x.pos === e.pos && x.kk !== e.kk && !x.kk.includes(' '))
    const wrong = pick(same, 3, rnd).map((x) => x.kk.toLowerCase())
    if (wrong.length < 3) continue
    const sentence = (e.exKk as string).replace(tok, '____')
    out.push({
      t: 'blank',
      sentence,
      ru: e.exRu as string,
      options: shuffle([tok.toLowerCase(), ...wrong]),
      answer: tok.toLowerCase(),
      explain: `${e.exKk} — ${e.exRu}`,
    })
    if (out.length === n) break
  }
  return out
}

function RoundView({ round, onDone }: { round: Round; onDone: (ok: boolean) => void }) {
  const [sel, setSel] = useState<string | number | null>(null)
  const [chosen, setChosen] = useState<number[]>([])
  const [vals, setVals] = useState<string[]>(round.t === 'match' ? round.pairs.map(() => '') : [])
  const [result, setResult] = useState<boolean | null>(null)
  const bank = useMemo(() => (round.t === 'order' ? shuffle(round.words.map((w, i) => ({ w, i }))) : []), [round])
  const right = useMemo(() => (round.t === 'match' ? shuffle(round.pairs.map((p) => p[1])) : []), [round])

  function finish(ok: boolean) {
    if (result !== null) return
    setResult(ok)
    onDone(ok)
  }

  const optCls = (isRight: boolean, isPicked: boolean) => {
    if (result === null) return 'border-slate-700 bg-slate-950 text-slate-200 hover:border-teal-500'
    if (isRight) return 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
    if (isPicked) return 'border-red-500 bg-red-500/10 text-red-300'
    return 'border-slate-800 bg-slate-950 text-slate-500'
  }
  const btn = 'px-4 py-2.5 rounded-xl border text-sm font-medium transition-all'

  let body: ReactNode = null
  let feedback = ''

  if (round.t === 'order') {
    const placed = chosen.map((i) => round.words[i]).join(' ')
    body = (
      <>
        <p className="font-semibold text-white mb-3">Сөйлем құраңыз: «{round.ru}»</p>
        <div className="min-h-[52px] mb-3 flex flex-wrap gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-3">
          {chosen.length === 0 && <span className="text-sm text-slate-500">Сөздерді ретімен басыңыз</span>}
          {chosen.map((i, k) => (
            <span key={k} className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-sm font-medium">
              {round.words[i]}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {bank.map((b) => (
            <button key={b.i} disabled={chosen.includes(b.i) || result !== null} onClick={() => setChosen([...chosen, b.i])} className={`${btn} border-slate-700 bg-slate-900 text-slate-200 hover:border-teal-500 disabled:opacity-30`}>
              {b.w}
            </button>
          ))}
          {result === null && (
            <button onClick={() => setChosen([])} className={`${btn} border-slate-700 text-xs text-slate-400`}>
              Тазалау
            </button>
          )}
        </div>
        {result === null && (
          <button disabled={chosen.length !== round.words.length} onClick={() => finish(placed === round.answer)} className="mt-4 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 text-sm font-bold">
            Тексеру
          </button>
        )}
      </>
    )
    feedback = `Дұрыс жауап: ${round.answer}`
  } else if (round.t === 'error') {
    body = (
      <>
        <p className="font-semibold text-white mb-1">Қате сөзді табыңыз.</p>
        <p className="text-xs text-slate-500 mb-3">{round.ru}</p>
        <div className="flex flex-wrap gap-2">
          {round.words.map((w, i) => (
            <button
              key={i}
              disabled={result !== null}
              onClick={() => {
                setSel(i)
                finish(i === round.wrong)
              }}
              className={`${btn} ${optCls(i === round.wrong, sel === i)}`}
            >
              {w}
            </button>
          ))}
        </div>
      </>
    )
    feedback = `Дұрысы: ${round.fix}. ${round.explain}`
  } else if (round.t === 'blank') {
    body = (
      <>
        <p className="font-semibold text-white mb-1">{round.sentence}</p>
        <p className="text-xs text-slate-500 mb-3">{round.ru}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {round.options.map((o) => (
            <button
              key={o}
              disabled={result !== null}
              onClick={() => {
                setSel(o)
                finish(o === round.answer)
              }}
              className={`${btn} text-left ${optCls(o === round.answer, sel === o)}`}
            >
              {o}
            </button>
          ))}
        </div>
      </>
    )
    feedback = round.explain
  } else if (round.t === 'odd') {
    body = (
      <>
        <p className="font-semibold text-white mb-3">Артық сөзді табыңыз.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {round.words.map((w) => (
            <button
              key={w}
              disabled={result !== null}
              onClick={() => {
                setSel(w)
                finish(w === round.odd)
              }}
              className={`${btn} ${optCls(w === round.odd, sel === w)}`}
            >
              {w}
            </button>
          ))}
        </div>
      </>
    )
    feedback = round.explain
  } else {
    body = (
      <>
        <p className="font-semibold text-white mb-3">Әр қазақша сөзге аударманы таңдаңыз.</p>
        <div className="space-y-2">
          {round.pairs.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-36 font-bold text-white">{p[0]}</span>
              <select
                value={vals[i]}
                disabled={result !== null}
                onChange={(e) => {
                  const next = [...vals]
                  next[i] = e.target.value
                  setVals(next)
                }}
                className={`flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none bg-slate-950 ${result !== null ? (vals[i] === p[1] ? 'border-emerald-500 text-emerald-300' : 'border-red-500 text-red-300') : 'border-slate-700 text-slate-200 focus:border-teal-500'}`}
              >
                <option value="">Таңдаңыз</option>
                {right.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        {result === null && (
          <button disabled={vals.some((v) => !v)} onClick={() => finish(round.pairs.every((p, i) => vals[i] === p[1]))} className="mt-4 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 text-sm font-bold">
            Тексеру
          </button>
        )}
      </>
    )
    feedback = round.pairs.map((p) => `${p[0]} = ${p[1]}`).join('; ')
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      {body}
      {result !== null && (
        <p className={`mt-4 text-sm ${result ? 'text-emerald-400' : 'text-red-400'}`}>
          <span className="font-bold">{result ? 'Дұрыс. ' : 'Қате. '}</span>
          <span className="text-slate-300">{feedback}</span>
        </p>
      )}
    </div>
  )
}

export default function GamesPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [game, setGame] = useState<GameId | null>(null)
  const [rounds, setRounds] = useState<Round[]>([])
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
      else setReady(true)
    }
    check()
  }, [router])

  function start(g: GameId) {
    setRounds(build(g, allEntries()))
    setGame(g)
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
          <span className="text-xs text-slate-400">Ойын жаттығулары</span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </main>
  )

  if (!ready) return shell(<p className="text-slate-400">Жүктелуде...</p>)

  const info = GAMES.find((g) => g.id === game)

  if (game && finished) {
    return shell(
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-sm text-slate-400">{info?.title}</p>
        <p className="text-5xl font-extrabold text-teal-400 my-2">
          {score} / {rounds.length}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => start(game)} className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm">
            Тағы ойнау
          </button>
          <button onClick={() => setGame(null)} className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-bold text-sm">
            Басқа ойын
          </button>
        </div>
      </div>,
    )
  }

  if (game) {
    return shell(
      rounds.length === 0 ? (
        <p className="text-slate-400">Бұл ойын үшін сұрақ құрастырылмады.</p>
      ) : (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>
              {info?.title} · {i + 1} / {rounds.length}
            </span>
            <span>Ұпай: {score}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 mb-5 overflow-hidden">
            <div className="h-full bg-teal-500 transition-all" style={{ width: `${(i / rounds.length) * 100}%` }} />
          </div>
          <RoundView
            key={i}
            round={rounds[i]}
            onDone={(ok) => {
              setAnswered(true)
              if (ok) setScore((s) => s + 1)
            }}
          />
          {answered && (
            <button
              onClick={() => {
                if (i + 1 >= rounds.length) {
                  addHistory(`game:${game}`, score, rounds.length)
                  setFinished(true)
                } else {
                  setI(i + 1)
                  setAnswered(false)
                }
              }}
              className="mt-5 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm"
            >
              {i + 1 >= rounds.length ? 'Нәтижені көру' : 'Келесі →'}
            </button>
          )}
        </div>
      ),
    )
  }

  return shell(
    <div>
      <h1 className="text-3xl font-extrabold mb-2">Ойын жаттығулары</h1>
      <p className="text-slate-300 mb-6">Бес түрлі ойын: сөйлем құрау, қате табу, сәйкестендіру, сөз қою және артығын табу.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {GAMES.map((g) => (
          <button key={g.id} onClick={() => start(g.id)} className="text-left rounded-xl border border-slate-800 bg-slate-900 hover:border-teal-500 p-4 transition-all">
            <p className="text-2xl mb-1">{g.icon}</p>
            <p className="font-bold text-white">{g.title}</p>
            <p className="text-xs text-slate-400 mt-1">{g.desc}</p>
          </button>
        ))}
      </div>
    </div>,
  )
}
