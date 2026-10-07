'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { lessonContent } from '@/lib/lessons'
import { normalizeAnswer, shuffle } from '@/lib/helpers'
import SpeakButton from '@/components/SpeakButton'
import { speak, speakErrorMessage } from '@/lib/speak'

const ROUND = 10
const KAZAKH_LETTERS = ['ә', 'ғ', 'қ', 'ң', 'ө', 'ұ', 'ү', 'һ', 'і']

interface Word {
  kk: string
  ru: string
}

// Барлық сабақтардағы қысқа сөздер мен сөз тіркестері
function collectWords(): Word[] {
  const seen = new Set<string>()
  const out: Word[] = []
  for (const lesson of Object.values(lessonContent)) {
    for (const section of lesson.sections ?? []) {
      for (const item of section.items) {
        const kk = item.kk.trim()
        const key = normalizeAnswer(kk)
        if (!key || seen.has(key)) continue
        if (kk.includes('→') || kk.includes('...') || kk.includes('/')) continue
        if (kk.split(' ').length > 3 || kk.length > 28) continue
        seen.add(key)
        out.push({ kk, ru: item.ru })
      }
    }
  }
  return out
}

interface Result {
  word: Word
  typed: string
  ok: boolean
}

export default function ListenPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const allWords = useMemo(() => collectWords(), [])
  const [round, setRound] = useState<Word[]>([])
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState<Result | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [playError, setPlayError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startRound() {
    setRound(shuffle(allWords).slice(0, ROUND))
    setIndex(0)
    setValue('')
    setChecked(null)
    setResults([])
    setPlayError('')
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      startRound()
      setCheckingAuth(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const current = round[index]
  const finished = round.length > 0 && index >= round.length

  // Жаңа сөз шыққанда автоматты түрде айтады
  useEffect(() => {
    if (!current || checked) return
    setPlayError('')
    speak(current.kk).catch((e) => setPlayError(speakErrorMessage(e)))
    inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, round])

  function insertLetter(ch: string) {
    setValue((v) => v + ch)
    inputRef.current?.focus()
  }

  function check() {
    if (!current || checked || !value.trim()) return
    const ok = normalizeAnswer(value) === normalizeAnswer(current.kk)
    const r: Result = { word: current, typed: value.trim(), ok }
    setChecked(r)
    setResults((prev) => [...prev, r])
  }

  function next() {
    setChecked(null)
    setValue('')
    setIndex((i) => i + 1)
  }

  if (checkingAuth) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Жүктелуде...</div>
  }

  const correctCount = results.filter((r) => r.ok).length

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="max-w-xl mx-auto">
        <Link href="/learning-path" className="text-sm text-slate-400 hover:text-teal-300">
          ← Кабинетке қайту
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">🎧 Тыңдап жаз</h1>
        <p className="text-slate-400 text-sm mb-8">
          Сөзді тыңда да, қазақша дұрыс жаз. Дыбыс шықпаса, Microsoft Edge браузерін қолдан.
        </p>

        {allWords.length === 0 && <p className="text-slate-400">Сөздер табылмады.</p>}

        {current && !finished && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-6">
              <span>
                {index + 1} / {round.length}
              </span>
              <span>Дұрыс: {correctCount}</span>
            </div>

            <div className="flex flex-col items-center gap-3 mb-6">
              <SpeakButton text={current.kk} withLabel />
              <p className="text-xs text-slate-400">Мағынасы: {current.ru}</p>
              {playError && <p className="text-xs text-red-300">{playError}</p>}
            </div>

            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (checked) next()
                  else check()
                }
              }}
              disabled={!!checked}
              placeholder="Қазақша жаз..."
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-lg focus:outline-none focus:border-teal-400"
            />

            {!checked && (
              <div className="flex flex-wrap gap-2 mt-3">
                {KAZAKH_LETTERS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => insertLetter(ch)}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-bold"
                  >
                    {ch}
                  </button>
                ))}
              </div>
            )}

            {checked ? (
              <div className="mt-5">
                <div
                  className={`p-4 rounded-xl border text-sm ${
                    checked.ok
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  {checked.ok ? (
                    <p>Дұрыс! {checked.word.kk}</p>
                  ) : (
                    <>
                      <p>Дұрыс жауап: {checked.word.kk}</p>
                      <p className="mt-1 opacity-80">Сен жаздың: {checked.typed}</p>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={next}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl hover:scale-[1.02] transition-all"
                >
                  {index + 1 >= round.length ? 'Нәтижені көру' : 'Келесі'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={check}
                disabled={!value.trim()}
                className="w-full mt-5 py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl disabled:opacity-40 hover:scale-[1.02] transition-all"
              >
                Тексеру
              </button>
            )}
          </div>
        )}

        {finished && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-1">Нәтиже: {correctCount} / {round.length}</h2>
            <p className="text-sm text-slate-400 mb-5">
              {correctCount === round.length ? 'Керемет, барлығы дұрыс!' : 'Қателерді қайта тыңдап, есіңе сақта.'}
            </p>
            <div className="space-y-2 mb-6">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-sm ${
                    r.ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div>
                    <p className="font-bold">{r.ok ? '✓' : '✗'} {r.word.kk}</p>
                    <p className="text-xs text-slate-400">
                      {r.word.ru}
                      {!r.ok && ` · сен жаздың: ${r.typed}`}
                    </p>
                  </div>
                  <SpeakButton text={r.word.kk} />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={startRound}
              className="w-full py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl hover:scale-[1.02] transition-all"
            >
              Қайтадан ойнау
            </button>
          </div>
        )}
      </div>
    </div>
  )
}