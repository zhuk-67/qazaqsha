'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { lessonContent, type Lesson } from '@/lib/lessons'

type Stage = 'learn' | 'quiz' | 'result'
type SaveState = 'idle' | 'saving' | 'saved' | 'already' | 'error'

// Күнді жергілікті уақыт бойынша «ЖЖЖЖ-АА-КК» түрінде береді
function localDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const rawId = params?.id
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? '')
  const lesson: Lesson | undefined = lessonContent[id]

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [stage, setStage] = useState<Stage>('learn')
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState('')
  const [streakAfter, setStreakAfter] = useState<number | null>(null)

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setCheckingAuth(false)
    }
    checkUser()
  }, [router])

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-teal-400 font-medium animate-pulse">Жүктелуде...</p>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-lg font-bold">Бұл сабақ әлі дайын емес.</p>
        <Link
          href="/learning-path"
          className="px-5 py-2.5 bg-slate-800 border border-slate-700 text-teal-300 rounded-xl text-sm font-bold"
        >
          ← Оқу траекториясына оралу
        </Link>
      </div>
    )
  }

  const total = lesson.questions.length
  const question = lesson.questions[qIndex]
  const passed = score >= lesson.passScore

  async function saveProgress() {
    if (!lesson) return
    setSaveState('saving')
    setSaveError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: row, error: readError } = await supabase
      .from('profiles')
      .select('completed_lessons, points, streak, last_activity_date')
      .eq('id', user.id)
      .maybeSingle()

    if (readError) {
      setSaveState('error')
      setSaveError(readError.message)
      return
    }

    const done: string[] = row?.completed_lessons ?? []
    if (done.includes(lesson.id)) {
      setSaveState('already')
      return
    }

    // Стрикті есептейміз: бүгін бірінші сабақ па, кеше де оқыған ба
    const today = localDateString(new Date())
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterday = localDateString(yesterdayDate)

    const lastDay: string | null = row?.last_activity_date ?? null
    let newStreak: number = row?.streak ?? 0
    if (lastDay === today) {
      if (newStreak < 1) newStreak = 1
    } else if (lastDay === yesterday) {
      newStreak += 1
    } else {
      newStreak = 1
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      completed_lessons: [...done, lesson.id],
      points: (row?.points ?? 0) + lesson.xp,
      streak: newStreak,
      last_activity_date: today,
    })

    if (error) {
      setSaveState('error')
      setSaveError(error.message)
      return
    }
    setStreakAfter(newStreak)
    setSaveState('saved')
  }

  function handleSelect(i: number) {
    if (selected !== null) return
    setSelected(i)
    if (i === question.answer) setScore((s) => s + 1)
  }

  function handleNext() {
    if (qIndex + 1 < total) {
      setQIndex(qIndex + 1)
      setSelected(null)
    } else {
      setStage('result')
      if (score >= lesson!.passScore) saveProgress()
    }
  }

  function restartQuiz() {
    setQIndex(0)
    setSelected(null)
    setScore(0)
    setSaveState('idle')
    setSaveError('')
    setStage('quiz')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <div className="max-w-3xl mx-auto p-6 md:p-10">
        <Link
          href="/learning-path"
          className="inline-block mb-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-bold rounded-xl transition-all"
        >
          ← Оқу траекториясына оралу
        </Link>

        <h1 className="text-3xl font-extrabold mb-2">{lesson.title}</h1>

        {/* 1. Материал */}
        {stage === 'learn' && (
          <div>
            <p className="text-slate-400 mb-8">{lesson.intro}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {(lesson.letters ?? []).map((letter) => (
                <div key={letter.upper} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 h-16 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-3xl font-bold text-teal-300">
                      {letter.upper}{letter.lower}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{letter.hint}</p>
                  </div>
                  <div className="space-y-1">
                    {letter.examples.map((ex) => (
                      <p key={ex.kk} className="text-sm">
                        <span className="font-bold text-white">{ex.kk}</span>
                        <span className="text-slate-400"> — {ex.ru}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {(lesson.sections ?? []).map((section) => (
              <div key={section.title} className="mb-8">
                <h3 className="text-lg font-bold text-teal-300 mb-3">{section.title}</h3>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div key={item.kk} className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3">
                      <p className="font-bold text-white">{item.kk}</p>
                      <p className="text-sm text-slate-400">
                        {item.ru}
                        {item.note ? ` (${item.note})` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={() => setStage('quiz')}
              className="w-full py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl hover:scale-[1.01] transition-all"
            >
              Тестке өту ➔
            </button>
          </div>
        )}

        {/* 2. Тест */}
        {stage === 'quiz' && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2 mt-4">
              <span>Сұрақ {qIndex + 1} / {total}</span>
              <span>Дұрыс жауап: {score}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all"
                style={{ width: `${((qIndex + (selected !== null ? 1 : 0)) / total) * 100}%` }}
              />
            </div>

            <h2 className="text-xl font-bold mb-5">{question.prompt}</h2>

            <div className="space-y-3 mb-6">
              {question.options.map((opt, i) => {
                let style = 'bg-slate-900 border-slate-700 hover:border-teal-400'
                if (selected !== null) {
                  if (i === question.answer) style = 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                  else if (i === selected) style = 'bg-red-500/20 border-red-400 text-red-200'
                  else style = 'bg-slate-900 border-slate-800 opacity-50'
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={selected !== null}
                    className={`w-full text-left px-5 py-4 rounded-xl border font-medium transition-all ${style}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>

            {selected !== null && (
              <div>
                <div
                  className={`mb-4 p-4 rounded-xl text-sm border ${
                    selected === question.answer
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  <p className="font-bold mb-1">{selected === question.answer ? 'Дұрыс! ✓' : 'Қате ✗'}</p>
                  <p>{question.explain}</p>
                </div>
                <button
                  onClick={handleNext}
                  className="w-full py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl"
                >
                  {qIndex + 1 < total ? 'Келесі ➔' : 'Нәтижені көру'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Нәтиже */}
        {stage === 'result' && (
          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-5xl mb-4">{passed ? '🎉' : '📖'}</p>
            <h2 className="text-2xl font-bold mb-2">Нәтиже: {score} / {total}</h2>

            {passed ? (
              <div>
                <p className="text-emerald-300 font-bold mb-4">Құттықтаймыз! Сабақ өтілді.</p>

                {saveState === 'saving' && <p className="text-sm text-slate-400 mb-4">Сақталуда...</p>}
                {saveState === 'saved' && (
                  <div className="text-sm text-teal-300 mb-4">
                    <p>Прогресс сақталды. +{lesson.xp} XP қосылды.</p>
                    {streakAfter !== null && <p className="mt-1">🔥 Стрик: {streakAfter} күн</p>}
                  </div>
                )}
                {saveState === 'already' && (
                  <p className="text-sm text-slate-400 mb-4">
                    Бұл сабақ бұрын өтілген болатын, сондықтан ұпай қайта қосылмайды.
                  </p>
                )}
                {saveState === 'error' && (
                  <div className="mb-4 p-3 rounded-lg text-sm border bg-red-500/10 border-red-500/30 text-red-400">
                    <p className="mb-2">Прогресті сақтау мүмкін болмады: {saveError}</p>
                    <button
                      onClick={saveProgress}
                      className="px-4 py-2 bg-slate-800 border border-slate-700 text-teal-300 rounded-lg text-xs font-bold"
                    >
                      Қайта сақтау
                    </button>
                  </div>
                )}

                <Link
                  href="/learning-path"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl"
                >
                  Оқу траекториясына оралу
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-slate-400 mb-6">
                  Сабақты өту үшін кемінде {lesson.passScore} дұрыс жауап керек. Материалды қайталап, қайта тырысып көріңіз.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setStage('learn')}
                    className="px-6 py-3 bg-slate-800 border border-slate-700 text-teal-300 font-bold rounded-xl"
                  >
                    Материалды қайталау
                  </button>
                  <button
                    onClick={restartQuiz}
                    className="px-6 py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl"
                  >
                    Тестті қайта бастау
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}