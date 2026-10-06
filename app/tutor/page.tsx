'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Message {
  role: 'user' | 'model'
  text: string
}

const quickQuestions = [
  '«Сіңлі» мен «қарындас» сөздерінің айырмашылығы неде?',
  'Көптік жалғаулары қалай жалғанады?',
  'Сағат неше болғанын қалай айтамын?',
  '«Бармын» мен «менде бар» қалай қолданылады?',
]

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'Сәлем! Мен сенің қазақ тілі бойынша ЖИ-тьюторыңмын. Грамматика, сөздердің мағынасы немесе жалғаулар туралы кез келген сұрағыңды қой — бәрін қарапайым тілмен түсіндіріп беремін!',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || input).trim()
    if (!textToSend || loading) return

    setInput('')
    setErrorMsg('')

    const nextMessages: Message[] = [...messages, { role: 'user', text: textToSend }]
    setMessages(nextMessages)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        setErrorMsg('Жүйеге қайта кіру қажет.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Қате орын алды')
      } else {
        setMessages((prev) => [...prev, { role: 'model', text: data.reply }])
      }
    } catch {
      setErrorMsg('Серверге қосылу мүмкін болмады.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      {/* Шапка */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/learning-path" className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            ← Кабинетке
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center font-bold text-slate-900 text-lg">
            💬
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">ЖИ-тьютор</h1>
            <p className="text-xs text-slate-400">Қазақ тілі бойынша жеке көмекшің</p>
          </div>
        </div>
      </header>

      {/* Окно диалога */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 flex flex-col justify-between">
        <div className="space-y-4 mb-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-medium rounded-br-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-xs p-4 text-sm text-teal-400 animate-pulse flex items-center gap-2">
                <span>ЖИ жауап дайындап жатыр...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Быстрые вопросы */}
        <div className="pt-2">
          {messages.length <= 2 && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2 font-medium">Дайын сұрақтар:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    disabled={loading}
                    className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-left transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Поле ввода */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Сұрағыңызды жазыңыз (мысалы: көптік жалғау қалай жалғанады?)..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-teal-400 to-emerald-400 hover:opacity-90 disabled:opacity-50 text-slate-900 font-bold px-5 py-3 rounded-xl text-sm transition-all"
            >
              Жіберу
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}