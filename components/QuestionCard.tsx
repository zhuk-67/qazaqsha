'use client'

import { useEffect, useRef, useState } from 'react'
import { shuffle, normalizeAnswer } from '@/lib/helpers'
import {
  isChoiceQuestion,
  type ChoiceQuestion,
  type MatchQuestion,
  type Question,
  type WriteQuestion,
} from '@/lib/lessons'

interface QuestionCardProps {
  question: Question
  onAnswered: (correct: boolean) => void
  shuffleOptions?: boolean // таңдау сұрағында жауаптардың орнын араластыру
}

const KAZAKH_LETTERS = ['ә', 'ғ', 'қ', 'ң', 'ө', 'ұ', 'ү', 'һ', 'і']

function Feedback({ correct, explain, extra }: { correct: boolean; explain: string; extra?: string }) {
  return (
    <div
      className={`mb-4 p-4 rounded-xl text-sm border ${
        correct
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-red-500/10 border-red-500/30 text-red-300'
      }`}
    >
      <p className="font-bold mb-1">{correct ? 'Дұрыс! ✓' : 'Қате ✗'}</p>
      {extra && <p className="mb-1">{extra}</p>}
      <p>{explain}</p>
    </div>
  )
}

function ChoiceView({
  question,
  onAnswered,
  shuffleOptions,
}: {
  question: ChoiceQuestion
  onAnswered: (correct: boolean) => void
  shuffleOptions: boolean
}) {
  const [order] = useState<number[]>(() => {
    const idx = question.options.map((_, i) => i)
    return shuffleOptions ? shuffle(idx) : idx
  })
  const [selected, setSelected] = useState<number | null>(null) // options ішіндегі нөмір

  function handleSelect(optionIndex: number) {
    if (selected !== null) return
    setSelected(optionIndex)
    onAnswered(optionIndex === question.answer)
  }

  return (
    <div>
      <div className="space-y-3 mb-6">
        {order.map((optionIndex) => {
          let style = 'bg-slate-900 border-slate-700 hover:border-teal-400'
          if (selected !== null) {
            if (optionIndex === question.answer) style = 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
            else if (optionIndex === selected) style = 'bg-red-500/20 border-red-400 text-red-200'
            else style = 'bg-slate-900 border-slate-800 opacity-50'
          }
          return (
            <button
              key={optionIndex}
              onClick={() => handleSelect(optionIndex)}
              disabled={selected !== null}
              className={`w-full text-left px-5 py-4 rounded-xl border font-medium transition-all ${style}`}
            >
              {question.options[optionIndex]}
            </button>
          )
        })}
      </div>
      {selected !== null && <Feedback correct={selected === question.answer} explain={question.explain} />}
    </div>
  )
}

