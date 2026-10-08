'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ThemeToggle from '@/components/ThemeToggle'
import {
  levelDefs,
  doneInLevel,
  isLevelFinished,
  currentLevelId,
  totalDone,
  totalLessonCount,
  type LevelId,
} from '@/lib/levels'

interface Attempt {
  score: number
  total: number
  created_at: string
}

const WEEKDAYS = ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб']

function localDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Суретті 96x96 шаршы етіп кесіп, кішкентай JPEG-ке айналдырады
function resizeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('image'))
      img.onload = () => {
        const size = 96
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('canvas'))
          return
        }
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export default function ProfilePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarMsg, setAvatarMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const [points, setPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [mistakeCount, setMistakeCount] = useState(0)
  const [placement, setPlacement] = useState<string | null>(null)
  const [grammarDone, setGrammarDone] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: p } = await supabase
        .from('profiles')
        .select('username, avatar, completed_lessons, points, streak, last_activity_date')
        .eq('id', user.id)
        .maybeSingle()

      const fallback = (user.email ?? '').split('@')[0]
      setName((p?.username as string | undefined) || fallback || 'Қолданушы')
      setAvatar((p?.avatar as string | null | undefined) ?? null)
      if (p) {
        setCompleted(p.completed_lessons ?? [])
        setPoints(p.points ?? 0)
        const today = localDateString(new Date())
        const y = new Date()
        y.setDate(y.getDate() - 1)
        const last: string | null = p.last_activity_date ?? null
        setStreak(last === today || last === localDateString(y) ? (p.streak ?? 0) : 0)
      }

      const { data: att, error: attErr } = await supabase
        .from('lesson_attempts')
        .select('score, total, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000)
      if (attErr) setError(attErr.message)
      else setAttempts((att ?? []) as Attempt[])

      const { count } = await supabase
        .from('mistakes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setMistakeCount(count ?? 0)

      try {
        const raw = localStorage.getItem('qq_placement')
        if (raw) setPlacement((JSON.parse(raw) as { level?: string }).level ?? null)
        const g = localStorage.getItem('qq_grammar_best')
        if (g) {
          const best = JSON.parse(g) as Record<string, number>
          setGrammarDone(Object.values(best).filter((v) => v >= 80).length)
        }
      } catch {
        // жергілікті деректер жоқ болса, жай өткізіп жібереміз
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvatarMsg('')
    if (!file.type.startsWith('image/')) {
      setAvatarMsg('Тек сурет файлын таңдаңыз.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setAvatarMsg('Сурет тым үлкен (8 МБ-тан аспауы керек).')
      return
    }
    setBusy(true)
    try {
      const data = await resizeAvatar(file)
      const { data: u } = await supabase.auth.getUser()
      if (!u.user) throw new Error('Сессия жоқ')
      const { error: err } = await supabase.from('profiles').update({ avatar: data }).eq('id', u.user.id)
      if (err) throw new Error(err.message)
      setAvatar(data)
      setAvatarMsg('Аватар сақталды.')
    } catch (err) {
      setAvatarMsg('Аватарды сақтау мүмкін болмады. ' + (err instanceof Error ? err.message : ''))
    }
    setBusy(false)
  }

  async function removeAvatar() {
    setBusy(true)
    const { data: u } = await supabase.auth.getUser()
    const { error: err } = u.user
      ? await supabase.from('profiles').update({ avatar: null }).eq('id', u.user.id)
      : { error: { message: 'Сессия жоқ' } }
    if (err) setAvatarMsg('Аватарды өшіру мүмкін болмады. ' + err.message)
    else {
      setAvatar(null)
      setAvatarMsg('Аватар өшірілді.')
    }
    setBusy(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">
        Жүктелуде...
      </main>
    )
  }

  const done = totalDone(completed)
  const percent = Math.round((done / totalLessonCount) * 100)
  const current: LevelId = currentLevelId(completed)
  const avg =
    attempts.length > 0
      ? Math.round(
          (attempts.reduce((s, a) => s + (a.total > 0 ? a.score / a.total : 0), 0) / attempts.length) * 100,
        )
      : 0
  const perfect = attempts.some((a) => a.total > 0 && a.score === a.total)
  const levelFinished = (id: LevelId) => {
    const l = levelDefs.find((x) => x.id === id)
    return l ? isLevelFinished(l, completed) : false
  }

  const achievements = [
    { icon: '🌟', title: 'Алғашқы қадам', desc: 'Алғашқы сабақты аяқтадыңыз', earned: done >= 1 },
    { icon: '📚', title: 'Бес сабақ', desc: 'Бес сабақты өттіңіз', earned: done >= 5 },
    { icon: '🏅', title: 'A1 деңгейі аяқталды', desc: 'A1 сабақтарының бәрін өттіңіз', earned: levelFinished('A1') },
    { icon: '🎓', title: 'A2 деңгейі аяқталды', desc: 'A2 сабақтарының бәрін өттіңіз', earned: levelFinished('A2') },
    { icon: '🎖️', title: 'B1 деңгейі аяқталды', desc: 'B1 сабақтарының бәрін өттіңіз', earned: levelFinished('B1') },
    { icon: '👑', title: 'B2 деңгейі аяқталды', desc: 'B2 сабақтарының бәрін өттіңіз', earned: levelFinished('B2') },
    { icon: '🏆', title: 'C1 деңгейі аяқталды', desc: 'C1 сабақтарының бәрін өттіңіз', earned: levelFinished('C1') },
    { icon: '💯', title: 'Мінсіз тест', desc: 'Тестті бірде-бір қатесіз тапсырдыңыз', earned: perfect },
    { icon: '⚡', title: '100 XP', desc: '100 ұпай жинадыңыз', earned: points >= 100 },
    { icon: '🔥', title: '3 күн қатарынан', desc: 'Үш күн қатарынан оқыдыңыз', earned: streak >= 3 },
    { icon: '🚀', title: '7 күн қатарынан', desc: 'Жеті күн қатарынан оқыдыңыз', earned: streak >= 7 },
    { icon: '📝', title: 'Деңгей тесті', desc: 'Деңгей анықтау тестін тапсырдыңыз', earned: placement !== null },
    { icon: '🧠', title: 'Грамматика шебері', desc: 'Бес тақырып тестін 80%-дан жоғары тапсырдыңыз (осы құрылғыда)', earned: grammarDone >= 5 },
  ]
  const earnedCount = achievements.filter((a) => a.earned).length

  // Соңғы 7 күндегі белсенділік (әрекет саны)
  const days = Array.from({ length: 7 }, (_, k) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - k))
    const key = localDateString(d)
    return { label: WEEKDAYS[d.getDay()], count: attempts.filter((a) => localDateString(new Date(a.created_at)) === key).length }
  })
  const maxDay = Math.max(1, ...days.map((d) => d.count))

  const stat = (label: string, value: string | number) => (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between gap-3">
          <Link href="/learning-path" className="text-sm text-teal-300 font-bold hover:text-teal-200">
            ← Менің кабинетім
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/10"
            >
              Шығу
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        {/* Тұлға */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-4xl font-bold text-slate-900 shrink-0">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="Аватар" className="w-full h-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-extrabold">{name}</h1>
            <p className="text-sm text-slate-400 mt-1">
              Қазіргі деңгей: <span className="text-teal-300 font-bold">{current}</span>
              {placement && <span> · Деңгей тесті: {placement}</span>}
            </p>
            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 text-xs font-bold"
              >
                {avatar ? 'Аватарды ауыстыру' : 'Аватар қою'}
              </button>
              {avatar && (
                <button
                  onClick={removeAvatar}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-red-300 text-xs font-bold disabled:opacity-50"
                >
                  Өшіру
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
            </div>
            {avatarMsg && <p className="mt-2 text-xs text-slate-300">{avatarMsg}</p>}
          </div>
        </section>

        {/* Статистика */}
        <section>
          <h2 className="text-xl font-bold mb-3">📊 Статистика</h2>
          {error && <p className="text-sm text-red-400 mb-3">Деректерді жүктеу қатесі: {error}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stat('Ұпай', points)}
            {stat('Қатарынан күн', streak)}
            {stat('Өтілген сабақ', `${done} / ${totalLessonCount}`)}
            {stat('Жалпы прогресс', `${percent}%`)}
            {stat('Орташа нәтиже', attempts.length ? `${avg}%` : '—')}
            {stat('Қателер', mistakeCount)}
          </div>

          <div className="mt-5 space-y-3">
            {levelDefs.map((l) => {
              const d = doneInLevel(l, completed)
              return (
                <div key={l.id}>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{l.id}</span>
                    <span>
                      {d} / {l.lessons.length}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-teal-500" style={{ width: `${(d / l.lessons.length) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400 mb-3">Соңғы 7 күндегі әрекеттер</p>
            <div className="flex items-end justify-between gap-2 h-24">
              {days.map((d, k) => (
                <div key={k} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full rounded-t bg-teal-500/80"
                    style={{ height: `${d.count === 0 ? 3 : (d.count / maxDay) * 100}%`, opacity: d.count === 0 ? 0.25 : 1 }}
                    title={`${d.count}`}
                  />
                  <span className="text-[10px] text-slate-500 mt-1">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Жетістіктер */}
        <section>
          <h2 className="text-xl font-bold mb-1">🏆 Жетістіктер</h2>
          <p className="text-sm text-slate-400 mb-3">
            {earnedCount} / {achievements.length} алынды
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((a) => (
              <div
                key={a.title}
                className={`p-4 rounded-2xl flex items-center gap-4 border ${
                  a.earned ? 'bg-slate-900 border-emerald-500/40' : 'bg-slate-900/40 border-slate-800 opacity-50'
                }`}
              >
                <span className="text-3xl">{a.earned ? a.icon : '🔒'}</span>
                <div>
                  <h4 className="font-bold text-sm">{a.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
