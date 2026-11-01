'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { levelDefs, doneInLevel } from '@/lib/levels'
import { curLevels, curStats } from '@/lib/curriculum'

export default function LevelsPage() {
  const [completed, setCompleted] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('completed_lessons').eq('id', user.id).maybeSingle()
      setCompleted((data?.completed_lessons as string[] | null) ?? [])
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link href="/" className="text-sm text-slate-400 hover:text-teal-300">← Басты бет</Link>
        <h1 className="text-3xl font-bold mt-4">Деңгейлер</h1>
        <p className="text-slate-400 mt-2 text-sm max-w-2xl">
          A1-ден C1-ге дейін жүйелі бағдарлама, C2 кеңейтілген деңгей ретінде. Бағдарлама КАЗТЕСТ пен CEFR деңгейлеріне сүйеніп жасалған, бірақ бұл КАЗТЕСТ-тің ресми бөлінісі емес.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {curLevels.map((lv) => {
            const def = levelDefs.find((d) => d.id === lv.id)
            const st = curStats(lv.id)
            const done = def ? doneInLevel(def, completed) : 0
            const lessons = def ? def.lessons.length : 0
            const card = (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-extrabold text-teal-300">{lv.id}</span>
                  <div>
                    <p className="font-bold">{lv.name}</p>
                    <p className="text-xs text-slate-400">{lv.ru}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mt-3">{lv.focus}</p>
                {lv.extended ? (
                  <p className="text-xs text-slate-400 mt-4">Кеңейтілген деңгей: материалдар жақында қосылады.</p>
                ) : (
                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <div>
                      <div className="flex justify-between"><span>Сабақтар</span><span>{done} / {lessons}</span></div>
                      <div className="h-2 rounded-full bg-slate-800 mt-1 overflow-hidden">
                        <div className="h-full bg-teal-400" style={{ width: `${lessons ? Math.round((done / lessons) * 100) : 0}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between"><span>Грамматика бағдарламасы (дайын тақырыптар)</span><span>{st.ready + st.partial} / {st.total}</span></div>
                      <div className="h-2 rounded-full bg-slate-800 mt-1 overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${st.total ? Math.round(((st.ready + st.partial) / st.total) * 100) : 0}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )
            return lv.extended ? (
              <div key={lv.id} className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-5">{card}</div>
            ) : (
              <Link key={lv.id} href={`/levels/${lv.id.toLowerCase()}`} className="block bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-teal-500 transition-all">
                {card}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
