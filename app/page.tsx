'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { lessonContent, isChoiceQuestion } from '@/lib/lessons'
import { levelDefs, doneInLevel, currentLevelId, totalDone, totalLessonCount } from '@/lib/levels'
import ThemeToggle from '@/components/ThemeToggle'
import LeaderboardPanel from '@/components/LeaderboardPanel'
import Avatar from '@/components/Avatar'

const lessons = Object.values(lessonContent)
const wordPool: { kk: string; ru: string }[] = lessons.flatMap((l) => [
  ...(l.letters ?? []).flatMap((letter) => letter.examples),
  ...(l.sections ?? []).flatMap((s) => s.items.map((item) => ({ kk: item.kk, ru: item.ru }))),
])

const demoCandidate = lessonContent['a1-1']?.questions[1]
const demoQuestion = demoCandidate && isChoiceQuestion(demoCandidate) ? demoCandidate : undefined

export default function HomePage() {
  const [username, setUsername] = useState<string | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [completed, setCompleted] = useState<string[]>([])
  const [streak, setStreak] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [wordOfDay, setWordOfDay] = useState<{ kk: string; ru: string } | null>(null)
  const [sideTab, setSideTab] = useState<'word' | 'quiz'>('word')
  const [demoSelected, setDemoSelected] = useState<number | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUsername(null)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('username, streak, completed_lessons, avatar')
        .eq('id', user.id)
        .maybeSingle()
      setUsername(data?.username || user.email?.split('@')[0] || 'Оқушы')
      setCompleted((data?.completed_lessons as string[] | null) ?? [])
      setStreak(data?.streak ?? 0)
      setAvatar((data?.avatar as string | null) ?? null)
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (wordPool.length === 0) return
    const now = new Date()
    const dayNumber = Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000)
    setWordOfDay(wordPool[dayNumber % wordPool.length])
  }, [])

  const logged = username !== null
  const go = (href: string) => (logged ? href : '/login')
  const percent = Math.round((totalDone(completed) / totalLessonCount) * 100)

  const sections = [
    { icon: '📚', title: 'Сабақтар', desc: `${totalLessonCount} сабақ: A1-ден C1-ге дейін`, href: go('/learning-path') },
    { icon: '🎧', title: 'Тыңдап жаз', desc: 'Сөзді тыңдап, дұрыс жаз', href: go('/listen') },
    { icon: '✍️', title: 'Жазу', desc: 'ЖИ мәтініңді тексереді', href: go('/check') },
    { icon: '🧠', title: 'Грамматика', desc: 'Ережелер мен мысалдар', href: go('/learning-path?tab=grammar') },
    { icon: '📰', title: 'Қазақша мәтіндер', desc: 'Оқу, сөзді басып аудару, сұрақтар', href: go('/texts') },
    { icon: '📖', title: 'Сөздік', desc: 'Сөздер, іздеу, карточкалар', href: go('/learning-path?tab=vocab') },
    { icon: '🔁', title: 'Қате дәптері', desc: 'Қателерді қайталау', href: go('/review') },
    { icon: '🧩', title: 'Қайталау', desc: 'Сөздерді аралықпен қайталау', href: go('/repeat') },
    { icon: '🎯', title: 'Әлсіз тұстарым', desc: 'Қателер талдауы мен кеңес', href: go('/weak') },
    { icon: '📅', title: 'Күннің тапсырмасы', desc: 'Күн сайын жаңа мини-жиынтық', href: go('/daily') },
    { icon: '⏱️', title: '5 минуттық жаттығу', desc: 'Жылдам практика', href: go('/quick') },
    { icon: '🏋️', title: 'Жаттығулар', desc: 'Грамматика бойынша қайталау', href: go('/practice') },
    { icon: '📝', title: 'Деңгей тесті', desc: 'Деңгейіңді анықта', href: '/assessment' },
    { icon: '📊', title: 'Статистика', desc: 'Нәтижелер мен белсенділік', href: go('/stats') },
  ]

  const cardClass =
    'bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-4 transition-all text-left block'

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Шапка */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center font-bold text-slate-900 text-lg">
                Q
              </div>
              <span className="font-extrabold text-lg tracking-wide">QAZIR</span>
            </Link>
            <ThemeToggle />
          </div>

          <nav className="hidden md:flex items-center gap-5 text-sm text-slate-300">
            <Link href={go('/learning-path')} className="hover:text-teal-300 transition-colors">Сабақтар</Link>
            <Link href={go('/listen')} className="hover:text-teal-300 transition-colors">Тыңдап жаз</Link>
            <Link href={go('/learning-path?tab=grammar')} className="hover:text-teal-300 transition-colors">Грамматика</Link>
            <Link href="/assessment" className="hover:text-teal-300 transition-colors">Деңгей тесті</Link>
            <button type="button" onClick={() => setRatingOpen(true)} className="hover:text-teal-300 transition-colors">
              Рейтинг
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {logged ? (
              <Link
                href="/learning-path"
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm transition-all"
              >
                <Avatar name={username ?? ''} src={avatar} className="w-7 h-7 text-xs" />
                <span className="hidden sm:inline font-medium">Менің кабинетім</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl text-sm hover:scale-105 transition-all"
              >
                Кіру
              </Link>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-lg"
              aria-label="Мәзір"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden border-t border-slate-800 px-6 py-4 flex flex-col gap-4 text-sm text-slate-300">
            <Link href={go('/learning-path')} onClick={() => setMenuOpen(false)}>Сабақтар</Link>
            <Link href={go('/listen')} onClick={() => setMenuOpen(false)}>Тыңдап жаз</Link>
            <Link href={go('/learning-path?tab=grammar')} onClick={() => setMenuOpen(false)}>Грамматика</Link>
            <Link href="/assessment" onClick={() => setMenuOpen(false)}>Деңгей тесті</Link>
            <button
              type="button"
              className="text-left"
              onClick={() => {
                setMenuOpen(false)
                setRatingOpen(true)
              }}
            >
              Рейтинг
            </button>
          </nav>
        )}
      </header>

      {/* Басты блок */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <span className="inline-block px-3 py-1 mb-4 bg-teal-500/10 text-teal-300 text-xs font-bold rounded-full border border-teal-500/30">
            Қазақ тілін үйренуге арналған интерактивті платформа
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
            Қазақ тілін үйренудің ең жақсы уақыты —{' '}
            <span className="bg-gradient-to-r from-teal-300 to-emerald-400 bg-clip-text text-transparent">QAZIR.</span>
          </h1>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Әліпбиден бастап күрделі мәтіндерге дейін: сабақтар, тыңдап жазу, ЖИ көмекші және нақты прогресс.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={go('/learning-path')}
              className="px-6 py-3 text-center bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl hover:scale-105 transition-all shadow-lg shadow-teal-500/20"
            >
              Оқуды бастау ➔
            </Link>
            <Link
              href="/assessment"
              className="px-6 py-3 text-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-bold rounded-xl transition-all"
            >
              Деңгейді анықтау
            </Link>
          </div>
        </div>

        {logged ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <p className="text-xs text-slate-400 mb-1">Сәлем, {username}!</p>
            <p className="font-bold text-lg mb-4">Сіздің прогресіңіз</p>
            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="bg-slate-800/60 rounded-xl py-3">
                <p className="text-xl font-extrabold text-teal-300">{currentLevelId(completed)}</p>
                <p className="text-xs text-slate-400">деңгей</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl py-3">
                <p className="text-xl font-extrabold text-orange-400">{streak}</p>
                <p className="text-xs text-slate-400">күн стрик</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl py-3">
                <p className="text-xl font-extrabold text-emerald-300">{percent}%</p>
                <p className="text-xs text-slate-400">прогресс</p>
              </div>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400" style={{ width: `${percent}%` }} />
            </div>
            <Link
              href="/learning-path"
              className="block text-center py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-sm font-bold rounded-xl"
            >
              Жалғастыру
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <p className="text-xs text-slate-400 mb-1">1-сабақ</p>
            <p className="font-bold text-lg mb-4">Алфавит және дыбыстар</p>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {['Ә', 'Ғ', 'Қ', 'Ң'].map((l) => (
                <div
                  key={l}
                  className="aspect-square rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-3xl font-bold text-teal-300"
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400">Тіркеліп, нөлден бастаңыз: прогресс 0%-дан басталады.</p>
          </div>
        )}
      </section>

      {/* Негізгі бөлімдер */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <h2 className="text-xl font-extrabold mb-4">Негізгі бөлімдер</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sections.map((s) => (
            <Link key={s.title} href={s.href} className={cardClass}>
              <p className="text-2xl mb-2">{s.icon}</p>
              <h3 className="font-bold text-sm mb-1">{s.title}</h3>
              <p className="text-xs text-slate-400 leading-snug">{s.desc}</p>
            </Link>
          ))}
          <button type="button" onClick={() => setRatingOpen(true)} className={cardClass}>
            <p className="text-2xl mb-2">🏆</p>
            <h3 className="font-bold text-sm mb-1">Рейтинг</h3>
            <p className="text-xs text-slate-400 leading-snug">Орның мен үздік оқушылар</p>
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">Жақында: 🗣 Сөйлеу жаттығуы, 🎮 ойын жаттығулары.</p>
      </section>

      {/* Деңгейлер және күннің сөзі */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <h2 className="text-xl font-extrabold mb-4">Деңгейлер</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {levelDefs.map((level) => {
              const done = doneInLevel(level, completed)
              const p = Math.round((done / level.lessons.length) * 100)
              return (
                <Link
                  key={level.id}
                  href={go(`/learning-path?level=${level.id}`)}
                  className="bg-slate-800/60 border border-slate-700 hover:border-teal-500/50 rounded-2xl p-4 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">{level.id}</span>
                    <span className="text-xs text-teal-300 font-bold">{logged ? `${p}%` : `${level.lessons.length} сабақ`}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2 leading-snug">{level.subtitle}</p>
                  {logged && (
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400" style={{ width: `${p}%` }} />
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setSideTab('word')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                sideTab === 'word' ? 'bg-teal-500/10 text-teal-300 border-teal-500/30' : 'border-slate-700 text-slate-400'
              }`}
            >
              Күннің сөзі
            </button>
            {demoQuestion && (
              <button
                type="button"
                onClick={() => setSideTab('quiz')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  sideTab === 'quiz' ? 'bg-teal-500/10 text-teal-300 border-teal-500/30' : 'border-slate-700 text-slate-400'
                }`}
              >
                Мини-сұрақ
              </button>
            )}
          </div>

          {sideTab === 'word' &&
            (wordOfDay ? (
              <div className="text-center py-4">
                <p className="text-3xl font-extrabold mb-2">{wordOfDay.kk}</p>
                <p className="text-slate-400">{wordOfDay.ru}</p>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Жүктелуде...</p>
            ))}

          {sideTab === 'quiz' && demoQuestion && (
            <div>
              <p className="font-bold text-sm mb-3">{demoQuestion.prompt}</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {demoQuestion.options.map((opt, i) => {
                  let style = 'bg-slate-800 border-slate-700 hover:border-teal-400'
                  if (demoSelected !== null) {
                    if (i === demoQuestion.answer) style = 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                    else if (i === demoSelected) style = 'bg-red-500/20 border-red-400 text-red-200'
                    else style = 'bg-slate-800 border-slate-800 opacity-50'
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => demoSelected === null && setDemoSelected(i)}
                      disabled={demoSelected !== null}
                      className={`px-2 py-2 rounded-xl border text-xs font-medium transition-all ${style}`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
              {demoSelected !== null && (
                <div className="text-xs">
                  <p className={demoSelected === demoQuestion.answer ? 'text-emerald-300 font-bold' : 'text-red-300 font-bold'}>
                    {demoSelected === demoQuestion.answer ? 'Дұрыс! ✓' : 'Қате ✗'}
                  </p>
                  <p className="text-slate-400 mt-1">{demoQuestion.explain}</p>
                  <button onClick={() => setDemoSelected(null)} className="mt-2 text-teal-300 font-bold">
                    Қайта көру
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p>QAZIR — қазақ тілін үйренуге арналған интерактивті платформа.</p>
          <p>Автор: Інжу Әмірбек · © 2026 QAZIR</p>
        </div>
      </footer>

      {ratingOpen && <LeaderboardPanel onClose={() => setRatingOpen(false)} />}
    </div>
  )
}
