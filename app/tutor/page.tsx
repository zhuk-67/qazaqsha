'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { lessonContent } from '@/lib/lessons'

type Msg = { role: 'user' | 'model'; text: string }

const STARTERS = [
  'Қалай дұрыс: «мектепке» ма, «мектепге» ме? Почему?',
  'Объясни 7 падежей казахского языка коротко',
  'Чем отличается «қ» от «к»?',
  'Как сказать «Я учусь в университете» по-казахски?',
]

function errorMessage(code: string): string {
  if (code === 'no_key') return 'ЖИ әлі қосылмаған (сервер кілті жоқ).'
  if (code === 'unauthorized') return 'Қайта кіріп көріңіз.'
  if (code === 'network') return 'Желі қатесі. Қайта көріңіз.'
  return 'ЖИ жауап бере алмады. Бірнеше секундтан соң қайта көріңіз.'
}

export default function TutorPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setReady(true)
    }
    init()
  }, [router])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs, busy])

  async function ask(history: Msg[], mode: 'chat' | 'plan') {
    setBusy(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ mode, messages: history }),
      })
      const data = (await res.json()) as { text?: string; error?: string }
      if (!res.ok || !data.text) {
        setError(errorMessage(data.error ?? ''))
      } else {
        setMsgs([...history, { role: 'model', text: data.text }])
      }
    } catch {
      setError(errorMessage('network'))
    }
    setBusy(false)
  }

  function send(text: string) {
    const t = text.trim()
    if (!t || busy) return
    const history = [...msgs, { role: 'user' as const, text: t }]
    setMsgs(history)
    setValue('')
    ask(history, 'chat')
  }

  async function makePlan() {
    if (busy) return
    setBusy(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    const { data } = await supabase
      .from('mistakes')
      .select('lesson_id, wrong_count')
      .eq('user_id', user.id)
      .order('wrong_count', { ascending: false })
      .limit(40)
    const rows = (data ?? []) as { lesson_id: string; wrong_count: number }[]
    const byLesson = new Map<string, number>()
    rows.forEach((r) => byLesson.set(r.lesson_id, (byLesson.get(r.lesson_id) ?? 0) + (r.wrong_count || 1)))
    const top = [...byLesson.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    const label = (id: string) => lessonContent[id]?.title ?? id
    const summary = top.length
      ? top.map(([id, n]) => `${label(id)}: ${n} ошибок`).join('; ')
      : ''
    if (!summary) {
      setMsgs((m) => [
        ...m,
        { role: 'user', text: 'Составь мне план обучения' },
        { role: 'model', text: 'Қателер әлі жоқ, сондықтан жоспар құруға дерек жеткіліксіз. Бірнеше сабақ өтіп, кейін қайта келіңіз.' },
      ])
      setBusy(false)
      return
    }
    const history = [...msgs, { role: 'user' as const, text: `Мои слабые уроки: ${summary}. Составь план на 3 дня.` }]
    setMsgs(history)
    await ask(history, 'plan')
  }

  if (!ready) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Жүктелуде...</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col min-h-screen">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-sm text-slate-400 hover:text-teal-300">← Басты бет</Link>
          <button
            type="button"
            onClick={() => { setMsgs([]); setError('') }}
            disabled={busy || msgs.length === 0}
            className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40"
          >
            Тазалау
          </button>
        </div>

        <h1 className="text-3xl font-bold">ЖИ репетитор</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Қазақ тілі туралы кез келген сұрақ қой: ЖИ түсіндіріп, мысал келтіреді. ЖИ қателесуі мүмкін, маңызды ережені сабақтан тексер.
        </p>

        <div className="flex-1 mt-5 space-y-3">
          {msgs.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-slate-300 text-sm mb-3">Сұрақты өзің жаз немесе мыналардың бірін бас:</p>
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    disabled={busy}
                    className="text-left text-sm px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={makePlan}
                disabled={busy}
                className="mt-4 px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-semibold text-sm disabled:opacity-50"
              >
                ЖИ оқу жоспарын құр (қателеріме қарап)
              </button>
            </div>
          )}

          {msgs.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[85%] rounded-2xl px-4 py-3 bg-teal-500 text-slate-950 text-sm whitespace-pre-wrap'
                    : 'max-w-[90%] rounded-2xl px-4 py-3 bg-slate-900 border border-slate-800 text-sm whitespace-pre-wrap'
                }
              >
                {m.role === 'model' && <div className="text-xs text-teal-300 mb-1 font-semibold">ЖИ репетитор</div>}
                {m.text}
              </div>
            </div>
          ))}

          {busy && <div className="text-sm text-slate-400">ЖИ жауап жазып жатыр...</div>}
          {error && <div className="text-sm text-red-300 bg-slate-900 border border-red-500 rounded-xl p-3">{error}</div>}
          <div ref={endRef} />
        </div>

        {msgs.length > 0 && (
          <button
            type="button"
            onClick={makePlan}
            disabled={busy}
            className="mt-3 self-start text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40"
          >
            ЖИ оқу жоспары
          </button>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send(value) }}
          className="sticky bottom-0 mt-3 pb-4 pt-2 bg-slate-950 flex gap-2"
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, 600))}
            placeholder="Сұрағыңды жаз..."
            className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={busy || !value.trim()}
            className="px-5 py-3 rounded-xl bg-teal-500 text-slate-950 font-semibold disabled:opacity-50"
          >
            Жіберу
          </button>
        </form>
      </div>
    </div>
  )
}
