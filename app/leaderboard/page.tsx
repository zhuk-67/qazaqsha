'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Row {
  username: string
  points: number
  streak: number
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Row[]>([])
  const [me, setMe] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle()
      setMe(profile?.username ?? '')

      const { data, error: rpcError } = await supabase.rpc('leaderboard')
      if (rpcError) {
        setError('Рейтингті жүктеу мүмкін болмады. supabase-leaderboard.sql файлын Supabase-те іске қосқаныңызды тексеріңіз. ' + rpcError.message)
      } else {
        setRows((data ?? []) as Row[])
      }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Жүктелуде...</div>
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="max-w-xl mx-auto">
        <Link href="/learning-path" className="text-sm text-slate-400 hover:text-teal-300">
          ← Кабинетке қайту
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">🏅 Рейтинг</h1>
        <p className="text-slate-400 text-sm mb-8">
          XP бойынша ең жақсы 20 оқушы. Есіміңді профиль бетінде өзгертуге болады.
        </p>

        {error && <p className="text-sm text-red-300 mb-4">{error}</p>}

        {!error && rows.length === 0 && <p className="text-slate-400">Әзірге ешкім жоқ.</p>}

        <div className="space-y-2">
          {rows.map((r, i) => {
            const mine = me !== '' && r.username === me
            return (
              <div
                key={i}
                className={`flex items-center justify-between gap-3 p-4 rounded-2xl border ${
                  mine ? 'bg-slate-900 border-teal-500/60' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="w-8 text-center text-lg font-bold">{i < 3 ? medals[i] : i + 1}</span>
                  <div className="min-w-0">
                    <p className="font-bold truncate">
                      {r.username}
                      {mine && <span className="ml-2 text-xs text-teal-300">(сен)</span>}
                    </p>
                    <p className="text-xs text-slate-400">🔥 Стрик: {r.streak} күн</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-teal-300 whitespace-nowrap">{r.points} XP</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}