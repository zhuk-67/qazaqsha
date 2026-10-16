'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  MOODS,
  REASONS,
  addMood,
  loadMoods,
  loadReason,
  saveReason,
  suggestionFor,
  type MoodEntry,
  type MoodId,
} from '@/lib/mood'

function errorText(code: string): string {
  if (code === 'no_key') return 'ЖИ әлі қосылмаған (сервер кілті жоқ).'
  if (code === 'unauthorized') return 'Қайта кіріп көріңіз.'
  return 'ЖИ жауап бере алмады. Кейінірек қайта көріңіз.'
}

export default function MoodPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [reason, setReason] = useState('')
  const [saved, setSaved] = useState(false)
  const [mood, setMood] = useState<MoodId | null>(null)
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [log, setLog] = useState<MoodEntry[]>([])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setReason(loadReason())
      setLog(loadMoods())
      setReady(true)
    }
    init()
  }, [router])

  function saveMyReason(text: string) {
    saveReason(text)
    setReason(text.trim().slice(0, 300))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function choose(id: MoodId) {
    if (busy) return
    setMood(id)
    setReply('')
    setError('')
    addMood(id)
    setLog(loadMoods())
    setBusy(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ mood: id, reason: loadReason() }),
      })
      const data = (await res.json()) as { text?: string; error?: string }
      if (!res.ok || !data.text) setError(errorText(data.error ?? ''))
      else setReply(data.text)
    } catch {
      setError(errorText('network'))
    }
    setBusy(false)
  }

  if (!ready) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Жүктелуде...</div>
  }

  const sug = mood ? suggestionFor(mood) : null
  const recent = log.slice(-7)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href="/" className="text-sm text-slate-400 hover:text-teal-300">← Басты бет</Link>
        <h1 className="text-3xl font-bold mt-4">Күйің қалай?</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Бүгінгі көңіл-күйіңді таңда: ЖИ қолдау сөз айтып, оқуға лайықты қадам ұсынады.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => choose(m.id)}
              disabled={busy}
              className={`rounded-2xl border p-4 text-center transition-all disabled:opacity-60 ${
                mood === m.id ? 'bg-slate-800 border-teal-500' : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <div className="text-3xl">{m.emoji}</div>
              <div className="text-sm font-semibold mt-2">{m.label}</div>
            </button>
          ))}
        </div>

        {busy && <p className="text-sm text-slate-400 mt-4">ЖИ жауап жазып жатыр...</p>}
        {error && <p className="text-sm text-red-300 mt-4">{error}</p>}
        {reply && (
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs text-teal-300 font-semibold mb-1">ЖИ көмекші</p>
            <p className="text-sm whitespace-pre-wrap">{reply}</p>
            {sug && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-300 mb-2">{sug.text}</p>
                <Link href={sug.href} className="inline-block px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-semibold text-sm">
                  {sug.label}
                </Link>
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-3">ЖИ қателесуі мүмкін. Бұл кеңес психологтың орнын баспайды.</p>

        {recent.length > 0 && (
          <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
            <span>Соңғы күйлер:</span>
            {recent.map((e, i) => (
              <span key={i} title={new Date(e.at).toLocaleDateString('ru-RU')} className="text-xl">
                {MOODS.find((m) => m.id === e.mood)?.emoji}
              </span>
            ))}
          </div>
        )}

        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-xl font-bold">Неге үйренемін?</h2>
          <p className="text-slate-400 text-sm mt-1">
            Өз себебіңді бір рет жаз. Ол басты бетте көрінеді және қиын сәтте мотивация береді.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="text-sm px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700"
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 300))}
            rows={3}
            placeholder="Мысалы: әжемен қазақша сөйлескім келеді"
            className="w-full mt-3 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-teal-500 text-sm"
          />
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => saveMyReason(reason)}
              className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-semibold text-sm"
            >
              Сақтау
            </button>
            {saved && <span className="text-sm text-emerald-400">Сақталды</span>}
            <span className="text-xs text-slate-500 ml-auto">{reason.length}/300</span>
          </div>
          <p className="text-xs text-slate-500 mt-3">Себеп пен күйлер тек осы құрылғыда сақталады.</p>
        </div>
      </div>
    </div>
  )
}
