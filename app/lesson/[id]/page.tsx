'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { lessonContent, type Lesson } from '@/lib/lessons'
import QuestionCard from '@/components/QuestionCard'

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
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState('')
  const [streakAfter, setStreakAfter] = useState<number | null>(null)
  const [mistakeSaveFailed, setMistakeSaveFailed] = useState(false)

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
    const alreadyDone = done.includes(lesson.id)

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

    // Сабақ бұрын өтілсе, ұпай қосылмайды, бірақ бүгінгі белсенділік стрикке есептеледі
    if (alreadyDone && lastDay === today) {
      setStreakAfter(newStreak)
      setSaveState('already')
      return
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      completed_lessons: alreadyDone ? done : [...done, lesson.id],
      points: (row?.points ?? 0) + (alreadyDone ? 0 : lesson.xp),
      streak: newStreak,
      last_activity_date: today,
    })

    if (error) {
      setSaveState('error')
      setSaveError(error.message)
      return
    }
    setStreakAfter(newStreak)
    setSaveState(alreadyDone ? 'already' : 'saved')
  }

  // Қателескен сұрақты «Қателер мен қайталау» бөліміне сақтайды
  async function saveMistake(questionId: string) {
    if (!lesson) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existing, error: readError } = await supabase
      .from('mistakes')
      .select('wrong_count')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson.id)
      .eq('question_id', questionId)
      .maybeSingle()

    if (readError) {
      setMistakeSaveFailed(true)
      return
    }

    const { error } = await supabase.from('mistakes').upsert(
      {
        user_id: user.id,
        lesson_id: lesson.id,
        question_id: questionId,
        wrong_count: (existing?.wrong_count ?? 0) + 1,
        correct_streak: 0,
        last_wrong_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id,question_id' }
    )
    if (error) setMistakeSaveFailed(true)
  }

  // Тест нәтижесін статистика үшін сақтайды (кесте болмаса, сабаққа кедергі келтірмейді)
  async function saveAttempt(finalScore: number) {
    if (!lesson) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('lesson_attempts').insert({
      user_id: user.id,
      lesson_id: lesson.id,
      score: finalScore,
      total: lesson.questions.length,
      passed: finalScore >= lesson.passScore,
    })
  }

  function handleAnswered(correct: boolean) {
    setAnswered(true)
    if (correct) {
      setScore((sc) => sc + 1)
    } else {
      saveMistake(question.id)
    }
  }

  function handleNext() {
    if (qIndex + 1 < total) {
      setQIndex(qIndex + 1)
      setAnswered(false)
    } else {
      setStage('result')
      saveAttempt(score)
      if (score >= lesson!.passScore) saveProgress()
    }
  }

  function restartQuiz() {
    setQIndex(0)
    setAnswered(false)
    setScore(0)
    setSaveState('idle')
    setSaveError('')
    setMistakeSaveFailed(false)
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
                style={{ width: `${((qIndex + (answered ? 1 : 0)) / total) * 100}%` }}
              />
            </div>

            <QuestionCard key={question.id} question={question} onAnswered={handleAnswered} />

            {answered && (
              <button
                onClick={handleNext}
                className="w-full py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl"
              >
                {qIndex + 1 < total ? 'Келесі ➔' : 'Нәтижені көру'}
              </button>
            )}
          </div>
        )}

        {/* 3. Нәтиже */}
        {stage === 'result' && (
          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-5xl mb-4">{passed ? '🎉' : '📖'}</p>
            <h2 className="text-2xl font-bold mb-2">Нәтиже: {score} / {total}</h2>

            {mistakeSaveFailed && (
              <p className="text-xs text-red-400 mb-3">
                Қателерді «Қателер мен қайталау» бөліміне сақтау мүмкін болмады.
              </p>
            )}

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
                  <div className="text-sm text-slate-400 mb-4">
                    <p>Бұл сабақ бұрын өтілген болатын, сондықтан ұпай қайта қосылмайды.</p>
                    {streakAfter !== null && <p className="mt-1 text-teal-300">🔥 Стрик: {streakAfter} күн</p>}
                  </div>
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

            {score < total && !mistakeSaveFailed && (
              <Link
                href="/review"
                className="inline-block mt-5 text-sm text-teal-300 font-bold hover:text-teal-200"
              >
                🔁 Қателерді қайталау
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}