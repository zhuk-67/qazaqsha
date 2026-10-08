'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import SpeakButton from '@/components/SpeakButton'
import { shuffle } from '@/lib/helpers'
import {
  placementTasks,
  PLACEMENT_LEVELS,
  type Level,
  type PlacementTask,
} from '@/lib/placement'

// Жауап түрлері: choice/listen/fill — мәтін, tf — 'true' | 'false', error — индекс, order — сөздер тізімі, match — оң жақ мәндер тізімі
type Answer = string | number | string[] | null

const LEVEL_NAMES: Record<Level, string> = {
  A1: 'A1: Бастауыш',
  A2: 'A2: Негізгі',
  B1: 'B1: Орта',
  B2: 'B2: Орташа-жоғары',
  C1: 'C1: Жоғары',
}

const PASS = 6 // деңгейді өту үшін 10 тапсырманың кемінде 6-уы

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ')
}

function isCorrect(t: PlacementTask, a: Answer): boolean {
  if (a === null) return false
  switch (t.type) {
    case 'choice':
    case 'listen':
      return a === t.answer
    case 'fill':
      return typeof a === 'string' && t.accepted.some((x) => norm(x) === norm(a))
    case 'tf':
      return a === (t.answer ? 'true' : 'false')
    case 'error':
      return a === t.wrong
    case 'order': {
      if (!Array.isArray(a)) return false
      const got = a.join(' ')
      return [t.words, ...(t.alts ?? [])].some((w) => w.join(' ') === got)
    }
    case 'match':
      return (
        Array.isArray(a) &&
        a.length === t.pairs.length &&
        t.pairs.every((p, i) => a[i] === p[1])
      )
  }
}

function correctText(t: PlacementTask): string {
  switch (t.type) {
    case 'choice':
    case 'listen':
      return t.answer
    case 'fill':
      return t.accepted[0]
    case 'tf':
      return t.answer ? 'Дұрыс (верно)' : 'Қате (неверно)'
    case 'error':
      return `${t.words[t.wrong]} → ${t.fix}`
    case 'order':
      return t.words.join(' ')
    case 'match':
      return t.pairs.map((p) => `${p[0]} = ${p[1]}`).join('; ')
  }
}

function pickLevel(scores: Record<Level, number>): Level {
  let result: Level = 'A1'
  for (const l of PLACEMENT_LEVELS) {
    if (scores[l] >= PASS) result = l
    else break
  }
  return result
}

