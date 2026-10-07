'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { currentLevelId, totalDone, totalLessonCount } from '@/lib/levels'

interface Row {
  username: string
  points: number
  streak: number
  completed_lessons: string[] | null
}

interface Me {
  username: string
  points: number
  completed: string[]
}

function percentOf(completed: string[]): number {
  return Math.round((totalDone(completed) / totalLessonCount) * 100)
}

export default function LeaderboardPanel({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(true)
  const [rows, setRows] = useState<Row[]>([])
  const [me, setMe] = useState<Me | null>(null)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoggedIn(false)
        setLoading(false)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, points, completed_lessons')
        .eq('id', user.id)
        .maybeSingle()
      setMe({
        username: profile?.username || user.email?.split('@')[0] || 'Оқушы',
        points: profile?.points ?? 0,
        completed: (profile?.completed_lessons as string[] | null) ?? [],
      })

      const { data, error: rpcError } = await supabase.rpc('leaderboard')
      if (rpcError) {
        setError('Рейтингті жүктеу мүмкін болмады. supabase-leaderboard.sql файлын Supabase-те іске қосыңыз. ' + rpcError.message)
      } else {
        setRows((data ?? []) as Row[])
      }
      const { data: rank } = await supabase.rpc('my_rank')
      if (typeof rank === 'number') setMyRank(rank)
      setLoading(false)
    }
    load()
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Рейтинг"
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">🏆 Рейтинг</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Жабу"
            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            ✕
          </button>
        </div>

        {loading && <p className="text-slate-400 text-sm animate-pulse">Жүктелуде...</p>}

        {!loading && !loggedIn && (
          <div className="text-sm">
            <p className="text-slate-400 mb-4">Рейтингті көру үшін алдымен сайтқа кіру керек.</p>
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl"
            >
              Кіру
            </Link>
          </div>
        )}

        {!loading && loggedIn && me && (
          <>
            <div className="bg-slate-800/60 border border-teal-500/40 rounded-2xl p-4 mb-5">
              <p className="text-xs text-slate-400 mb-2">Сіздің нәтижеңіз</p>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold truncate">{me.username}</p>
                  <p className="text-xs text-slate-400">Деңгей: {currentLevelId(me.completed)}</p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="font-bold text-teal-300">{me.points} XP</p>
                  <p className="text-xs text-slate-400">{myRank ? `Орын: ${myRank}` : 'Орын: —'}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Жалпы прогресс</span>
                  <span>{percentOf(me.completed)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-emerald-400"
                    style={{ width: `${percentOf(me.completed)}%` }}
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-300 mb-3">{error}</p>}
            {!error && rows.length === 0 && <p className="text-slate-400 text-sm">Әзірге ешкім жоқ.</p>}

            <div className="space-y-2">
              {rows.map((r, i) => {
                const done = (r.completed_lessons ?? []) as string[]
                const mine = r.username === me.username
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl border ${mine ? 'border-teal-500/60' : 'border-slate-800'} bg-slate-800/40`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 text-center font-bold">{i < 3 ? medals[i] : i + 1}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">
                            {r.username}
                            {mine && <span className="ml-2 text-xs text-teal-300">(сен)</span>}
                          </p>
                          <p className="text-xs text-slate-400">
                            Деңгей: {currentLevelId(done)} · 🔥 {r.streak} күн
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-teal-300 whitespace-nowrap">{r.points} XP</span>
                    </div>
                    <div className="mt-2 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-400 to-emerald-400"
                        style={{ width: `${percentOf(done)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-slate-500 mt-4">Есіміңді профиль бетінде өзгертуге болады.</p>
          </>
        )}
      </div>
    </div>
  )
}