'use client'

import { useState } from 'react'
import PracticeCard from '@/components/PracticeCard'
import type { GrammarQuestion } from '@/lib/grammar'

export interface QuizResult {
  score: number
  total: number
  wrong: GrammarQuestion[]
}

// Сұрақтарды бір-бірден көрсетіп, нәтижені санайды
export default function QuizRunner({
  questions,
  tag,
  onFinish,
}: {
  questions: GrammarQuestion[]
  tag: string
  onFinish: (r: QuizResult) => void
}) {
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<GrammarQuestion[]>([])
  const [answered, setAnswered] = useState(false)

  if (questions.length === 0) return <p className="text-sm text-slate-400">Бұл бөлімде сұрақ жоқ.</p>
  const q = questions[i]
  const last = i === questions.length - 1

  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-2">
        <span>Сұрақ {i + 1} / {questions.length}</span>
        <span>Дұрыс: {score}</span>
      </div>
      <PracticeCard
        key={i}
        q={{ ...q, tag }}
        onDone={(ok) => {
          setAnswered(true)
          if (ok) setScore((s) => s + 1)
          else setWrong((w) => [...w, q])
        }}
      />
      {answered && (
        <button
          type="button"
          onClick={() => {
            if (last) {
              // score мен wrong жаңа мәнін state-тен емес, соңғы жауаптан алу үшін кешіктіреміз
              onFinish({ score, total: questions.length, wrong })
            } else {
              setI(i + 1)
              setAnswered(false)
            }
          }}
          className="mt-4 px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-semibold text-sm"
        >
          {last ? 'Нәтижені көру' : 'Келесі'}
        </button>
      )}
    </div>
  )
}
