'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const MAX_TEXT = 600
const KAZAKH_LETTERS = ['ә', 'ғ', 'қ', 'ң', 'ө', 'ұ', 'ү', 'һ', 'і']

type State = 'idle' | 'loading' | 'done' | 'error'

export default function CheckPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [value, setValue] = useState('')
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState('')
  const [errorText, setErrorText] = useState('')
  const areaRef = useRef<HTMLTextAreaElement>(null)

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

  function insertLetter(letter: string) {
    const el = areaRef.current
    if (!el) {
      setValue((v) => (v + letter).slice(0, MAX_TEXT))
      return
    }
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const next = (value.slice(0, start) + letter + value.slice(end)).slice(0, MAX_TEXT)
    setValue(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + letter.length, start + letter.length)
    })
  }

  async function handleCheck() {
    if (value.trim() === '' || state === 'loading') return
    setState('loading')
    setErrorText('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text: value }),
      })
      const data = (await res.json()) as { text?: string; error?: string; status?: number; detail?: string }

      if (res.ok && data.text) {
        setResult(data.text)
        setState('done')
        return
      }
      if (data.error === 'no_key') {
        setErrorText('ЖИ әлі қосылмаған: сервердегі Gemini кілті табылмады.')
      } else if (data.error === 'unauthorized') {
        setErrorText('Жүйеге қайта кіріп көріңіз.')
      } else if (data.error === 'provider') {
        let reason = 'Gemini қате қайтарды.'
        if (data.status === 400) reason = 'Gemini кілті қате немесе сұраныс дұрыс емес.'
        else if (data.status === 403) reason = 'Gemini кілтіне рұқсат жоқ.'
        else if (data.status === 404) reason = 'Gemini моделі табылмады.'
        else if (data.status === 429) reason = 'Тегін лимит бітті. Біраз күтіп, қайта көріңіз.'
        setErrorText(`${reason} (код ${data.status ?? '?'}${data.detail ? ': ' + data.detail : ''})`)
      } else {
        setErrorText('ЖИ жауап бере алмады. Кейінірек қайта көріңіз.')
      }
      setState('error')
    } catch {
      setErrorText('Байланыс болмады. Интернетті тексеріңіз.')
      setState('error')
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-teal-400 font-medium animate-pulse">Жүктелуде...</p>
      </div>
    )
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

        <h1 className="text-3xl font-extrabold mb-2">✍️ Мәтінді тексеру</h1>
        <p className="text-slate-400 mb-6">
          Қазақша сөйлем немесе шағын мәтін жазыңыз. ЖИ қателерді түзетіп, оларды орыс тілінде түсіндіреді.
        </p>

        <textarea
          ref={areaRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_TEXT))}
          rows={5}
          placeholder="Мысалы: Мен студентмін. Менің әкем дәрігер."
          spellCheck={false}
          className="w-full px-5 py-4 mb-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-teal-400 outline-none text-lg"
        />
        <p className="text-xs text-slate-500 mb-3 text-right">
          {value.length} / {MAX_TEXT}
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          {KAZAKH_LETTERS.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => insertLetter(letter)}
              className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 hover:border-teal-400 text-teal-300 font-bold"
            >
              {letter}
            </button>
          ))}
        </div>

        <button
          onClick={handleCheck}
          disabled={value.trim() === '' || state === 'loading'}
          className="w-full py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl disabled:opacity-40"
        >
          {state === 'loading' ? 'ЖИ тексеріп жатыр...' : 'Тексеру ➔'}
        </button>

        {state === 'error' && (
          <div className="mt-6 p-4 rounded-xl text-sm border bg-red-500/10 border-red-500/30 text-red-300">
            {errorText}
          </div>
        )}

        {state === 'done' && (
          <div className="mt-6 p-5 rounded-xl bg-slate-900 border border-slate-700">
            <p className="text-sm font-bold text-teal-300 mb-2">🤖 ЖИ жауабы</p>
            <p className="whitespace-pre-line text-slate-200">{result}</p>
            <p className="mt-4 text-xs text-slate-500">
              ЖИ қателесуі мүмкін. Күмән болса, мұғалімнен немесе сөздіктен тексеріңіз.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}