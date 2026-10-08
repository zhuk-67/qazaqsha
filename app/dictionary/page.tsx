'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { allEntries, POS_NAMES, type DictEntry, type Pos } from '@/lib/lexicon'
import { addMyWord, loadMyWords, removeMyWord, type MyWord } from '@/lib/mywords'
import SpeakButton from '@/components/SpeakButton'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']
const POS_LIST = Object.keys(POS_NAMES) as Pos[]
const LIMIT = 40

type Tab = 'search' | 'mine'

export default function DictionaryPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<Tab>('search')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [pos, setPos] = useState<Pos | 'all'>('all')
  const [open, setOpen] = useState<string | null>(null)
  const [mine, setMine] = useState<MyWord[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setMine(loadMyWords())
      setReady(true)
    }
    load()
  }, [router])

  const entries = useMemo(() => allEntries(), [])
  const q = query.trim().toLowerCase()

  const results = useMemo(() => {
    const list = entries.filter((e) => {
      if (level !== 'all' && e.level !== level) return false
      if (pos !== 'all' && e.pos !== pos) return false
      if (!q) return true
      return e.kk.toLowerCase().includes(q) || e.ru.toLowerCase().includes(q)
    })
    list.sort((a, b) => {
      const ea = a.kk.toLowerCase() === q || a.ru.toLowerCase() === q ? 0 : 1
      const eb = b.kk.toLowerCase() === q || b.ru.toLowerCase() === q ? 0 : 1
      if (ea !== eb) return ea - eb
      const ra = a.pos ? 0 : 1
      const rb = b.pos ? 0 : 1
      if (ra !== rb) return ra - rb
      return LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level)
    })
    return list
  }, [entries, q, level, pos])

  const isMine = (kk: string) => mine.some((w) => w.kk.toLowerCase() === kk.toLowerCase())

  function toggleMine(e: DictEntry) {
    if (isMine(e.kk)) removeMyWord(e.kk)
    else addMyWord({ kk: e.kk.toLowerCase(), ru: e.ru, note: e.note, source: 'Сөздік' })
    setMine(loadMyWords())
  }

  const chip = (a: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${a ? 'bg-teal-500 text-slate-950 border-teal-500' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-teal-500'}`

  const shell = (children: ReactNode) => (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-teal-300 font-bold hover:text-teal-200">
            ← QAZIR
          </Link>
          <span className="text-xs text-slate-400">Сөздік</span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </main>
  )

  if (!ready) return shell(<p className="text-slate-400">Жүктелуде...</p>)

  return shell(
    <div>
      <h1 className="text-3xl font-extrabold mb-4">Сөздік</h1>
      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('search')} className={chip(tab === 'search')}>
          Іздеу ({entries.length})
        </button>
        <button onClick={() => setTab('mine')} className={chip(tab === 'mine')}>
          Менің сөздерім ({mine.length})
        </button>
      </div>

      {tab === 'search' && (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Қазақша немесе орысша сөзді жазыңыз"
            className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm outline-none focus:border-teal-500 mb-3"
          />
          <div className="flex flex-wrap gap-2 mb-2">
            <button onClick={() => setLevel('all')} className={chip(level === 'all')}>
              Барлық деңгей
            </button>
            {LEVELS.map((l) => (
              <button key={l} onClick={() => setLevel(l)} className={chip(level === l)}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <button onClick={() => setPos('all')} className={chip(pos === 'all')}>
              Барлық сөз табы
            </button>
            {POS_LIST.map((p) => (
              <button key={p} onClick={() => setPos(p)} className={chip(pos === p)}>
                {POS_NAMES[p]}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500 mb-3">
            Табылды: {results.length}
            {results.length > LIMIT && ` (алғашқы ${LIMIT} көрсетілді, іздеуді нақтылаңыз)`}
          </p>
          <div className="space-y-2">
            {results.slice(0, LIMIT).map((e) => {
              const key = `${e.kk}|${e.ru}`
              const isOpen = open === key
              return (
                <div key={key} className="rounded-xl border border-slate-800 bg-slate-900">
                  <button onClick={() => setOpen(isOpen ? null : key)} className="w-full text-left px-4 py-3 flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="font-bold text-white">{e.kk}</span>
                      <span className="text-slate-400"> — {e.ru}</span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      {e.pos && <span className="text-[11px] text-slate-400 hidden sm:inline">{POS_NAMES[e.pos]}</span>}
                      <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 text-[11px] font-bold rounded border border-teal-500/20">{e.level}</span>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-slate-800 pt-3 space-y-2 text-sm">
                      <div className="flex items-center gap-3">
                        <SpeakButton text={e.kk} />
                        <span className="text-slate-300">{e.ru}</span>
                      </div>
                      <p className="text-slate-400">
                        Сөз табы: <span className="text-slate-200">{e.pos ? POS_NAMES[e.pos] : 'көрсетілмеген'}</span>
                        {' · '}Деңгей: <span className="text-slate-200">{e.level}</span>
                      </p>
                      {e.plural && (
                        <p className="text-slate-400">
                          Көпше түрі: <span className="text-slate-200 font-semibold">{e.plural}</span>
                        </p>
                      )}
                      {e.exKk && (
                        <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-slate-100">{e.exKk}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{e.exRu}</p>
                          </div>
                          <SpeakButton text={e.exKk} />
                        </div>
                      )}
                      {e.note && <p className="text-slate-400">{e.note}</p>}
                      {e.lessonTitle && (
                        <p className="text-xs text-slate-500">
                          Сабақ:{' '}
                          <Link href={`/lesson/${e.lessonId}`} className="text-teal-300 underline">
                            {e.lessonTitle}
                          </Link>
                        </p>
                      )}
                      <button
                        onClick={() => toggleMine(e)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border ${isMine(e.kk) ? 'border-emerald-500/40 text-emerald-300' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-teal-300'}`}
                      >
                        {isMine(e.kk) ? 'Менің сөздерімде ✓ (алып тастау)' : 'Менің сөздеріме қосу'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {results.length === 0 && <p className="text-slate-400 text-sm">Ештеңе табылмады. Басқа сөзбен немесе сүзгісіз іздеп көріңіз.</p>}
        </>
      )}

      {tab === 'mine' && (
        <>
          {mine.length === 0 ? (
            <p className="text-slate-400 text-sm">
              Әзірге бос. Сөздікте немесе мәтінде сөзді басып, «Менің сөздеріме қосу» түймесін басыңыз.
            </p>
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-3">
                Бұл сөздер «Қайталау» бөліміне автоматты түрде қосылады. <Link className="text-teal-300 underline" href="/repeat">Қайталауға өту</Link>
              </p>
              <div className="space-y-2">
                {[...mine].reverse().map((w) => (
                  <div key={w.kk} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <div className="min-w-0">
                      <p>
                        <span className="font-bold text-white">{w.kk}</span>
                        <span className="text-slate-400"> — {w.ru}</span>
                      </p>
                      {w.source && <p className="text-[11px] text-slate-500">{w.source}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SpeakButton text={w.kk} />
                      <button
                        onClick={() => {
                          removeMyWord(w.kk)
                          setMine(loadMyWords())
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-red-300"
                      >
                        Өшіру
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>,
  )
}
