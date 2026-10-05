'use client'

import { useMemo, useState } from 'react'
import { lessonContent } from '@/lib/lessons'
import { shuffle } from '@/lib/helpers'

interface WordEntry {
  kk: string
  ru: string
  note?: string
  lessonId: string
  lessonTitle: string
  group: string
}

type Mode = 'list' | 'cards'

// Барлық сабақтардағы сөздер мен тіркестер бір тізімге жиналады
function collectWords(): WordEntry[] {
  const out: WordEntry[] = []
  for (const lesson of Object.values(lessonContent)) {
    for (const letter of lesson.letters ?? []) {
      for (const ex of letter.examples) {
        out.push({
          kk: ex.kk,
          ru: ex.ru,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          group: `Әріп ${letter.upper}${letter.lower}`,
        })
      }
    }
    for (const section of lesson.sections ?? []) {
      for (const item of section.items) {
        out.push({
          kk: item.kk,
          ru: item.ru,
          note: item.note,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          group: section.title,
        })
      }
    }
  }
  return out
}

export default function VocabTab() {
  const allWords = useMemo(() => collectWords(), [])
  const lessons = useMemo(
    () => Object.values(lessonContent).map((l) => ({ id: l.id, title: l.title })),
    []
  )

  const [mode, setMode] = useState<Mode>('list')
  const [query, setQuery] = useState('')
  const [lessonFilter, setLessonFilter] = useState('all')

  // карточкалар режимі
  const [deck, setDeck] = useState<WordEntry[] | null>(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allWords.filter((w) => {
      if (lessonFilter !== 'all' && w.lessonId !== lessonFilter) return false
      if (!q) return true
      return w.kk.toLowerCase().includes(q) || w.ru.toLowerCase().includes(q)
    })
  }, [allWords, query, lessonFilter])

  // тізімді сабақ және бөлім бойынша топтаймыз
  const grouped = useMemo(() => {
    const map = new Map<string, WordEntry[]>()
    for (const w of filtered) {
      const key = `${w.lessonTitle} · ${w.group}`
      const arr = map.get(key)
      if (arr) arr.push(w)
      else map.set(key, [w])
    }
    return Array.from(map.entries())
  }, [filtered])

  const cardsSource = useMemo(
    () => allWords.filter((w) => lessonFilter === 'all' || w.lessonId === lessonFilter),
    [allWords, lessonFilter]
  )
  const activeDeck = deck ?? cardsSource
  const safeIndex = Math.min(cardIndex, Math.max(activeDeck.length - 1, 0))
  const card = activeDeck[safeIndex]

  function changeLesson(value: string) {
    setLessonFilter(value)
    setDeck(null)
    setCardIndex(0)
    setFlipped(false)
  }

  function shuffleDeck() {
    setDeck(shuffle(cardsSource))
    setCardIndex(0)
    setFlipped(false)
  }

  function goNext() {
    if (safeIndex + 1 < activeDeck.length) {
      setCardIndex(safeIndex + 1)
      setFlipped(false)
    }
  }

  function goPrev() {
    if (safeIndex > 0) {
      setCardIndex(safeIndex - 1)
      setFlipped(false)
    }
  }

  const tabBase = 'px-4 py-2 rounded-xl text-sm font-bold border transition-all'

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">📚 Сөздік</h2>
      <p className="text-sm text-slate-400 mb-6">
        Сабақтарда кездескен барлық сөздер мен тіркестер. Сөздеріңізді тізімнен іздеңіз немесе карточкалармен қайталаңыз.
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => setMode('list')}
          className={`${tabBase} ${
            mode === 'list'
              ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
              : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-teal-400'
          }`}
        >
          Тізім
        </button>
        <button
          onClick={() => setMode('cards')}
          className={`${tabBase} ${
            mode === 'cards'
              ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
              : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-teal-400'
          }`}
        >
          Карточкалар
        </button>
        <select
          value={lessonFilter}
          onChange={(e) => changeLesson(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm bg-slate-900 border border-slate-700 text-slate-200"
        >
          <option value="all">Барлық сабақтар</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </div>

      {mode === 'list' && (
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Сөзді қазақша немесе орысша іздеңіз"
            className="w-full px-4 py-3 mb-6 rounded-xl bg-slate-900 border border-slate-700 focus:border-teal-400 outline-none text-sm"
          />

          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400">Ештеңе табылмады. Басқа сөзбен іздеп көріңіз.</p>
          ) : (
            <div>
              <p className="text-xs text-slate-500 mb-4">Табылған жазба: {filtered.length}</p>
              {grouped.map(([title, words]) => (
                <div key={title} className="mb-6">
                  <h3 className="text-sm font-bold text-teal-300 mb-2">{title}</h3>
                  <div className="space-y-2">
                    {words.map((w, i) => (
                      <div
                        key={`${w.kk}-${i}`}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3"
                      >
                        <p className="font-bold text-white">{w.kk}</p>
                        <p className="text-sm text-slate-400">
                          {w.ru}
                          {w.note ? ` (${w.note})` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'cards' && (
        <div>
          {!card ? (
            <p className="text-sm text-slate-400">Бұл сабақта сөздер жоқ.</p>
          ) : (
            <div className="max-w-md">
              <p className="text-xs text-slate-500 mb-3">
                Карточка {safeIndex + 1} / {activeDeck.length}
              </p>
              <button
                onClick={() => setFlipped((f) => !f)}
                className="w-full min-h-[180px] bg-slate-900 border border-slate-700 hover:border-teal-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all"
              >
                {flipped ? (
                  <div>
                    <p className="text-2xl font-bold text-emerald-300 mb-2">{card.ru}</p>
                    {card.note && <p className="text-xs text-slate-400">{card.note}</p>}
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-white mb-2">{card.kk}</p>
                    <p className="text-xs text-slate-500">Аудармасын көру үшін басыңыз</p>
                  </div>
                )}
              </button>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={goPrev}
                  disabled={safeIndex === 0}
                  className="flex-1 py-3 bg-slate-800 border border-slate-700 text-teal-300 font-bold rounded-xl disabled:opacity-40"
                >
                  ← Алдыңғы
                </button>
                <button
                  onClick={goNext}
                  disabled={safeIndex + 1 >= activeDeck.length}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl disabled:opacity-40"
                >
                  Келесі →
                </button>
              </div>
              <button
                onClick={shuffleDeck}
                className="mt-3 w-full py-2 text-sm text-teal-300 font-bold hover:text-teal-200"
              >
                🔀 Араластыру
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}