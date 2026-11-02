'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { levelDefs } from '@/lib/levels'
import { findLesson } from '@/lib/curriculum'
import { grammarTopics, type GrammarBlock, type GrammarQuestion, type GrammarTopic } from '@/lib/grammar'
import { pick } from '@/lib/practice'
import { addHistory } from '@/lib/history'
import QuizRunner, { type QuizResult } from '@/components/QuizRunner'
import SpeakButton from '@/components/SpeakButton'

const KEY = 'qq_study'
const PASS_PERCENT = 60
const XP = 20

type Step = 'rule' | 'practice' | 'test' | 'summary'
const STEPS: { id: Step; label: string }[] = [
  { id: 'rule', label: '1. Ереже' },
  { id: 'practice', label: '2. Жаттығу' },
  { id: 'test', label: '3. Мини-тест' },
  { id: 'summary', label: '4. Қорытынды' },
]

function loadBest(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

function saveBest(id: string, percent: number): void {
  try {
    const all = loadBest()
    if (percent > (all[id] ?? -1)) all[id] = percent
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // сақтау мүмкін болмаса, өткізіп жібереміз
  }
}

function localDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function Block({ b }: { b: GrammarBlock }) {
  if (b.type === 'text') return <p className="text-sm text-slate-300 leading-relaxed">{b.text}</p>
  if (b.type === 'table') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-slate-800">
          <thead>
            <tr className="bg-slate-800">
              {b.head.map((h, i) => (
                <th key={i} className="text-left px-3 py-2 font-semibold text-teal-300 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-800">
                {r.map((c, j) => (
                  <td key={j} className="px-3 py-2 text-slate-200">{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  return (
    <ul className="space-y-2">
      {b.items.map((it, i) => (
        <li key={i} className="flex items-start gap-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
          <SpeakButton text={it.kk} />
          <span>
            <span className="block font-semibold text-sm">{it.kk}</span>
            <span className="block text-xs text-slate-400">{it.ru}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function StudyPage() {
  const router = useRouter()
  const params = useParams()
  const rawId = params?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? ''
  const found = findLesson(id)

  const [step, setStep] = useState<Step>('rule')
  const [result, setResult] = useState<QuizResult | null>(null)
  const [runKey, setRunKey] = useState(0)
  const [best, setBest] = useState<number | null>(null)
  const [save, setSave] = useState<'idle' | 'saved' | 'already' | 'failed' | 'guest'>('idle')
  const [loggedIn, setLoggedIn] = useState(true)

  const topics: GrammarTopic[] = useMemo(
    () => (found ? found.topic.ids.map((tid) => grammarTopics.find((g) => g.id === tid)).filter((g): g is GrammarTopic => !!g) : []),
    [found]
  )
  const exercises: GrammarQuestion[] = useMemo(() => topics.flatMap((t) => t.exercises), [topics])
  const testQuestions: GrammarQuestion[] = useMemo(() => {
    const quiz = topics.flatMap((t) => t.quiz)
    const base = quiz.length >= 6 ? quiz : [...quiz, ...topics.flatMap((t) => t.exercises)]
    return pick(base, Math.min(10, base.length), Math.random)
    // runKey өзгергенде сұрақтар қайта араласады
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics, runKey])

  useEffect(() => {
    const b = loadBest()[id]
    setBest(b === undefined ? null : b)
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      setLoggedIn(!!user)
    }
    check()
  }, [id])

  if (!found || topics.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <p>Бұл сабақ табылмады.</p>
        <Link href="/learning-path" className="text-teal-300 underline">Сабақтарға оралу</Link>
      </div>
    )
  }

  const level = levelDefs.find((l) => l.id === found.level)
  const idx = level ? level.lessons.findIndex((l) => l.id === id) : -1
  const nextLesson = level && idx >= 0 ? level.lessons[idx + 1] : undefined

  async function complete() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSave('guest')
      return
    }
    const { data: row, error: readError } = await supabase
      .from('profiles')
      .select('completed_lessons, points, streak, last_activity_date')
      .eq('id', user.id)
      .maybeSingle()
    if (readError) {
      setSave('failed')
      return
    }
    const done: string[] = row?.completed_lessons ?? []
    const already = done.includes(id)
    const today = localDate(new Date())
    const y = new Date()
    y.setDate(y.getDate() - 1)
    const yesterday = localDate(y)
    const lastDay: string | null = row?.last_activity_date ?? null
    let streak: number = row?.streak ?? 0
    if (lastDay === today) {
      if (streak < 1) streak = 1
    } else if (lastDay === yesterday) {
      streak += 1
    } else {
      streak = 1
    }
    if (already && lastDay === today) {
      setSave('already')
      return
    }
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      completed_lessons: already ? done : [...done, id],
      points: (row?.points ?? 0) + (already ? 0 : XP),
      streak,
      last_activity_date: today,
    })
    if (error) {
      setSave('failed')
      return
    }
    setSave(already ? 'already' : 'saved')
  }

  function finishTest(r: QuizResult) {
    setResult(r)
    const percent = Math.round((r.score / r.total) * 100)
    saveBest(id, percent)
    setBest((b) => (b === null || percent > b ? percent : b))
    addHistory(`lesson:${id}`, r.score, r.total)
    if (percent >= PASS_PERCENT) complete()
    else setSave('idle')
  }

  const percent = result ? Math.round((result.score / result.total) * 100) : 0
  const passed = result ? percent >= PASS_PERCENT : false

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link href="/learning-path" className="text-sm text-slate-400 hover:text-teal-300">← Сабақтар</Link>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="px-3 py-1 bg-teal-500/10 text-teal-400 text-xs font-bold rounded-lg border border-teal-500/20">
            {found.level} · {found.topic.n}-сабақ
          </span>
          {best !== null && <span className="text-xs text-slate-400">Ең жақсы нәтиже: {best}%</span>}
        </div>
        <h1 className="text-3xl font-bold mt-3">{found.topic.kk}</h1>
        <p className="text-slate-400 text-sm mt-1">{found.topic.ru}</p>

        <div className="flex flex-wrap gap-2 mt-5">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                step === s.id ? 'bg-teal-500 text-slate-950 border-teal-500' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {step === 'rule' && (
            <div className="space-y-8">
              {topics.map((t) => (
                <section key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  {topics.length > 1 && <h2 className="text-lg font-bold mb-2">{t.title}</h2>}
                  <p className="text-sm text-slate-200 mb-4">{t.summary}</p>
                  <div className="space-y-4">
                    {t.blocks.map((b, i) => (
                      <Block key={i} b={b} />
                    ))}
                  </div>
                </section>
              ))}
              <button
                type="button"
                onClick={() => setStep('practice')}
                className="px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-semibold text-sm"
              >
                Жаттығуға өту
              </button>
            </div>
          )}

          {step === 'practice' && (
            <div>
              <p className="text-sm text-slate-400 mb-4">Бұл жаттығулар нәтижеге есептелмейді: қателесіп, түсініктемені оқи бер.</p>
              <QuizRunner key={`p-${id}`} questions={exercises} tag="Жаттығу" onFinish={() => setStep('test')} />
            </div>
          )}

          {step === 'test' && (
            <div>
              {!result ? (
                <>
                  <p className="text-sm text-slate-400 mb-4">
                    Мини-тест: {testQuestions.length} сұрақ. {PASS_PERCENT}% және одан жоғары болса, сабақ өтілді деп есептеледі.
                  </p>
                  <QuizRunner key={`t-${id}-${runKey}`} questions={testQuestions} tag="Мини-тест" onFinish={finishTest} />
                </>
              ) : (
                <div>
                  <div className={`rounded-2xl border p-5 ${passed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
                    <p className="text-3xl font-extrabold">{percent}%</p>
                    <p className="text-sm text-slate-300 mt-1">
                      Дұрыс: {result.score}, қате: {result.total - result.score}, барлығы: {result.total}
                    </p>
                    <p className="text-sm mt-3">
                      {passed ? 'Сабақ өтілді.' : `Сабақты өту үшін ${PASS_PERCENT}% керек. Ережені қайталап, тағы бір рет көр.`}
                    </p>
                    {passed && save === 'saved' && <p className="text-sm text-emerald-400 mt-2">Прогрес сақталды, +{XP} ұпай.</p>}
                    {passed && save === 'already' && <p className="text-sm text-slate-400 mt-2">Бұл сабақ бұрын өтілген.</p>}
                    {passed && save === 'failed' && <p className="text-sm text-red-300 mt-2">Прогресті сақтау мүмкін болмады. Қайта көріңіз.</p>}
                    {passed && !loggedIn && <p className="text-sm text-amber-300 mt-2">Прогресті сақтау үшін жүйеге кіріңіз.</p>}
                  </div>

                  {result.wrong.length > 0 && (
                    <div className="mt-5">
                      <h3 className="font-bold mb-2">Қателер</h3>
                      <div className="space-y-2">
                        {result.wrong.map((w, i) => (
                          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm">
                            <p className="font-semibold">{w.prompt}</p>
                            <p className="text-emerald-400 mt-1">
                              Дұрыс жауап: {w.kind === 'choice' ? w.options[w.answer] : w.accepted[0]}
                            </p>
                            <p className="text-slate-400 mt-1">{w.explain}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-slate-300 mt-3">Қайталауға кеңес: «Ереже» бөлімін және осы қателерді қайта оқы.</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() => { setResult(null); setSave('idle'); setRunKey((k) => k + 1) }}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 font-semibold text-sm"
                    >
                      Қайта тапсыру
                    </button>
                    <button type="button" onClick={() => setStep('rule')} className="px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 font-semibold text-sm">
                      Ережені қайталау
                    </button>
                    {passed && nextLesson && (
                      <Link href={`/study/${nextLesson.id}`} className="px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-semibold text-sm">
                        Келесі сабақ
                      </Link>
                    )}
                    {passed && !nextLesson && (
                      <button type="button" onClick={() => router.push('/learning-path')} className="px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-semibold text-sm">
                        Сабақтар тізіміне
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'summary' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-lg font-bold">Қысқаша қайталау</h2>
              {topics.map((t) => (
                <p key={t.id} className="text-sm text-slate-200">
                  {topics.length > 1 && <span className="font-semibold">{t.title}: </span>}
                  {t.summary}
                </p>
              ))}
              <p className="text-xs text-slate-500">
                Осы тақырыппен байланысты мәтін мен сөздік келесі жаңартуларда сабаққа қосылады.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
