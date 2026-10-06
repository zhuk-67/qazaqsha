'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { lessonContent, isChoiceQuestion } from '@/lib/lessons'
import { useTheme } from '@/components/ThemeProvider'

// Сандар нақты деректерден есептеледі: жаңа сабақ қосылса, бұл жерде өздігінен жаңарады
const lessons = Object.values(lessonContent)
const lessonCount = lessons.length
const a1Count = lessons.filter((l) => l.id.startsWith('a1-')).length
const a2Count = lessons.filter((l) => l.id.startsWith('a2-')).length
const questionCount = lessons.reduce((sum, l) => sum + l.questions.length, 0)
const specialLetterCount = lessons.reduce((sum, l) => sum + (l.letters ?? []).length, 0)
const wordPool: { kk: string; ru: string }[] = lessons.flatMap((l) => [
  ...(l.letters ?? []).flatMap((letter) => letter.examples),
  ...(l.sections ?? []).flatMap((s) => s.items.map((item) => ({ kk: item.kk, ru: item.ru }))),
])

const demoCandidate = lessonContent['a1-1']?.questions[1]
const demoQuestion = demoCandidate && isChoiceQuestion(demoCandidate) ? demoCandidate : undefined

export default function HomePage() {
  const [username, setUsername] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [wordOfDay, setWordOfDay] = useState<{ kk: string; ru: string } | null>(null)
  const [demoSelected, setDemoSelected] = useState<number | null>(null)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUsername(user ? (user.email?.split('@')[0] ?? 'Оқушы') : null)
    }
    loadUser()
  }, [])

  // Күннің сөзі: күн сайын тізімнен келесі сөз
  useEffect(() => {
    if (wordPool.length === 0) return
    const now = new Date()
    const dayNumber = Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000)
    setWordOfDay(wordPool[dayNumber % wordPool.length])
  }, [])

  const startHref = username ? '/learning-path' : '/login'
  const reviewHref = username ? '/review' : '/login'
  const checkHref = username ? '/check' : '/login'

  const comingSoon = [
    { icon: '🔊', title: 'Қазақша дыбыстау', desc: 'Сөздер мен сөйлемдердің нақты айтылуы.' },
    { icon: '💬', title: 'ЖИ-тьютор чаты', desc: 'Қазақ тілі туралы сұрақ қойып, жауап алу.' },
    { icon: '🏆', title: 'B1 деңгейі', desc: 'Күрделі сөйлемдер, пікір білдіру, мәтін оқу.' },
    { icon: '👤', title: 'Профиль баптаулары', desc: 'Атты, құпия сөзді өзгерту және прогресті тазалау.' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans transition-colors duration-200">

      {/* Жоғарғы мәзір */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-800 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center font-bold text-slate-900">
              ҚҰ
            </div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              QazaqQadam
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#features" className="hover:text-teal-300 transition-colors">Мүмкіндіктер</a>
            <a href="#ai" className="hover:text-teal-300 transition-colors">ЖИ көмекші</a>
            <a href="#how" className="hover:text-teal-300 transition-colors">Қалай жұмыс істейді</a>
            <a href="#levels" className="hover:text-teal-300 transition-colors">Деңгейлер</a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Кнопка переключения темы */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-lg transition-all"
              title={theme === 'light' ? 'Түнгі режим' : 'Күндізгі режим'}
              aria-label="Тақырыпты ауыстыру"
            >
              {theme === 'light' ? '🌙' : '☀️️'}
            </button>

            {username ? (
              <Link
                href="/learning-path"
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm transition-all"
              >
                <span className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-400 text-teal-300 flex items-center justify-center text-xs font-bold">
                  {username[0]?.toUpperCase()}
                </span>
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
            <a href="#features" onClick={() => setMenuOpen(false)}>Мүмкіндіктер</a>
            <a href="#ai" onClick={() => setMenuOpen(false)}>ЖИ көмекші</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>Қалай жұмыс істейді</a>
            <a href="#levels" onClick={() => setMenuOpen(false)}>Деңгейлер</a>
          </nav>
        )}
      </header>

      {/* Басты блок */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block px-3 py-1 mb-5 bg-teal-500/10 text-teal-300 text-xs font-bold rounded-full border border-teal-500/30">
            Қазақ тілін үйренуге арналған платформа
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5">
            Өзге тілдің бәрін біл — <span className="bg-gradient-to-r from-teal-300 to-emerald-400 bg-clip-text text-transparent">өз тіліңді құрметте</span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            Алфавиттен бастап күнделікті сөйлесуге дейін: қысқа сабақтар, тесттер және нақты прогресс. Деңгейіңді анықта да, бүгіннен оқуды баста.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={startHref}
              className="px-7 py-3.5 text-center bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl hover:scale-105 transition-all shadow-lg shadow-teal-500/20"
            >
              Оқуды бастау ➔
            </Link>
            <Link
              href="/assessment"
              className="px-7 py-3.5 text-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-bold rounded-xl transition-all"
            >
              Деңгейді анықтау
            </Link>
          </div>
        </div>

        {/* Сабақ карточкасының көрінісі */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-teal-500/5">
          <p className="text-xs text-slate-400 mb-1">1-сабақ</p>
          <p className="font-bold text-lg mb-5">Алфавит және дыбыстар</p>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {['Ә', 'Ғ', 'Қ', 'Ң'].map((l) => (
              <div
                key={l}
                className="aspect-square rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-3xl font-bold text-teal-300"
              >
                {l}
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm">
            <p className="bg-slate-800/60 rounded-xl px-4 py-2.5"><span className="font-bold">әке</span> <span className="text-slate-400">— отец</span></p>
            <p className="bg-slate-800/60 rounded-xl px-4 py-2.5"><span className="font-bold">қала</span> <span className="text-slate-400">— город</span></p>
            <p className="bg-slate-800/60 rounded-xl px-4 py-2.5"><span className="font-bold">таң</span> <span className="text-slate-400">— утро, рассвет</span></p>
          </div>
        </div>
      </section>

      {/* Сандар */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: lessonCount, label: 'дайын сабақ' },
            { value: questionCount, label: 'жаттығу сұрағы' },
            { value: specialLetterCount, label: 'ерекше әріп' },
            { value: wordPool.length, label: 'сөз бен сөз тіркесі' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
              <p className="text-3xl font-extrabold text-teal-300">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Мүмкіндіктер */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-extrabold mb-2">Қазір не бар</h2>
        <p className="text-slate-400 mb-8">Мыналар сайтта қазірдің өзінде жұмыс істейді.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <Link href={startHref} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">🔤</p>
            <h3 className="font-bold mb-2">Алфавит және дыбыстар</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Ерекше әріптер, олардың айтылуы және мысалдар.</p>
          </Link>
          <Link href={startHref} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">👋</p>
            <h3 className="font-bold mb-2">Сәлемдесу мен танысу</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Сәлемдесудің және өзін таныстырудың негізгі сөйлемдері.</p>
          </Link>
          <Link href={startHref} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">🔢</p>
            <h3 className="font-bold mb-2">Сандар мен уақыт</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Сандар, сағат және апта күндері.</p>
          </Link>
          <Link href={startHref} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">👥</p>
            <h3 className="font-bold mb-2">Жіктеу есімдіктері</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Мен, сен, сіз, ол және олардың жалғаулары.</p>
          </Link>
          <Link href={startHref} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">🏠</p>
            <h3 className="font-bold mb-2">Отбасы және мүшелері</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Отбасы мүшелерінің аттары және «менің әкем» түріндегі тіркестер.</p>
          </Link>
          <Link href="/assessment" className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">🎯</p>
            <h3 className="font-bold mb-2">Деңгейді анықтау</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Қысқа диагностикалық тест.</p>
          </Link>
          <Link href={startHref} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">🔥</p>
            <h3 className="font-bold mb-2">Прогресс пен стрик</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Өтілген сабақтар, ұпай және күн сайынғы оқу тізбегі сақталады.</p>
          </Link>
          <Link href={reviewHref} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">🔁</p>
            <h3 className="font-bold mb-2">Қателер мен қайталау</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Қателескен сұрақтар сақталады, оларды қайталап жаттығуға болады.</p>
          </Link>
          <Link href={startHref} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">✏️</p>
            <h3 className="font-bold mb-2">Әртүрлі жаттығулар</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Жауап таңдау, сөзді өзің жазу және жұптарды сәйкестендіру.</p>
          </Link>
          <Link href={startHref} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">📚</p>
            <h3 className="font-bold mb-2">Сөздік</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Сабақтардағы барлық сөздер: іздеу және карточкалармен қайталау.</p>
          </Link>
          <Link href={startHref} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">📖</p>
            <h3 className="font-bold mb-2">Грамматика</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Жалғаулар, көптік жалғау, тәуелдік және сағатты айту ережелері.</p>
          </Link>
          <Link href={startHref} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">🎓</p>
            <h3 className="font-bold mb-2">А2 деңгейі</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Тамақ, қала, күнделікті өмір, өткен шақ және сипаттау.</p>
          </Link>
          <Link href={startHref} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">📊</p>
            <h3 className="font-bold mb-2">Статистика және жетістіктер</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Тест нәтижелері, дұрыс жауап пайызы, күндер бойынша белсенділік.</p>
          </Link>
          <Link href={checkHref} className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 transition-all">
            <p className="text-3xl mb-3">🤖</p>
            <h3 className="font-bold mb-2">ЖИ көмекші</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Қателерді түсіндіреді және өзің жазған қазақша мәтінді тексереді.</p>
          </Link>
        </div>

        <h3 className="text-lg font-bold mb-4 text-slate-300">Жақында қосылады</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {comingSoon.map((c) => (
            <div key={c.title} className="bg-slate-900/50 border border-dashed border-slate-700 rounded-2xl p-5 opacity-80">
              <p className="text-2xl mb-2">{c.icon}</p>
              <h4 className="font-bold text-sm mb-1">{c.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Қалай жұмыс істейді */}
      <section id="how" className="bg-slate-900/50 border-y border-slate-800 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold mb-10">Қалай жұмыс істейді</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: '01', t: 'Тіркел', d: 'Логин мен құпия сөз ойлап тап, аккаунт аш.' },
              { n: '02', t: 'Деңгейіңді анықта', d: 'Қысқа тест қай жерден бастауды көрсетеді.' },
              { n: '03', t: 'Сабақты оқы', d: 'Әр сабақта жаңа әріптер, сөздер немесе сөйлемдер бар.' },
              { n: '04', t: 'Тестті тапсыр', d: 'Сабақты өтіп, ұпай жинап, қателеріңді қайталап, ЖИ-ден көмек ал.' },
            ].map((s) => (
              <div key={s.n} className="relative">
                <p className="text-5xl font-extrabold text-teal-500/30 mb-2">{s.n}</p>
                <h3 className="font-bold text-lg mb-1">{s.t}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Деңгейлер */}
      <section id="levels" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-extrabold mb-2">Өз деңгейіңнен баста</h2>
        <p className="text-slate-400 mb-8">Қазір А1 және А2 деңгейлері ашық, қалғандары кейін қосылады.</p>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold">A1 — Бастауыш</h3>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30">Ашық</span>
            </div>
            <ul className="text-sm text-slate-400 space-y-1.5 mb-4">
              <li>Алфавит және дыбыстар</li>
              <li>Сәлемдесу мен танысу</li>
              <li>Сандар мен уақыт</li>
              <li>Жіктеу есімдіктері</li>
              <li>Отбасы және оның мүшелері</li>
            </ul>
            <p className="text-xs text-slate-500">Дайын сабақ: {a1Count}</p>
          </div>
          <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold">A2 — Негізгі</h3>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30">Ашық</span>
            </div>
            <ul className="text-sm text-slate-400 space-y-1.5 mb-4">
              <li>Тамақ және сусындар</li>
              <li>Қала және бағыт</li>
              <li>Күнделікті өмір</li>
              <li>Өткен шақ</li>
              <li>Сын есім және түстер</li>
            </ul>
            <p className="text-xs text-slate-500">Дайын сабақ: {a2Count}. Бұл деңгей А1 аяқталғаннан кейін ашылады.</p>
          </div>
          <div className="bg-slate-900/50 border border-dashed border-slate-700 rounded-2xl p-6 opacity-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold">B1 — Орта</h3>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-400 text-xs font-bold rounded-lg border border-slate-700">Жақында</span>
            </div>
            <p className="text-sm text-slate-500">Күрделі сөйлемдер, пікір білдіру, мәтін оқу.</p>
          </div>
        </div>
        <div className="mt-8">
          <Link
            href="/assessment"
            className="inline-block px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-bold rounded-xl transition-all"
          >
            Деңгейімді анықтау
          </Link>
        </div>
      </section>

      {/* Күннің сөзі және мини-тест */}
      <section className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <p className="text-xs font-bold text-teal-300 mb-4">🌱 Күннің сөзі</p>
          {wordOfDay ? (
            <div>
              <p className="text-4xl font-extrabold mb-2">{wordOfDay.kk}</p>
              <p className="text-slate-400">{wordOfDay.ru}</p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Жүктелуде...</p>
          )}
          <p className="text-xs text-slate-500 mt-6">Сөз сабақтардағы материалдан алынады және күн сайын өзгереді.</p>
        </div>

        {demoQuestion && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <p className="text-xs font-bold text-teal-300 mb-4">✏️ Өзіңді тексеріп көр</p>
            <p className="font-bold mb-4">{demoQuestion.prompt}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
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
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${style}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            {demoSelected !== null && (
              <div className="text-sm">
                <p className={demoSelected === demoQuestion.answer ? 'text-emerald-300 font-bold' : 'text-red-300 font-bold'}>
                  {demoSelected === demoQuestion.answer ? 'Дұрыс! ✓' : 'Қате ✗'}
                </p>
                <p className="text-slate-400 mt-1">{demoQuestion.explain}</p>
                <button
                  onClick={() => setDemoSelected(null)}
                  className="mt-3 text-xs text-teal-300 font-bold hover:text-teal-200"
                >
                  Қайта көру
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ЖИ көмекші */}
      <section id="ai" className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 border border-slate-800 rounded-3xl p-8 md:p-12">
          <span className="inline-block px-2.5 py-1 mb-4 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30">Жұмыс істейді</span>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">🤖 ЖИ көмекші</h2>
          <p className="text-slate-400 max-w-2xl leading-relaxed mb-6">
            Жасанды интеллект оқуда көмектеседі. Ол қатені түсіндіреді, ал сен жазған қазақша мәтінді тексеріп, дұрыс нұсқасын көрсетеді.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6 max-w-3xl">
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <p className="font-bold mb-1">Қатені түсіндіру</p>
              <p className="text-xs text-slate-400 leading-relaxed">Жаттығуда қателессең, «ЖИ түсіндірсін» батырмасын бас: неге жауап дұрыс емес екенін айтады.</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <p className="font-bold mb-1">Мәтінді тексеру</p>
              <p className="text-xs text-slate-400 leading-relaxed">Қазақша сөйлем жазасың, ЖИ қателерді түзетіп, ережені қарапайым тілмен түсіндіреді.</p>
            </div>
          </div>
          <Link
            href={checkHref}
            className="inline-block px-6 py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl hover:scale-105 transition-all"
          >
            Мәтінді тексеру ➔
          </Link>
          <p className="text-xs text-slate-500 mt-4">ЖИ қателесуі мүмкін, сондықтан күмәнді жерлерді сөздіктен тексеріп отыр.</p>
        </div>
      </section>

      {/* Кімдерге арналған */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-extrabold mb-8">Платформа кімдерге арналған</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: '👩‍🎓', t: 'Студенттерге', d: 'Қазақ тілін оқуға және күнделікті қарым-қатынасқа.' },
            { icon: '🌍', t: 'Шетелдіктерге', d: 'Қазақстанда өмір сүріп, жергілікті мәдениетті түсінгісі келетіндерге.' },
            { icon: '📚', t: 'Тілді қайта үйренгісі келетіндерге', d: 'Білімін жаңартып, сөздерін қайталағысы келетіндерге.' },
          ].map((a) => (
            <div key={a.t} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-3xl mb-3">{a.icon}</p>
              <h3 className="font-bold mb-2">{a.t}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{a.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Соңғы шақыру */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl p-10 md:p-14 text-slate-900 relative overflow-hidden">
          <p className="absolute -right-4 -bottom-10 text-[10rem] font-extrabold text-slate-900/10 leading-none select-none">Ә</p>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 relative">Қазақ тілін бүгіннен бастап үйрен</h2>
          <p className="mb-6 max-w-xl relative font-medium">Бір сабақтан баста. Ол көп уақыт алмайды, ал прогресс сақталып тұрады.</p>
          <Link
            href={startHref}
            className="relative inline-block px-7 py-3.5 bg-slate-900 text-teal-300 font-bold rounded-xl hover:scale-105 transition-all"
          >
            Оқуды бастау ➔
          </Link>
        </div>
      </section>

      {/* Төменгі бөлік */}
      <footer className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center font-bold text-slate-900 text-sm">
                ҚҰ
              </div>
              <span className="font-extrabold">QazaqQadam</span>
            </div>
            <p className="text-slate-500 leading-relaxed">Қазақ тілін үйренуге арналған интерактивті платформа.</p>
          </div>
          <div>
            <p className="font-bold mb-3">Оқу</p>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/learning-path" className="hover:text-teal-300">Оқу траекториясы</Link></li>
              <li><Link href="/assessment" className="hover:text-teal-300">Деңгейді анықтау</Link></li>
              <li><Link href={checkHref} className="hover:text-teal-300">Мәтінді тексеру</Link></li>
              <li><Link href="/login" className="hover:text-teal-300">Кіру және тіркелу</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-bold mb-3">Бөлімдер</p>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#features" className="hover:text-teal-300">Мүмкіндіктер</a></li>
              <li><a href="#ai" className="hover:text-teal-300">ЖИ көмекші</a></li>
              <li><a href="#how" className="hover:text-teal-300">Қалай жұмыс істейді</a></li>
              <li><a href="#levels" className="hover:text-teal-300">Деңгейлер</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-600">
          © 2026 QazaqQadam. Қазақ тілін үйренуге арналған білім беру платформасы.
        </div>
      </footer>
    </div>
  )
}