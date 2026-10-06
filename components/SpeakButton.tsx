'use client'

import { useState } from 'react'
import { speak, speakErrorMessage } from '@/lib/speak'

type State = 'idle' | 'busy' | 'error'

export default function SpeakButton({ text, withLabel = false }: { text: string; withLabel?: boolean }) {
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')

  async function handleClick() {
    if (state === 'busy') return
    setState('busy')
    setMessage('')
    try {
      await speak(text)
      setState('idle')
    } catch (e) {
      setMessage(speakErrorMessage(e))
      setState('error')
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        aria-label="Тыңдау"
        title="Тыңдау"
        className="inline-flex items-center justify-center gap-1 min-w-8 h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-sm"
      >
        <span>{state === 'busy' ? '⏳' : '🔊'}</span>
        {withLabel && <span className="text-xs font-bold">Тыңдау</span>}
      </button>
      {state === 'error' && <span className="text-xs text-red-300">{message}</span>}
    </span>
  )
}