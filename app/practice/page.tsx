'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { grammarTopics, grammarSections, type GrammarQuestion, type GrammarSection } from '@/lib/grammar'
import { shuffle } from '@/lib/helpers'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']
const SIZE = 10

type Item = { q: GrammarQuestion; topic: string; level: string }

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ')
}

function buildSession(level: string, section: GrammarSection | 'all'): Item[] {
  const pool: Item[] = []
  for (const t of grammarTopics) {
    if (level !== 'all' && !t.level.startsWith(level)) continue
    if (section !== 'all' && t.section !== section) continue
    for (const q of [...t.exercises, ...t.quiz]) pool.push({ q, topic: t.title, level: t.level.split(' ')[0] })
  }
  return shuffle(pool).slice(0, SIZE)
}

function Card({ item, onDone }: { item: Item; onDone: (ok: boolean) => void }) {
  const { q } = item
  const [picked, setPicked] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [res, setRes] = useState<boolean | null>(null)

  const done = q.kind === 'choice' ? picked !== null : res !== null
  const ok = q.kind === 'choice' ? picked === q.answer : res === true

  function pick(i: number) {
    if (q.kind !== 'choice' || picked !== null) return
    setPicked(i)
    onDone(i === q.answer)
  }
  function check() {
    if (q.kind !== 'fill' || res !== null || !text.trim()) return
    const r = q.accepted.some((a) => norm(a) === norm(text))
    setRes(r)
    onDone(r)
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs text-slate-500 mb-2">
        {item.level} · {item.topic}
      </p>
      <p className="font-semibold text-white mb-4">{q.prompt}</p>
      {q.kind === 'choice' ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {q.options.map((o, i) => {
            let cls = 'border-slate-700 bg-slate-950 text-slate-200 hover:border-teal-500'
            if (picked !== null) {
              if (i === q.answer) cls = 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
              else if (i === picked) cls = 'border-red-500 bg-red-500/10 text-red-300'
              else cls = 'border-slate-800 bg-slate-950 text-slate-500'
            }
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={picked !== null}
                className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${cls}`}
              >
                {o}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') check()
            }}
            disabled={res !== null}
            placeholder="Жауабыңызды жазыңыз"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm outline-none focus:border-teal-500"
          />
          <button
            onClick={check}
            disabled={res !== null || !text.trim()}
            className="px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 text-sm font-bold"
          >
            Тексеру
          </button>
        </div>
      )}
      {q.kind === 'fill' && !done && q.hint && <p className="mt-2 text-xs text-slate-500">Кеңес: {q.hint}</p>}
      {done && (
        <p className={`mt-3 text-sm ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
          <span className="font-bold">{ok ? 'Дұрыс. ' : 'Қате. '}</span>
          {q.kind === 'fill' && !ok && <span className="font-bold">Дұрыс жауап: {q.accepted[0]}. </span>}
          <span className="text-slate-300">{q.explain}</span>
        </p>
      )}
    </div>
  )
}

export default function PracticePage() {
  const [level, setLevel] = useState<string>('all')
  const [section, setSection] = useState<GrammarSection | 'all'>('all')
  const [items, setItems] = useState<Item[] | null>(null)
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [finished, setFinished] = useState(false)

  function start() {
    const s = buildSession(level, section)
    setItems(s)
    setI(0)
    setScore(0)
    setAnswered(false)
    setFinished(false)
  }

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
      active
        ? 'bg-teal-500 text-slate-950 border-teal-500'
        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-teal-500'
    }`

  const shell = (children: ReactNode) => (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-teal-300 font-bold hover:text-teal-200">
            ← QAZIR
          </Link>
          <span className="text-xs text-slate-400">Жаттығулар</span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </main>
  )

  if (items === null) {
    const count = buildSession(level, section).length
    return shell(
      <div>
        <h1 className="text-3xl font-extrabold mb-2">Жаттығулар</h1>
        <p className="text-slate-300 mb-6">
          Грамматика тақырыптарынан кездейсоқ {SIZE} сұрақ. Әр жауаптан кейін бірден түсініктеме шығады.
        </p>
        <p className="text-xs text-slate-400 mb-2">Деңгей</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setLevel('all')} className={chip(level === 'all')}>
            Барлығы
          </button>
          {LEVELS.map((l) => (
            <button key={l} onClick={() => setLevel(l)} className={chip(level === l)}>
              {l}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mb-2">Бөлім</p>
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setSection('all')} className={chip(section === 'all')}>
            Барлығы
          </button>
          {grammarSections.map((s) => (
            <button key={s.id} onClick={() => setSection(s.id)} className={chip(section === s.id)}>
              {s.title}
            </button>
          ))}
        </div>
        <button
          onClick={start}
          disabled={count === 0}
          className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold"
        >
          Бастау
        </button>
        {count === 0 && <p className="mt-3 text-sm text-slate-400">Бұл таңдау бойынша сұрақ жоқ.</p>}
      </div>,
    )
  }

  if (finished) {
    const percent = Math.round((score / items.length) * 100)
    return shell(
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-sm text-slate-400">Нәтиже</p>
        <p className="text-5xl font-extrabold text-teal-400 my-2">{percent}%</p>
        <p className="text-slate-300">
          {score} / {items.length} дұрыс жауап
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={start} className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm">
            Тағы {SIZE} сұрақ
          </button>
          <button
            onClick={() => setItems(null)}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-bold text-sm"
          >
            Таңдауды өзгерту
          </button>
        </div>
      </div>,
    )
  }

  return shell(
    <div>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span>
          {i + 1} / {items.length}
        </span>
        <span>Ұпай: {score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 mb-5 overflow-hidden">
        <div className="h-full bg-teal-500 transition-all" style={{ width: `${(i / items.length) * 100}%` }} />
      </div>
      <Card
        key={i}
        item={items[i]}
        onDone={(ok) => {
          setAnswered(true)
          if (ok) setScore((s) => s + 1)
        }}
      />
      {answered && (
        <button
          onClick={() => {
            if (i + 1 >= items.length) setFinished(true)
            else {
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
