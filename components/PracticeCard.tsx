'use client'

import { useState } from 'react'
import SpeakButton from '@/components/SpeakButton'
import type { PQ } from '@/lib/practice'

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ')
}

export default function PracticeCard({ q, onDone }: { q: PQ; onDone: (ok: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [res, setRes] = useState<boolean | null>(null)
  const [reveal, setReveal] = useState(false)

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
      <p className="text-xs text-teal-400 font-bold mb-2">{q.tag}</p>
      <p className="font-semibold text-white mb-4">{q.prompt}</p>
      {q.audio && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SpeakButton text={q.audio} withLabel />
          <button onClick={() => setReveal(true)} className="text-xs text-slate-400 underline hover:text-teal-300">
            Дыбыс шықпаса, сөзді көрсету
          </button>
          {(reveal || done) && <span className="text-sm text-slate-300 italic">{q.audio}</span>}
        </div>
      )}
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
