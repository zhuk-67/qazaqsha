'use client'

import { useEffect, useState } from 'react'
import {
  grammarTopics,
  grammarSections,
  type GrammarTopic,
  type GrammarQuestion,
  type GrammarSection,
} from '@/lib/grammar'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']
const STORE = 'qq_grammar_best'

function loadBest(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORE)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

function saveBest(id: string, percent: number): Record<string, number> {
  const all = loadBest()
  if (percent > (all[id] ?? -1)) all[id] = percent
  try {
    localStorage.setItem(STORE, JSON.stringify(all))
  } catch {
    // сақтау мүмкін болмаса, жай өткізіп жібереміз
  }
  return all
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ')
}

function QuestionCard({
  q,
  index,
  onResult,
}: {
  q: GrammarQuestion
  index: number
  onResult: (ok: boolean) => void
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [checked, setChecked] = useState<boolean | null>(null)

  const done = q.kind === 'choice' ? picked !== null : checked !== null

  function pick(i: number) {
    if (picked !== null || q.kind !== 'choice') return
    setPicked(i)
    onResult(i === q.answer)
  }

  function check() {
    if (q.kind !== 'fill' || checked !== null || !text.trim()) return
    const ok = q.accepted.some((a) => norm(a) === norm(text))
    setChecked(ok)
    onResult(ok)
  }

  const correct =
    q.kind === 'choice' ? picked === q.answer : checked === true

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="font-semibold text-white mb-3">
        <span className="text-teal-400 mr-2">{index}.</span>
        {q.prompt}
      </p>

      {q.kind === 'choice' ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {q.options.map((o, i) => {
            let cls = 'border-slate-700 bg-slate-900 text-slate-200 hover:border-teal-500'
            if (picked !== null) {
              if (i === q.answer) cls = 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
              else if (i === picked) cls = 'border-red-500 bg-red-500/10 text-red-300'
              else cls = 'border-slate-800 bg-slate-900 text-slate-500'
            }
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={picked !== null}
                className={`text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${cls}`}
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
            disabled={checked !== null}
            placeholder="Жауабыңызды жазыңыз"
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-sm outline-none focus:border-teal-500"
          />
          <button
            onClick={check}
            disabled={checked !== null || !text.trim()}
            className="px-4 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 text-sm font-bold"
          >
            Тексеру
          </button>
        </div>
      )}

      {q.kind === 'fill' && !done && q.hint && (
        <p className="mt-2 text-xs text-slate-500">Кеңес: {q.hint}</p>
      )}

      {done && (
        <p className={`mt-3 text-sm ${correct ? 'text-emerald-400' : 'text-red-400'}`}>
          <span className="font-bold">{correct ? 'Дұрыс. ' : 'Қате. '}</span>
          {q.kind === 'fill' && !correct && (
            <span className="font-bold">Дұрыс жауап: {q.accepted[0]}. </span>
          )}
          <span className="text-slate-300">{q.explain}</span>
        </p>
      )}
    </div>
  )
}

function Quiz({
  topic,
  onFinish,
}: {
  topic: GrammarTopic
  onFinish: (percent: number) => void
}) {
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [finished, setFinished] = useState(false)
  const total = topic.quiz.length

  if (finished) {
    const percent = Math.round((score / total) * 100)
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
        <p className="text-slate-400 text-sm mb-1">Тест нәтижесі</p>
        <p className="text-5xl font-extrabold text-teal-400">{percent}%</p>
        <p className="text-slate-300 mt-2">
          {score} / {total} дұрыс жауап
        </p>
        <p className="text-sm text-slate-400 mt-3">
          {percent >= 80
            ? 'Тамаша! Тақырып жақсы меңгерілді.'
            : percent >= 50
              ? 'Жаман емес. Ережені қайта оқып, тестті тағы тапсырып көріңіз.'
              : 'Ережені мұқият қайталап, мини-жаттығуларды орындап, қайта тапсырыңыз.'}
        </p>
        <button
          onClick={() => {
            setI(0)
            setScore(0)
            setAnswered(false)
            setFinished(false)
          }}
          className="mt-5 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-sm font-bold"
        >
          Қайта тапсыру
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
        <span>
          Сұрақ {i + 1} / {total}
        </span>
        <span>Ұпай: {score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 mb-4 overflow-hidden">
        <div
          className="h-full bg-teal-500 transition-all"
          style={{ width: `${(i / total) * 100}%` }}
        />
      </div>
      <QuestionCard
        key={`${topic.id}-${i}`}
        q={topic.quiz[i]}
        index={i + 1}
        onResult={(ok) => {
          setAnswered(true)
          if (ok) setScore((s) => s + 1)
        }}
      />
      {answered && (
        <button
          onClick={() => {
            if (i + 1 >= total) {
              const finalScore = score
              setFinished(true)
              onFinish(Math.round((finalScore / total) * 100))
            } else {
              setI(i + 1)
              setAnswered(false)
            }
          }}
          className="mt-4 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold"
        >
          {i + 1 >= total ? 'Нәтижені көру' : 'Келесі →'}
        </button>
      )}
    </div>
  )
}

export default function GrammarTab() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [level, setLevel] = useState<string>('all')
  const [section, setSection] = useState<GrammarSection | 'all'>('all')
  const [best, setBest] = useState<Record<string, number>>({})
  const [exKey, setExKey] = useState(0)

  useEffect(() => {
    setBest(loadBest())
  }, [])

  const topic = grammarTopics.find((t) => t.id === openId)

  function open(id: string | null) {
    setOpenId(id)
    setExKey((k) => k + 1)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (topic) {
    const idx = grammarTopics.findIndex((t) => t.id === topic.id)
    const prev = idx > 0 ? grammarTopics[idx - 1] : null
    const next = idx < grammarTopics.length - 1 ? grammarTopics[idx + 1] : null
    const sectionTitle = grammarSections.find((s) => s.id === topic.section)?.title ?? ''

    return (
      <div>
        <button
          onClick={() => open(null)}
          className="mb-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-bold rounded-xl transition-all"
        >
          ← Барлық тақырыптар
        </button>

        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-teal-500/10 text-teal-400 text-xs font-bold rounded-lg border border-teal-500/20">
            {topic.level}
          </span>
          <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-700">
            {sectionTitle}
          </span>
        </div>
        <h2 className="text-2xl font-bold mt-3 mb-6">{topic.title}</h2>

        <div className="space-y-6">
          {topic.blocks.map((block, i) => {
            if (block.type === 'text') {
              return (
                <p key={i} className="text-slate-300 leading-relaxed">
                  {block.text}
                </p>
              )
            }
            if (block.type === 'table') {
              return (
                <div key={i} className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-900 text-teal-300">
                      <tr>
                        {block.head.map((h, hi) => (
                          <th key={hi} className="px-4 py-3 font-bold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, r) => (
                        <tr key={r} className="border-t border-slate-800 bg-slate-950">
                          {row.map((cell, c) => (
                            <td
                              key={c}
                              className={`px-4 py-3 ${c === 0 ? 'font-bold text-white' : 'text-slate-300'}`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
            return (
              <div key={i} className="space-y-2">
                {block.items.map((it, k) => (
                  <div
                    key={k}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
                  >
                    <p className="font-semibold text-white">{it.kk}</p>
                    <p className="text-sm text-slate-400">{it.ru}</p>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        <h3 className="text-xl font-bold mt-10 mb-1">Мини-жаттығу</h3>
        <p className="text-sm text-slate-400 mb-4">Жауап бергенде бірден түсініктеме шығады.</p>
        <div className="space-y-4" key={`ex-${topic.id}-${exKey}`}>
          {topic.exercises.map((q, i) => (
            <QuestionCard key={i} q={q} index={i + 1} onResult={() => {}} />
          ))}
        </div>
        <button
          onClick={() => setExKey((k) => k + 1)}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-bold rounded-xl"
        >
          Жаттығуды қайта бастау
        </button>

        <h3 className="text-xl font-bold mt-10 mb-1">Тест</h3>
        <p className="text-sm text-slate-400 mb-4">
          {topic.quiz.length} сұрақ.
          {best[topic.id] !== undefined && ` Ең жақсы нәтиже: ${best[topic.id]}%.`}
        </p>
        <Quiz
          key={`quiz-${topic.id}`}
          topic={topic}
          onFinish={(p) => setBest(saveBest(topic.id, p))}
        />

        <div className="flex justify-between gap-3 mt-10">
          {prev ? (
            <button
              onClick={() => open(prev.id)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl text-left"
            >
              ← {prev.title}
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button
              onClick={() => open(next.id)}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl text-right"
            >
              {next.title} →
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>
    )
  }

  const filtered = grammarTopics.filter(
    (t) =>
      (level === 'all' || t.level.startsWith(level)) &&
      (section === 'all' || t.section === section),
  )
  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
      active
        ? 'bg-teal-500 text-slate-950 border-teal-500'
        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-teal-500'
    }`

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={() => setLevel('all')} className={chip(level === 'all')}>
          Барлық деңгей
        </button>
        {LEVELS.map((l) => (
          <button key={l} onClick={() => setLevel(l)} className={chip(level === l)}>
            {l}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setSection('all')} className={chip(section === 'all')}>
          Барлық бөлім
        </button>
        {grammarSections.map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)} className={chip(section === s.id)}>
            {s.title}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-400">Бұл сүзгі бойынша тақырып жоқ.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((t) => {
            const b = best[t.id]
            const sec = grammarSections.find((s) => s.id === t.section)?.title ?? ''
            return (
              <button
                key={t.id}
                onClick={() => open(t.id)}
                className="text-left rounded-xl border border-slate-800 bg-slate-900 hover:border-teal-500 p-4 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 text-[11px] font-bold rounded border border-teal-500/20">
                    {t.level.split(' ')[0]}
                  </span>
                  <span className="text-[11px] text-slate-400">{sec}</span>
                  {b !== undefined && (
                    <span className="ml-auto text-[11px] font-bold text-emerald-400">{b}%</span>
                  )}
                </div>
                <p className="font-bold text-white">{t.title}</p>
                <p className="text-xs text-slate-400 mt-1">{t.summary}</p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
