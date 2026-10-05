'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { lessonContent, type Question } from '@/lib/lessons'
import { shuffle } from '@/lib/helpers'
import QuestionCard from '@/components/QuestionCard'

interface MistakeRow {
  id: string
  lesson_id: string
  question_id: string
  wrong_count: number
  correct_streak: number
}

interface MistakeItem extends MistakeRow {
  question: Question
  lessonTitle: string
}

interface Card {
  item: MistakeItem
}

type Stage = 'list' | 'practice' | 'done'

const NEED_CORRECT = 2 // тізімнен шығу үшін қанша рет дұрыс жауап беру керек
const SESSION_SIZE = 10 // бір қайталауда ең көбі қанша сұрақ

export default function ReviewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [items, setItems] = useState<MistakeItem[]>([])

  const [stage, setStage] = useState<Stage>('list')
  const [cards, setCards] = useState<Card[]>([])
  const [idx, setIdx] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [masteredCount, setMasteredCount] = useState(0)
  const [saveWarn, setSaveWarn] = useState(false)

  useEffect(() => {
    async function loadMistakes() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('mistakes')
        .select('id, lesson_id, question_id, wrong_count, correct_streak')
        .eq('user_id', user.id)
        .order('last_wrong_at', { ascending: false })

      if (error) {
        setLoadError(error.message)
        setLoading(false)
        return
      }

      const list: MistakeItem[] = []
      for (const row of (data ?? []) as MistakeRow[]) {
        const lesson = lessonContent[row.lesson_id]
        const question = lesson?.questions.find((q) => q.id === row.question_id)
        if (lesson && question) {
          list.push({ ...row, question, lessonTitle: lesson.title })
        }
      }
      setItems(list)
      setLoadError('')
      setLoading(false)
    }

    loadMistakes()
  }, [router, reloadKey])

  function startPractice() {
    const picked = shuffle(items).slice(0, SESSION_SIZE)
    setCards(picked.map((item) => ({ item })))
    setIdx(0)
    setAnswered(false)
    setCorrectCount(0)
    setMasteredCount(0)
    setSaveWarn(false)
    setStage('practice')
  }

  async function handleAnswered(isCorrect: boolean) {
    setAnswered(true)

    const card = cards[idx]
    if (isCorrect) setCorrectCount((c) => c + 1)

    let failed = false
    const row = card.item

    if (isCorrect) {
      const streak = row.correct_streak + 1
      if (streak >= NEED_CORRECT) {
        const res = await supabase.from('mistakes').delete().eq('id', row.id)
        if (res.error) failed = true
        else setMasteredCount((m) => m + 1)
      } else {
        const res = await supabase.from('mistakes').update({ correct_streak: streak }).eq('id', row.id)
        if (res.error) failed = true
      }
    } else {
      const res = await supabase
        .from('mistakes')
        .update({
          correct_streak: 0,
          wrong_count: row.wrong_count + 1,
          last_wrong_at: new Date().toISOString(),
        })
        .eq('id', row.id)
      if (res.error) failed = true
    }

    if (failed) setSaveWarn(true)
  }

  function handleNext() {
    if (idx + 1 < cards.length) {
      setIdx(idx + 1)
      setAnswered(false)
    } else {
      setStage('done')
    }
  }

  function backToList() {
    setStage('list')
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-teal-400 font-medium animate-pulse">Жүктелуде...</p>
      </div>
    )
  }

  const card = cards[idx]

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <div className="max-w-3xl mx-auto p-6 md:p-10">
        <Link
          href="/learning-path"
          className="inline-block mb-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-bold rounded-xl transition-all"
        >
          ← Оқу траекториясына оралу
        </Link>

        <h1 className="text-3xl font-extrabold mb-2">🔁 Қателер мен қайталау</h1>

        {/* 1. Қателер тізімі */}
        {stage === 'list' && (
          <div>
            {loadError && (
              <div className="mt-4 mb-6 p-3 rounded-lg text-sm border bg-red-500/10 border-red-500/30 text-red-400">
                Қателер тізімін жүктеу мүмкін болмады: {loadError}
              </div>
            )}

            {!loadError && items.length === 0 && (
              <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                <p className="text-4xl mb-3">✨</p>
                <p className="font-bold mb-2">Қазір қателер жоқ</p>
                <p className="text-sm text-slate-400 mb-5">
                  Сабақ тестінде қателескен сұрақтар осы жерде жиналады, содан кейін оларды қайталай аласыз.
                </p>
                <Link
                  href="/learning-path"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl"
                >
                  Сабаққа өту
                </Link>
              </div>
            )}

            {!loadError && items.length > 0 && (
              <div>
                <p className="text-slate-400 mb-6 mt-2">
                  Қателескен сұрақтар: <span className="text-white font-bold">{items.length}</span>. Сұраққа {NEED_CORRECT} рет дұрыс жауап
                  берсеңіз, ол тізімнен шығады.
                </p>

                <button
                  onClick={startPractice}
                  className="w-full mb-8 py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl hover:scale-[1.01] transition-all"
                >
                  Қайталауды бастау ➔
                </button>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4">
                      <p className="text-xs text-slate-500 mb-1">{item.lessonTitle}</p>
                      <p className="font-medium mb-2">{item.question.prompt}</p>
                      <p className="text-xs text-slate-400">
                        Қате: {item.wrong_count} рет · Қатарынан дұрыс: {item.correct_streak} / {NEED_CORRECT}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Қайталау */}
        {stage === 'practice' && card && (
          <div>
            <p className="text-xs text-slate-500 mt-4 mb-4">{card.item.lessonTitle}</p>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Сұрақ {idx + 1} / {cards.length}</span>
              <span>Дұрыс жауап: {correctCount}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all"
                style={{ width: `${((idx + (answered ? 1 : 0)) / cards.length) * 100}%` }}
              />
            </div>

            <QuestionCard
              key={card.item.id}
              question={card.item.question}
              onAnswered={handleAnswered}
              shuffleOptions
            />

            {answered && (
              <button
                onClick={handleNext}
                className="w-full py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl"
              >
                {idx + 1 < cards.length ? 'Келесі ➔' : 'Нәтижені көру'}
              </button>
            )}
          </div>
        )}

        {/* 3. Нәтиже */}
        {stage === 'done' && (
          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-5xl mb-4">{correctCount === cards.length ? '🎉' : '📖'}</p>
            <h2 className="text-2xl font-bold mb-2">Нәтиже: {correctCount} / {cards.length}</h2>
            <p className="text-slate-400 mb-4">
              {masteredCount > 0
                ? `Тізімнен шыққан сұрақ: ${masteredCount}.`
                : 'Бұл жолы тізімнен ешқандай сұрақ шықпады, ештеңе етпейді. Қайталай беріңіз.'}
            </p>

            {saveWarn && (
              <div className="mb-4 p-3 rounded-lg text-sm border bg-red-500/10 border-red-500/30 text-red-400">
                Кейбір нәтижені сақтау мүмкін болмады. Интернетті тексеріп, қайта көріңіз.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={backToList}
                className="px-6 py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl"
              >
                Қателер тізіміне оралу
              </button>
              <Link
                href="/learning-path"
                className="px-6 py-3 bg-slate-800 border border-slate-700 text-teal-300 font-bold rounded-xl"
              >
                Оқу траекториясы
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}