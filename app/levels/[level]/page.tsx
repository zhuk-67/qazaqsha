'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { levelDefs } from '@/lib/levels'
import { curLevelByParam, curriculum, curStats, type CurStatus } from '@/lib/curriculum'
import { readingTexts } from '@/lib/texts'
import { grammarTopics } from '@/lib/grammar'

const statusLabel: Record<CurStatus, string> = {
  ready: 'Дайын',
  partial: 'Басқа тақырыптың ішінде',
  planned: 'Жақында',
}
const statusClass: Record<CurStatus, string> = {
  ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  partial: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  planned: 'bg-slate-800 text-slate-400 border-slate-700',
}

export default function LevelPage() {
  const params = useParams()
  const rawLevel = params?.level
  const info = curLevelByParam(Array.isArray(rawLevel) ? rawLevel[0] : rawLevel)
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

  if (!info) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <p>Мұндай деңгей жоқ.</p>
        <Link href="/levels" className="text-teal-300 underline">Деңгейлерге оралу</Link>
      </div>
    )
  }

  const def = levelDefs.find((d) => d.id === info.id)
  const topics = curriculum[info.id]
  const st = curStats(info.id)
  const texts = readingTexts.filter((t) => t.level === info.id)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/levels" className="text-sm text-slate-400 hover:text-teal-300">← Барлық деңгейлер</Link>
        <div className="flex items-center gap-4 mt-4">
          <span className="text-5xl font-extrabold text-teal-300">{info.id}</span>
          <div>
            <h1 className="text-2xl font-bold">{info.name}</h1>
            <p className="text-slate-400 text-sm">{info.ru}</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm mt-3">{info.focus}</p>

        {def && (
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-3">Сабақтар</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {def.lessons.map((l) => {
                const done = completed.includes(l.id)
                return (
                  <Link key={l.id} href={`/lesson/${l.id}`} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-teal-500 transition-all">
                    <p className="text-2xl">{l.icon}</p>
                    <p className="font-semibold mt-1">{l.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{l.desc}</p>
                    {done && <p className="text-xs text-emerald-400 mt-2">Аяқталды ✓</p>}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-bold">Грамматика бағдарламасы</h2>
          <p className="text-xs text-slate-400 mt-1">
            Дайын: {st.ready}, басқа тақырыптың ішінде: {st.partial}, жақында: {st.planned}. Барлығы {st.total} тақырып.
          </p>
          {topics.length === 0 ? (
            <p className="text-sm text-slate-400 mt-3">Академиялық, ғылыми, көркем және кәсіби қолдану материалдары жақында қосылады.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {topics.map((tp) => {
                const firstId = tp.ids.find((id) => grammarTopics.some((g) => g.id === id))
                const body = (
                  <>
                    <span className="text-xs text-slate-500 w-6 shrink-0">{tp.n}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-sm">{tp.kk}</span>
                      <span className="block text-xs text-slate-400">{tp.ru}</span>
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-lg border shrink-0 ${statusClass[tp.status]}`}>{statusLabel[tp.status]}</span>
                  </>
                )
                return firstId ? (
                  <Link
                    key={tp.n}
                    href={`/learning-path?tab=grammar&topic=${firstId}`}
                    className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 hover:border-teal-500 transition-all"
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={tp.n} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 opacity-80">
                    {body}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">Мәтіндер, сөздік, тест</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link href="/texts" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-teal-500 transition-all">
              <p className="font-semibold">Қазақша мәтіндер</p>
              <p className="text-xs text-slate-400 mt-1">{info.id} деңгейінде қазір {texts.length} мәтін</p>
            </Link>
            <Link href="/dictionary" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-teal-500 transition-all">
              <p className="font-semibold">Сөздік</p>
              <p className="text-xs text-slate-400 mt-1">Деңгей бойынша сөздер мен мысалдар</p>
            </Link>
            <Link href="/checkpoint" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-teal-500 transition-all">
              <p className="font-semibold">Checkpoint-тест</p>
              <p className="text-xs text-slate-400 mt-1">Деңгей бойынша аралық тексеру</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
