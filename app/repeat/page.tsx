'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { collectWords, type WordEntry } from '@/lib/words'
import { loadMyWords } from '@/lib/mywords'
import { loadSrs, saveSrs, gradeEntry, todayStr, type SrsMap } from '@/lib/srs'
import { shuffle } from '@/lib/helpers'
import SpeakButton from '@/components/SpeakButton'

const NEW_PER_DAY = 5
const MAX_DUE = 15

export default function RepeatPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pool, setPool] = useState<WordEntry[]>([])
  const [srs, setSrs] = useState<SrsMap>({})
  const [session, setSession] = useState<WordEntry[] | null>(null)
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(false)
  const [known, setKnown] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase.from('profiles').select('completed_lessons').eq('id', user.id).maybeSingle()
      const completed = (data?.completed_lessons as string[] | null) ?? []
      const mineWords: WordEntry[] = loadMyWords().map((w) => ({
        key: `my|${w.kk}`,
        kk: w.kk,
        ru: w.ru,
        note: w.note,
        lessonId: 'my',
        lessonTitle: 'Менің сөздерім',
      }))
      setPool([...collectWords().filter((w) => completed.includes(w.lessonId)), ...mineWords])
      setSrs(loadSrs())
      setLoading(false)
    }
    load()
  }, [router])

  const today = todayStr()
  const dueWords = pool.filter((w) => srs[w.key] && srs[w.key].due <= today)
  const newWords = pool.filter((w) => !srs[w.key])
  const learned = pool.filter((w) => srs[w.key] && srs[w.key].box >= 3).length
  const trackedCount = pool.filter((w) => srs[w.key]).length
  const weak = pool
    .filter((w) => srs[w.key] && srs[w.key].forgot > 0)
    .sort((a, b) => srs[b.key].forgot - srs[a.key].forgot)
    .slice(0, 8)

  function start() {
    const due = shuffle(dueWords).slice(0, MAX_DUE)
    const fresh = newWords.slice(0, NEW_PER_DAY)
    setSession([...due, ...fresh])
    setI(0)
    setShown(false)
    setKnown(0)
    setFinished(false)
  }

  function answer(ok: boolean) {
    if (!session) return
    const w = session[i]
    const next = { ...srs, [w.key]: gradeEntry(srs[w.key], ok) }
    setSrs(next)
    saveSrs(next)
    if (ok) setKnown((k) => k + 1)
    if (i + 1 >= session.length) setFinished(true)
    else {
      setI(i + 1)
      setShown(false)
    }
  }

  const shell = (children: ReactNode) => (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-teal-300 font-bold hover:text-teal-200">
            ← QAZIR
          </Link>
          <span className="text-xs text-slate-400">Қайталау</span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </main>
  )

  if (loading) return shell(<p className="text-slate-400">Жүктелуде...</p>)

  if (session && finished) {
    return shell(
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-sm text-slate-400">Бүгінгі қайталау аяқталды</p>
        <p className="text-5xl font-extrabold text-teal-400 my-2">
          {known} / {session.length}
        </p>
        <p className="text-slate-300 text-sm">Ұмытқан сөздер ертең қайта шығады, білгендері біртіндеп сирек шығады.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setSession(null)}
            className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm"
          >
            Дайын
          </button>
        </div>
      </div>,
    )
  }

  if (session) {
    const w = session[i]
    return shell(
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>
            {i + 1} / {session.length}
          </span>
          <span>{srs[w.key] ? `Қорапша ${srs[w.key].box + 1}` : 'Жаңа сөз'}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 mb-5 overflow-hidden">
          <div className="h-full bg-teal-500 transition-all" style={{ width: `${(i / session.length) * 100}%` }} />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-3xl font-extrabold text-white mb-3">{w.kk}</p>
          <SpeakButton text={w.kk} />
          {shown ? (
            <div className="mt-6">
              <p className="text-xl text-teal-300 font-bold">{w.ru}</p>
              {w.note && <p className="text-sm text-slate-400 mt-1">{w.note}</p>}
              <p className="text-xs text-slate-500 mt-3">{w.lessonTitle}</p>
            </div>
          ) : (
            <button
              onClick={() => setShown(true)}
              className="mt-6 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-sm font-bold"
            >
              Жауабын көрсету
            </button>
          )}
        </div>
        {shown && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => answer(false)}
              className="py-3 rounded-xl border border-red-500/40 text-red-300 hover:bg-red-500/10 font-bold text-sm"
            >
              Ұмыттым
            </button>
            <button
              onClick={() => answer(true)}
              className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm"
            >
              Білдім
            </button>
          </div>
        )}
      </div>,
    )
  }

  const total = Math.min(dueWords.length, MAX_DUE) + Math.min(newWords.length, NEW_PER_DAY)

  return shell(
    <div>
      <h1 className="text-3xl font-extrabold mb-2">Қайталау</h1>
      <p className="text-slate-300 mb-6">
        Өткен сабақтардағы сөздер аралықпен қайталанады: білген сөз сирек, ұмытқан сөз жиі шығады.
      </p>

      {pool.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-slate-300 mb-4">Қайталайтын сөз әзірге жоқ. Алдымен бір сабақты аяқтаңыз.</p>
          <Link href="/learning-path" className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm inline-block">
            Сабақтарға өту
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              ['Бүгін қайталау', dueWords.length],
              ['Жаңа сөз', newWords.length],
              ['Жақсы білемін', learned],
            ].map(([l, v]) => (
              <div key={String(l)} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-xs text-slate-400">{l}</p>
                <p className="text-2xl font-extrabold mt-1">{v}</p>
              </div>
            ))}
          </div>
          <button
            onClick={start}
            disabled={total === 0}
            className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold"
          >
            {total > 0 ? `Бастау (${total} сөз)` : 'Бүгінге бәрі дайын'}
          </button>
          {total === 0 && (
            <p className="mt-3 text-sm text-slate-400">
              Бүгін қайталайтын сөз қалмады. Ертең қайта келіңіз немесе жаңа сабақ өтіңіз.
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Қайталау барысы осы құрылғыда сақталады ({trackedCount} сөз қадағалануда).
          </p>

          {weak.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold mb-3">Жиі ұмытатын сөздер</h2>
              <div className="space-y-2">
                {weak.map((w) => (
                  <div key={w.key} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm">
                    <span>
                      <span className="font-bold text-white">{w.kk}</span>
                      <span className="text-slate-400"> — {w.ru}</span>
                    </span>
                    <span className="text-xs text-red-300">{srs[w.key].forgot} рет ұмыттым</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>,
  )
}