function TaskView({
  task,
  onAnswer,
}: {
  task: PlacementTask
  onAnswer: (a: Answer) => void
}) {
  const [text, setText] = useState('')
  const [selected, setSelected] = useState<Answer>(null)
  const [chosen, setChosen] = useState<number[]>([])
  const [matchVals, setMatchVals] = useState<string[]>(
    task.type === 'match' ? task.pairs.map(() => '') : [],
  )
  const [revealed, setRevealed] = useState(false)

  const options = useMemo(
    () => (task.type === 'choice' || task.type === 'listen' ? shuffle(task.options) : []),
    [task],
  )
  const bank = useMemo(() => (task.type === 'order' ? shuffle(task.words.map((w, i) => ({ w, i }))) : []), [task])
  const rightSide = useMemo(() => (task.type === 'match' ? shuffle(task.pairs.map((p) => p[1])) : []), [task])

  const optBtn = (o: string) => (
    <button
      key={o}
      onClick={() => {
        setSelected(o)
        onAnswer(o)
      }}
      className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
        selected === o
          ? 'border-teal-500 bg-teal-500/10 text-teal-300'
          : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-teal-500'
      }`}
    >
      {o}
    </button>
  )

  if (task.type === 'choice') {
    return (
      <div>
        <p className="font-semibold text-white mb-4">{task.prompt}</p>
        <div className="grid gap-2 sm:grid-cols-2">{options.map(optBtn)}</div>
      </div>
    )
  }

  if (task.type === 'listen') {
    return (
      <div>
        <p className="font-semibold text-white mb-4">{task.prompt}</p>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SpeakButton text={task.audio} withLabel />
          <button
            onClick={() => setRevealed(true)}
            className="text-xs text-slate-400 underline hover:text-teal-300"
          >
            Дыбыс шықпаса, мәтінді көрсету
          </button>
        </div>
        {revealed && <p className="mb-4 text-sm text-slate-300 italic">{task.audio}</p>}
        <div className="grid gap-2">{options.map(optBtn)}</div>
      </div>
    )
  }

  if (task.type === 'tf') {
    return (
      <div>
        <p className="font-semibold text-white mb-3">Мәтінді оқыңыз және пікірді бағалаңыз.</p>
        <p className="mb-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-200">{task.text}</p>
        <p className="mb-3 font-semibold text-teal-300">{task.statement}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ['true', 'Дұрыс (верно)'],
            ['false', 'Қате (неверно)'],
          ].map(([v, label]) => (
            <button
              key={v}
              onClick={() => {
                setSelected(v)
                onAnswer(v)
              }}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                selected === v
                  ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-teal-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (task.type === 'fill') {
    return (
      <div>
        <p className="font-semibold text-white mb-4">{task.prompt}</p>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            onAnswer(e.target.value.trim() ? e.target.value : null)
          }}
          placeholder="Жауабыңызды жазыңыз"
          className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm outline-none focus:border-teal-500"
        />
        {task.hint && <p className="mt-2 text-xs text-slate-500">Кеңес: {task.hint}</p>}
      </div>
    )
  }

  if (task.type === 'error') {
    return (
      <div>
        <p className="font-semibold text-white mb-4">{task.prompt}</p>
        <div className="flex flex-wrap gap-2">
          {task.words.map((w, i) => (
            <button
              key={i}
              onClick={() => {
                setSelected(i)
                onAnswer(i)
              }}
              className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                selected === i
                  ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-teal-500'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (task.type === 'order') {
    const used = new Set(chosen)
    const update = (next: number[]) => {
      setChosen(next)
      onAnswer(next.length === task.words.length ? next.map((i) => task.words[i]) : null)
    }
    return (
      <div>
        <p className="font-semibold text-white mb-4">{task.prompt}</p>
        <div className="min-h-[52px] mb-3 flex flex-wrap gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-3">
          {chosen.length === 0 && <span className="text-sm text-slate-500">Сөздерді ретімен басыңыз</span>}
          {chosen.map((i, k) => (
            <span key={k} className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-sm font-medium">
              {task.words[i]}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {bank.map((b) => (
            <button
              key={b.i}
              disabled={used.has(b.i)}
              onClick={() => update([...chosen, b.i])}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 text-sm font-medium hover:border-teal-500 disabled:opacity-30"
            >
              {b.w}
            </button>
          ))}
          <button
            onClick={() => update([])}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:text-teal-300"
          >
            Тазалау
          </button>
        </div>
      </div>
    )
  }

  // match
  return (
    <div>
      <p className="font-semibold text-white mb-4">{task.prompt}</p>
      <div className="space-y-2">
        {task.pairs.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-36 font-bold text-white">{p[0]}</span>
            <select
              value={matchVals[i]}
              onChange={(e) => {
                const next = [...matchVals]
                next[i] = e.target.value
                setMatchVals(next)
                onAnswer(next.every((v) => v) ? next : null)
              }}
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 text-sm outline-none focus:border-teal-500"
            >
              <option value="">Таңдаңыз</option>
              {rightSide.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AssessmentPage() {
  const total = placementTasks.length
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>(() => placementTasks.map(() => null))
  const [done, setDone] = useState(false)

  function setAnswer(a: Answer) {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = a
      return next
    })
  }

  function restart() {
    setAnswers(placementTasks.map(() => null))
    setIndex(0)
    setDone(false)
    setStarted(true)
  }

  function finish() {
    const scores = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 } as Record<Level, number>
    placementTasks.forEach((t, i) => {
      if (isCorrect(t, answers[i])) scores[t.level] += 1
    })
    try {
      localStorage.setItem(
        'qq_placement',
        JSON.stringify({ level: pickLevel(scores), scores, date: new Date().toISOString() }),
      )
    } catch {
      // сақтау мүмкін болмаса, нәтиже бәрібір экранда көрсетіледі
    }
    setDone(true)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const shell = (children: ReactNode) => (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-teal-300 font-bold hover:text-teal-200">
            ← QAZIR
          </Link>
          <span className="text-xs text-slate-400">Деңгей анықтау тесті</span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </main>
  )

  if (!started) {
    return shell(
      <div>
        <h1 className="text-3xl font-extrabold mb-3">Деңгей анықтау тесті</h1>
        <p className="text-slate-300 leading-relaxed mb-4">
          {total} тапсырма: таңдау, жазу, сәйкестендіру, сөйлем құрау, қате табу, тыңдау және оқу.
          Тапсырмалар A1-ден C1-ге дейін біртіндеп қиындайды. Білмесеңіз, жауапсыз өткізіп жіберуге болады.
        </p>
        <ul className="text-sm text-slate-400 space-y-1 mb-6 list-disc pl-5">
          <li>Орташа уақыты: 15–20 минут.</li>
          <li>Тыңдау тапсырмалары үшін құрылғыңызда дыбыс қосулы болсын.</li>
          <li>Нәтиже A1–C1 деңгейімен және әр деңгей бойынша ұпаймен көрсетіледі.</li>
        </ul>
        <button
          onClick={() => setStarted(true)}
          className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
        >
          Тестті бастау
        </button>
      </div>,
    )
  }

  if (done) {
    const scores = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 } as Record<Level, number>
    placementTasks.forEach((t, i) => {
      if (isCorrect(t, answers[i])) scores[t.level] += 1
    })
    const level = pickLevel(scores)
    const sum = PLACEMENT_LEVELS.reduce((s, l) => s + scores[l], 0)
    const wrong = placementTasks
      .map((t, i) => ({ t, i }))
      .filter(({ t, i }) => !isCorrect(t, answers[i]))

    return shell(
      <div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
          <p className="text-sm text-slate-400">Сіздің деңгейіңіз</p>
          <p className="text-6xl font-extrabold text-teal-400 my-2">{level}</p>
          <p className="text-slate-300">{LEVEL_NAMES[level]}</p>
          <p className="text-sm text-slate-400 mt-1">
            Жалпы нәтиже: {sum} / {total}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {PLACEMENT_LEVELS.map((l) => (
            <div key={l}>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{LEVEL_NAMES[l]}</span>
                <span>{scores[l]} / 10</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${scores[l] >= PASS ? 'bg-teal-500' : 'bg-slate-600'}`}
                  style={{ width: `${scores[l] * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Деңгей — қатарынан ең жоғары өтілген деңгей (әр деңгейде кемінде {PASS} дұрыс жауап). Нәтиже
          шамамен бағалайды, сабақтар арқылы нақтылай аласыз.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/learning-path?level=${level}`}
            className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm"
          >
            {level} сабақтарын бастау
          </Link>
          <Link
            href={`/learning-path?tab=grammar&level=${level}`}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-bold text-sm"
          >
            {level} грамматикасы
          </Link>
          <button
            onClick={restart}
            className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-bold hover:text-teal-300"
          >
            Қайта тапсыру
          </button>
        </div>

        {wrong.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-3">Қателермен жұмыс ({wrong.length})</h2>
            <div className="space-y-3">
              {wrong.map(({ t, i }) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
                  <p className="text-xs text-slate-500 mb-1">
                    {i + 1}-тапсырма · {t.level}
                  </p>
                  <p className="text-slate-200">
                    {t.type === 'tf' ? t.statement : t.type === 'listen' ? t.audio : t.prompt}
                  </p>
                  <p className="mt-2 text-emerald-400">Дұрыс жауап: {correctText(t)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>,
    )
  }

  const task = placementTasks[index]
  const answered = answers[index] !== null
  const answeredCount = answers.filter((a) => a !== null).length

  return shell(
    <div>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span>
          {index + 1} / {total}
        </span>
        <span>{task.level}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 mb-6 overflow-hidden">
        <div className="h-full bg-teal-500 transition-all" style={{ width: `${(index / total) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <TaskView key={index} task={task} onAnswer={setAnswer} />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-bold disabled:opacity-30"
        >
          ← Артқа
        </button>
        {index + 1 < total ? (
          <button
            onClick={() => setIndex(index + 1)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold ${
              answered
                ? 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                : 'border border-slate-700 text-slate-400 hover:text-teal-300'
            }`}
          >
            {answered ? 'Келесі →' : 'Өткізіп жіберу →'}
          </button>
        ) : (
          <button
            onClick={finish}
            className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold"
          >
            Нәтижені көру ({answeredCount} / {total} жауап)
          </button>
        )}
      </div>
    </div>,
  )
}
