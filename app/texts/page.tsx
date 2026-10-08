'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { readingTexts, type ReadingText } from '@/lib/texts'
import { collectWords } from '@/lib/words'
import { addMyWord, hasMyWord } from '@/lib/mywords'
import PracticeCard from '@/components/PracticeCard'
import SpeakButton from '@/components/SpeakButton'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']
const STORE = 'qq_texts_best'
const LETTERS = 'A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі'
const WORD_RE = new RegExp(`[${LETTERS}]+(?:-[${LETTERS}]+)*|[^${LETTERS}]+`, 'g')

function loadBest(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORE)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

interface Picked {
  kk: string
  ru: string
  note?: string
  found: boolean
}

export default function TextsPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [level, setLevel] = useState('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [best, setBest] = useState<Record<string, number>>({})
  const [interactive, setInteractive] = useState(true)
  const [picked, setPicked] = useState<Picked | null>(null)
  const [added, setAdded] = useState(false)
  const [globalDict, setGlobalDict] = useState<Map<string, string>>(new Map())
  const [scores, setScores] = useState<Record<number, boolean>>({})
  const [quizKey, setQuizKey] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const m = new Map<string, string>()
      for (const w of collectWords()) if (!m.has(w.kk.toLowerCase())) m.set(w.kk.toLowerCase(), w.ru)
      setGlobalDict(m)
      setBest(loadBest())
      setReady(true)
    }
    load()
  }, [router])

  const text: ReadingText | undefined = readingTexts.find((t) => t.id === openId)

  function openText(id: string | null) {
    setOpenId(id)
    setPicked(null)
    setScores({})
    setQuizKey((k) => k + 1)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function pickWord(t: ReadingText, raw: string) {
    const key = raw.toLowerCase()
    const g = t.gloss[key]
    if (g) setPicked({ kk: raw, ru: g[0], note: g[1], found: true })
    else {
      const ru = globalDict.get(key)
      setPicked(ru ? { kk: raw, ru, found: true } : { kk: raw, ru: 'Бұл форманың аудармасы сөздікте жоқ.', found: false })
    }
    setAdded(hasMyWord(raw))
  }

  function onAnswer(t: ReadingText, i: number, ok: boolean) {
    setScores((prev) => {
      if (i in prev) return prev
      const next = { ...prev, [i]: ok }
      if (Object.keys(next).length === t.questions.length) {
        const score = Object.values(next).filter(Boolean).length
        const all = loadBest()
        if (score > (all[t.id] ?? -1)) {
          all[t.id] = score
          try {
            localStorage.setItem(STORE, JSON.stringify(all))
          } catch {
            // сақтау мүмкін болмаса, өткізіп жібереміз
          }
          setBest(all)
        }
      }
      return next
    })
  }

  const shell = (children: ReactNode) => (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-teal-300 font-bold hover:text-teal-200">
            ← QAZIR
          </Link>
          <span className="text-xs text-slate-400">Қазақша мәтіндер</span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </main>
  )

  if (!ready) return shell(<p className="text-slate-400">Жүктелуде...</p>)

  if (text) {
    const answered = Object.keys(scores).length
    const right = Object.values(scores).filter(Boolean).length
    return shell(
      <div>
        <button
          onClick={() => openText(null)}
          className="mb-5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-bold rounded-xl"
        >
          ← Барлық мәтіндер
        </button>
        <span className="px-3 py-1 bg-teal-500/10 text-teal-400 text-xs font-bold rounded-lg border border-teal-500/20">
          {text.level}
        </span>
        <h1 className="text-2xl font-extrabold mt-3">{text.title}</h1>
        <p className="text-sm text-slate-400 mb-5">{text.titleRu}</p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setInteractive(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${interactive ? 'bg-teal-500 text-slate-950 border-teal-500' : 'bg-slate-900 text-slate-300 border-slate-700'}`}
          >
            Интерактивті оқу
          </button>
          <button
            onClick={() => {
              setInteractive(false)
              setPicked(null)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${!interactive ? 'bg-teal-500 text-slate-950 border-teal-500' : 'bg-slate-900 text-slate-300 border-slate-700'}`}
          >
            Қарапайым оқу
          </button>
        </div>
        {interactive && <p className="text-xs text-slate-500 mb-3">Сөзді басыңыз, аудармасы мен түсініктемесі шығады.</p>}

        <div className="space-y-3">
          {text.body.map((p, k) => (
            <div key={k} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex items-start gap-3">
              <p className="flex-1 leading-8 text-lg">
                {interactive
                  ? (p.match(WORD_RE) ?? []).map((tok, n) =>
                      new RegExp(`^[${LETTERS}]`).test(tok) ? (
                        <button
                          key={n}
                          onClick={() => pickWord(text, tok)}
                          className={`rounded px-0.5 hover:bg-teal-500/20 hover:text-teal-300 ${picked?.kk === tok ? 'bg-teal-500/20 text-teal-300' : ''}`}
                        >
                          {tok}
                        </button>
                      ) : (
                        <span key={n}>{tok}</span>
                      ),
                    )
                  : p}
              </p>
              <SpeakButton text={p} />
            </div>
          ))}
        </div>

        {interactive && picked && (
          <div className="mt-4 rounded-2xl border border-teal-500/40 bg-slate-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-extrabold text-white">{picked.kk}</p>
                <p className={`mt-1 ${picked.found ? 'text-teal-300 font-bold' : 'text-slate-400 text-sm'}`}>{picked.ru}</p>
                {picked.note && <p className="text-sm text-slate-400 mt-1">{picked.note}</p>}
              </div>
              <SpeakButton text={picked.kk} />
            </div>
            {picked.found && (
              <button
                disabled={added}
                onClick={() => {
                  addMyWord({ kk: picked.kk.toLowerCase(), ru: picked.ru, note: picked.note, source: text.title })
                  setAdded(true)
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-bold disabled:opacity-60"
              >
                {added ? 'Менің сөздеріме қосылды ✓' : 'Менің сөздеріме қосу'}
              </button>
            )}
          </div>
        )}

        <h2 className="text-xl font-bold mt-10 mb-1">Сұрақтар</h2>
        <p className="text-sm text-slate-400 mb-4">
          {answered} / {text.questions.length} жауап · дұрыс: {right}
          {best[text.id] !== undefined && ` · ең жақсы нәтиже: ${best[text.id]} / ${text.questions.length}`}
        </p>
        <div className="space-y-4" key={`${text.id}-${quizKey}`}>
          {text.questions.map((q, i) => (
            <PracticeCard key={i} q={{ ...q, tag: `Сұрақ ${i + 1}` }} onDone={(ok) => onAnswer(text, i, ok)} />
          ))}
        </div>
        {answered === text.questions.length && (
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center">
            <p className="text-3xl font-extrabold text-teal-400">
              {right} / {text.questions.length}
            </p>
            <button
              onClick={() => {
                setScores({})
                setQuizKey((k) => k + 1)
              }}
              className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-bold rounded-xl"
            >
              Сұрақтарды қайта орындау
            </button>
          </div>
        )}
      </div>,
    )
  }

  const list = readingTexts.filter((t) => level === 'all' || t.level === level)
  const chip = (a: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${a ? 'bg-teal-500 text-slate-950 border-teal-500' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-teal-500'}`

  return shell(
    <div>
      <h1 className="text-3xl font-extrabold mb-2">Қазақша мәтіндер</h1>
      <p className="text-slate-300 mb-5">Деңгейге бейімделген мәтіндер: сөзді басып аудармасын көріңіз, сосын сұрақтарға жауап беріңіз.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setLevel('all')} className={chip(level === 'all')}>
          Барлығы
        </button>
        {LEVELS.map((l) => (
          <button key={l} onClick={() => setLevel(l)} className={chip(level === l)}>
            {l}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((t) => (
          <button
            key={t.id}
            onClick={() => openText(t.id)}
            className="text-left rounded-xl border border-slate-800 bg-slate-900 hover:border-teal-500 p-4 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 text-[11px] font-bold rounded border border-teal-500/20">{t.level}</span>
              {best[t.id] !== undefined && (
                <span className="ml-auto text-[11px] font-bold text-emerald-400">
                  {best[t.id]} / {t.questions.length}
                </span>
              )}
            </div>
            <p className="font-bold text-white">{t.title}</p>
            <p className="text-xs text-slate-400 mt-1">{t.titleRu}</p>
          </button>
        ))}
      </div>
    </div>,
  )
}
