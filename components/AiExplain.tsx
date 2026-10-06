'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface AiContext {
  question: string
  userAnswer: string
  correctAnswer: string
  explain: string
}

type State = 'idle' | 'loading' | 'done' | 'error'

export default function AiExplain({ ctx }: { ctx: AiContext }) {
  const [state, setState] = useState<State>('idle')
  const [text, setText] = useState('')
  const [errorText, setErrorText] = useState('')

  async function ask() {
    setState('loading')
    setErrorText('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setErrorText('Алдымен жүйеге кіріңіз.')
      setState('error')
      return
    }

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(ctx),
      })
      const data = (await res.json()) as { text?: string; error?: string; status?: number; detail?: string }

      if (res.ok && data.text) {
        setText(data.text)
        setState('done')
        return
      }
      if (data.error === 'no_key') {
        setErrorText('ИИ әлі қосылмаған: сервердегі Gemini кілті табылмады.')
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
        setErrorText('ИИ жауап бере алмады. Кейінірек қайта көріңіз.')
      }
      setState('error')
    } catch {
      setErrorText('Байланыс болмады. Интернетті тексеріңіз.')
      setState('error')
    }
  }

  return (
    <div className="mt-3">
      {state === 'idle' && (
        <button
          type="button"
          onClick={ask}
          className="px-4 py-2 bg-slate-800 border border-slate-700 hover:border-teal-400 text-teal-300 text-xs font-bold rounded-lg"
        >
          🤖 ИИ түсіндірсін
        </button>
      )}
      {state === 'loading' && <p className="text-xs text-slate-400 animate-pulse">ИИ ойланып жатыр...</p>}
      {state === 'done' && (
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200">
          <p className="text-xs font-bold text-teal-300 mb-1">🤖 ИИ түсіндірмесі</p>
          <p className="text-sm whitespace-pre-line">{text}</p>
        </div>
      )}
      {state === 'error' && (
        <div>
          <p className="text-xs text-red-300 mb-2">{errorText}</p>
          <button
            type="button"
            onClick={ask}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-teal-300 text-xs font-bold rounded-lg"
          >
            Қайта көру
          </button>
        </div>
      )}
    </div>
  )
}