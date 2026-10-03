'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Формируем внутренний e-mail из логина, так как Supabase требует формат почты
    const fakeEmail = `${username.trim().toLowerCase()}@qazaqqadam.local`

    try {
      if (isSignUp) {
        // Тіркелу (Регистрация)
        const { error } = await supabase.auth.signUp({
          email: fakeEmail,
          password: password,
        })
        if (error) throw error
        setMessage('Тіркелу сәтті өтті! Енді жүйеге кіре аласыз.')
        setIsSignUp(false)
      } else {
        // Кіру (Вход)
        const { error } = await supabase.auth.signInWithPassword({
          email: fakeEmail,
          password: password,
        })
        if (error) throw error
        router.push('/learning-path')
      }
    } catch (error: any) {
      setMessage(error.message || 'Қате орын алды. Логин немесе құпия сөзді тексеріңіз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <form onSubmit={handleAuth} className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold mb-2 text-center">
          {isSignUp ? 'Тіркелу' : 'Кіру'}
        </h2>
        <p className="text-slate-400 text-sm mb-6 text-center">
          {isSignUp ? 'Жаңа аккаунт жасау үшін логин ойлап табыңыз' : 'Оқуды жалғастыру үшін логин мен құпия сөзді енгізіңіз'}
        </p>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-sm text-center">
            {message}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Логин (никнейм):</label>
          <input
            type="text"
            placeholder="Мысалы: user123"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-400 transition-colors"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Құпия сөз:</label>
          <input
            type="password"
            placeholder="Құпия сөз"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-400 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl hover:from-teal-300 hover:to-emerald-300 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
        >
          {loading ? 'Күте тұрыңыз...' : isSignUp ? 'Тіркелу' : 'Кіру'}
        </button>

        <p className="mt-6 text-sm text-slate-400 text-center">
          {isSignUp ? 'Аккаунтыңыз бар ма?' : 'Аккаунтыңыз жоқ па?'}{' '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-teal-400 hover:underline font-medium"
          >
            {isSignUp ? 'Кіру' : 'Тіркелу'}
          </button>
        </p>
      </form>
    </div>
  )
}