function WriteView({
  question,
  onAnswered,
}: {
  question: WriteQuestion
  onAnswered: (correct: boolean) => void
}) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function insertLetter(letter: string) {
    if (result !== null) return
    const el = inputRef.current
    if (!el) {
      setValue((v) => v + letter)
      return
    }
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const next = value.slice(0, start) + letter + value.slice(end)
    setValue(next)
    // курсорды қосылған әріптің артына қоямыз
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + letter.length, start + letter.length)
    })
  }

  function handleCheck() {
    if (result !== null) return
    const given = normalizeAnswer(value)
    if (given === '') return
    const ok = question.accepted.some((a) => normalizeAnswer(a) === given)
    setResult(ok)
    onAnswered(ok)
  }

  const inputStyle =
    result === null
      ? 'border-slate-700 focus:border-teal-400'
      : result
        ? 'border-emerald-400 text-emerald-200'
        : 'border-red-400 text-red-200'

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCheck()
        }}
        disabled={result !== null}
        placeholder="Жауабыңызды жазыңыз"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className={`w-full px-5 py-4 mb-3 rounded-xl bg-slate-900 border outline-none text-lg font-medium ${inputStyle}`}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {KAZAKH_LETTERS.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => insertLetter(letter)}
            disabled={result !== null}
            className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 hover:border-teal-400 text-teal-300 font-bold disabled:opacity-40"
          >
            {letter}
          </button>
        ))}
      </div>

      {result === null && (
        <div className="mb-6">
          <button
            onClick={handleCheck}
            disabled={normalizeAnswer(value) === ''}
            className="w-full py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl disabled:opacity-40"
          >
            Тексеру
          </button>
          {question.hint && (
            <div className="mt-3">
              {showHint ? (
                <p className="text-sm text-slate-400">💡 {question.hint}</p>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="text-sm text-teal-300 font-bold hover:text-teal-200"
                >
                  💡 Көмек көрсету
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {result !== null && (
        <Feedback
          correct={result}
          explain={question.explain}
          extra={result ? undefined : `Дұрыс жауап: ${question.accepted[0]}`}
        />
      )}
    </div>
  )
}

function MatchView({
  question,
  onAnswered,
}: {
  question: MatchQuestion
  onAnswered: (correct: boolean) => void
}) {
  const [rightOrder] = useState<number[]>(() => shuffle(question.pairs.map((_, i) => i)))
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [matched, setMatched] = useState<number[]>([])
  const [hadMistake, setHadMistake] = useState(false)
  const [wrongFlash, setWrongFlash] = useState<{ left: number; right: number } | null>(null)
  const finished = matched.length === question.pairs.length

  useEffect(() => {
    if (!wrongFlash) return
    const timer = setTimeout(() => setWrongFlash(null), 700)
    return () => clearTimeout(timer)
  }, [wrongFlash])

  function handleLeft(i: number) {
    if (finished || matched.includes(i)) return
    setSelectedLeft(i)
  }

  function handleRight(j: number) {
    if (finished || matched.includes(j) || selectedLeft === null) return
    if (selectedLeft === j) {
      const next = [...matched, j]
      setMatched(next)
      setSelectedLeft(null)
      if (next.length === question.pairs.length) onAnswered(!hadMistake)
    } else {
      setHadMistake(true)
      setWrongFlash({ left: selectedLeft, right: j })
      setSelectedLeft(null)
    }
  }

  return (
    <div>
      <p className="text-sm text-slate-400 mb-4">Алдымен сол жақтан сөзді, сосын оң жақтан оның жұбын таңдаңыз.</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="space-y-3">
          {question.pairs.map((pair, i) => {
            let style = 'bg-slate-900 border-slate-700 hover:border-teal-400'
            if (matched.includes(i)) style = 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
            else if (wrongFlash?.left === i) style = 'bg-red-500/20 border-red-400 text-red-200'
            else if (selectedLeft === i) style = 'bg-teal-500/20 border-teal-400 text-teal-200'
            return (
              <button
                key={i}
                onClick={() => handleLeft(i)}
                disabled={finished || matched.includes(i)}
                className={`w-full px-4 py-3 rounded-xl border font-medium text-left transition-all ${style}`}
              >
                {pair.left}
              </button>
            )
          })}
        </div>
        <div className="space-y-3">
          {rightOrder.map((j) => {
            let style = 'bg-slate-900 border-slate-700 hover:border-teal-400'
            if (matched.includes(j)) style = 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
            else if (wrongFlash?.right === j) style = 'bg-red-500/20 border-red-400 text-red-200'
            return (
              <button
                key={j}
                onClick={() => handleRight(j)}
                disabled={finished || matched.includes(j)}
                className={`w-full px-4 py-3 rounded-xl border font-medium text-left transition-all ${style}`}
              >
                {question.pairs[j].right}
              </button>
            )
          })}
        </div>
      </div>

      {hadMistake && !finished && (
        <p className="text-xs text-slate-500 mb-4">Қате жұп таңдалды, бірақ жалғастыра беріңіз.</p>
      )}

      {finished && (
        <Feedback
          correct={!hadMistake}
          explain={question.explain}
          extra={hadMistake ? 'Кейбір жұптарды бірінші рет дұрыс таңдамадыңыз.' : undefined}
        />
      )}
    </div>
  )
}

export default function QuestionCard({ question, onAnswered, shuffleOptions = false }: QuestionCardProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-5">{question.prompt}</h2>
      {isChoiceQuestion(question) ? (
        <ChoiceView question={question} onAnswered={onAnswered} shuffleOptions={shuffleOptions} />
      ) : question.type === 'write' ? (
        <WriteView question={question} onAnswered={onAnswered} />
      ) : (
        <MatchView question={question} onAnswered={onAnswered} />
      )}
    </div>
  )
}