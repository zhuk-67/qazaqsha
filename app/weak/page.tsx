'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { lessonContent } from '@/lib/lessons'
import { grammarTopics } from '@/lib/grammar'
import { loadSrs } from '@/lib/srs'

interface MistakeRow {
  lesson_id: string
  question_id: string
  wrong_count: number
}
interface Attempt {
  lesson_id: string
  score: number
  total: number
}

const TYPE_NAMES: Record<string, string> = {
  choice: 'Дұрыс жауапты таңдау',
  write: 'Сөзді өзің жазу',
  match: 'Жұптарды сәйкестендіру',
}

interface LessonWeak {
  id: string
  title: string
  wrong: number
  avg: number | null
  score: number
}

export default function WeakPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lessons, setLessons] = useState<LessonWeak[]>([])
  const [types, setTypes] = useState<[string, number][]>([])
  const [levels, setLevels] = useState<[string, number][]>([])
  const [mistakeTotal, setMistakeTotal] = useState(0)
  const [placementWeak, setPlacementWeak] = useState<string[]>([])
  const [grammarWeak, setGrammarWeak] = useState<{ id: string; title: string; best: number }[]>([])
  const [forgotWords, setForgotWords] = useState(0)
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: mis, error: e1 } = await supabase
        .from('mistakes')
        .select('lesson_id, question_id, wrong_count')
        .eq('user_id', user.id)
      const { data: att, error: e2 } = await supabase
        .from('lesson_attempts')
        .select('lesson_id, score, total')
        .eq('user_id', user.id)
        .limit(1000)
      if (e1 || e2) setError((e1 ?? e2)?.message ?? '')

      const rows = (mis ?? []) as MistakeRow[]
      const attempts = (att ?? []) as Attempt[]

      const wrongByLesson: Record<string, number> = {}
      const typeCount: Record<string, number> = {}
      const levelCount: Record<string, number> = {}
      let total = 0
      for (const r of rows) {
        const lesson = lessonContent[r.lesson_id]
        const q = lesson?.questions.find((x) => x.id === r.question_id)
        if (!lesson || !q) continue
        total += 1
        wrongByLesson[r.lesson_id] = (wrongByLesson[r.lesson_id] ?? 0) + r.wrong_count
        const t = q.type ?? 'choice'
        typeCount[t] = (typeCount[t] ?? 0) + 1
        const lv = r.lesson_id.split('-')[0].toUpperCase()
        levelCount[lv] = (levelCount[lv] ?? 0) + 1
      }
      setMistakeTotal(total)

      const list: LessonWeak[] = []
      for (const lesson of Object.values(lessonContent)) {
        const a = attempts.filter((x) => x.lesson_id === lesson.id && x.total > 0)
        const avg = a.length ? a.reduce((s, x) => s + x.score / x.total, 0) / a.length : null
        const wrong = wrongByLesson[lesson.id] ?? 0
        if (wrong === 0 && (avg === null || avg >= 0.8)) continue
        list.push({ id: lesson.id, title: lesson.title, wrong, avg, score: wrong + (avg !== null ? (1 - avg) * 5 : 0) })
      }
      list.sort((a, b) => b.score - a.score)
      setLessons(list.slice(0, 5))
      setTypes(Object.entries(typeCount).sort((a, b) => b[1] - a[1]))
      setLevels(Object.entries(levelCount).sort((a, b) => b[1] - a[1]))

      try {
        const p = localStorage.getItem('qq_placement')
        if (p) {
          const sc = (JSON.parse(p) as { scores?: Record<string, number> }).scores ?? {}
          setPlacementWeak(Object.entries(sc).filter(([, v]) => v < 6).map(([k]) => k))
        }
        const g = localStorage.getItem('qq_grammar_best')
        if (g) {
          const best = JSON.parse(g) as Record<string, number>
          setGrammarWeak(
            grammarTopics
              .filter((t) => best[t.id] !== undefined && best[t.id] < 80)
              .map((t) => ({ id: t.id, title: t.title, best: best[t.id] }))
              .sort((a, b) => a.best - b.best)
              .slice(0, 6),
          )
        }
      } catch {
        // жергілікті деректер жоқ болса, өткізіп жібереміз
      }
      const srs = loadSrs()
      setForgotWords(Object.values(srs).filter((e) => e.forgot > 0).length)
      setHasData(rows.length > 0 || attempts.length > 0)
      setLoading(false)
    }
    load()
  }, [router])

  const shell = (children: ReactNode) => (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-teal-300 font-bold hover:text-teal-200">
            ← QAZIR
          </Link>
          <span className="text-xs text-slate-400">Менің әлсіз тұстарым</span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </main>
  )

  if (loading) return shell(<p className="text-slate-400">Талдануда...</p>)

  const maxType = Math.max(1, ...types.map((t) => t[1]))
  const maxLevel = Math.max(1, ...levels.map((t) => t[1]))

  const advice: ReactNode[] = []
  if (lessons[0]) {
    advice.push(
      <>
        Ең көп қате: «{lessons[0].title}» сабағында. <Link className="text-teal-300 underline" href={`/lesson/${lessons[0].id}`}>Сабақты қайталаңыз</Link>.
      </>,
    )
  }
  if (mistakeTotal > 0) {
    advice.push(
      <>
        Қате дәптерінде {mistakeTotal} сұрақ тұр. <Link className="text-teal-300 underline" href="/review">Қателермен жұмыс істеңіз</Link>.
      </>,
    )
  }
  if (types[0] && types[0][1] >= 2) {
    advice.push(<>Көбірек қателесетін тапсырма түрі: «{TYPE_NAMES[types[0][0]] ?? types[0][0]}». Осы түрді көбірек жаттықтырыңыз.</>)
  }
  if (grammarWeak.length > 0) {
    advice.push(
      <>
        Грамматикада {grammarWeak.length} тақырыптың тесті 80%-дан төмен. <Link className="text-teal-300 underline" href="/learning-path?tab=grammar">Грамматиканы ашу</Link>.
      </>,
    )
  }
  if (placementWeak.length > 0) {
    advice.push(<>Деңгей тестінде {placementWeak.join(', ')} деңгейі әлсіз шықты: осы деңгейдің сабақтарын мұқият өтіңіз.</>)
  }
  if (forgotWords > 0) {
    advice.push(
      <>
        {forgotWords} сөзді ұмытып жүрсіз. <Link className="text-teal-300 underline" href="/repeat">Сөздерді қайталаңыз</Link>.
      </>,
    )
  }

  return shell(
    <div>
      <h1 className="text-3xl font-extrabold mb-2">Менің әлсіз тұстарым</h1>
      <p className="text-slate-300 mb-6">Қателеріңіз бен нәтижелеріңіз бойынша қай жерді күшейту керегін көрсетеміз.</p>
      {error && <p className="text-sm text-red-400 mb-4">Деректерді жүктеу қатесі: {error}</p>}

      {!hasData ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-slate-300 mb-4">Талдауға деректер әлі жоқ. Бірнеше сабақ өтіңіз, содан кейін осында оралыңыз.</p>
          <Link href="/learning-path" className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm inline-block">
            Сабақтарға өту
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold mb-3">Ұсыныстар</h2>
            {advice.length === 0 ? (
              <p className="text-emerald-400 text-sm">Әзірге айқын әлсіз тұс жоқ. Осылай жалғастырыңыз!</p>
            ) : (
              <ul className="space-y-2">
                {advice.map((a, k) => (
                  <li key={k} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200">
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {lessons.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">Қайталауды қажет ететін сабақтар</h2>
              <div className="space-y-2">
                {lessons.map((l) => (
                  <Link
                    key={l.id}
                    href={`/lesson/${l.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 hover:border-teal-500 px-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-white">{l.title}</span>
                    <span className="text-xs text-slate-400">
                      қате: {l.wrong}
                      {l.avg !== null && ` · орташа ${Math.round(l.avg * 100)}%`}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {types.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">Қате түрлері</h2>
              <div className="space-y-3">
                {types.map(([t, n]) => (
                  <div key={t}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{TYPE_NAMES[t] ?? t}</span>
                      <span>{n}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-red-400/80" style={{ width: `${(n / maxType) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {levels.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">Қателер деңгей бойынша</h2>
              <div className="space-y-3">
                {levels.map(([t, n]) => (
                  <div key={t}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{t}</span>
                      <span>{n}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: `${(n / maxLevel) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {grammarWeak.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">Грамматика: тесті әлсіз тақырыптар</h2>
              <div className="space-y-2">
                {grammarWeak.map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm">
                    <span>{g.title}</span>
                    <span className="text-xs text-red-300">{g.best}%</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>,
  )
}
