'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false) // false = Кіру, true = Тіркелу
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setIsError(false)

    // Формируем чистый логин
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
    
    if (!cleanUsername) {
      setMessage('Логин тек ағылшын әріптері мен саннан тұруы керек')
      setIsError(true)
      setLoading(false)
      return
    }

    const formattedEmail = `${cleanUsername}@qazaq.com`

    try {
      if (isSignUp) {
        // --- ТІРКЕЛУ (РЕГИСТРАЦИЯ) ---
        const { data, error } = await supabase.auth.signUp({
          email: formattedEmail,
          password: password,
        })

        if (error) throw error

        if (data.session) {
          router.push('/learning-path')
        } else {
          setMessage('Тіркелу сәтті өтті! Енді "Кіру" қосымшасына өтіп, жүйеге кіріңіз.')
          setIsError(false)
          setIsSignUp(false) // Автоматически переключаем на вход после регистрации
        }
      } else {
        // --- КІРУ (ВХОД) ---
        const { error } = await supabase.auth.signInWithPassword({
          email: formattedEmail,
          password: password,
        })

        if (error) throw error
        router.push('/learning-path')
      }
    } catch (error: any) {
      setIsError(true)
      setMessage(error.message || 'Қате орын алды. Логин немесе құпия сөзді тексеріңіз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl">
        
        {/* Переключатель Вкладка: Кіру / Тіркелу */}
        <div className="flex bg-slate-900 p-1 rounded-xl mb-6 border border-slate-700">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setMessage(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              !isSignUp ? 'bg-teal-500 text-slate-900 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Кіру
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setMessage(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              isSignUp ? 'bg-teal-500 text-slate-900 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Тіркелу
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-2 text-center">
          {isSignUp ? 'Жаңа аккаунт ашу' : 'Жүйеге кіру'}
        </h2>
        <p className="text-slate-400 text-sm mb-6 text-center">
          {isSignUp ? 'Логин мен құпия сөз ойлап табыңыз' : 'Логин мен құпия сөзіңізді енгізіңіз'}
        </p>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm text-center border ${
            isError 
              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
              : 'bg-teal-500/10 border-teal-500/30 text-teal-300'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleAuth}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Логин (ағылшынша):</label>
            <input
              type="text"
              placeholder="user123"
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
              placeholder="Кемінде 6 символ"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
        </form>
      </div>
    </div>
  )
}