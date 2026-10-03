'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Profile {
  username: string
  level: string
  streak: number
  points: number
  completed_lessons: string[]
}

export default function LearningPathPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'path' | 'vocab' | 'grammar' | 'achievements'>('path')
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Загружаем профиль
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
      } else {
        setProfile({
          username: user.email?.split('@')[0] || 'Оқушы',
          level: 'A1',
          streak: 1,
          points: 50,
          completed_lessons: ['a1-1']
        })
      }
      setLoading(false)
    }

    loadUserData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-teal-400 font-medium animate-pulse">Жүктелуде...</p>
      </div>
    )
  }

  // Траектория уроков A1
  const a1Lessons = [
    { id: 'a1-1', title: '1. Алфавит және дыбыстар', desc: 'Ерекше дыбыстар: Ә, Ғ, Қ, Ң, Ө, Ү, Ұ, І, Һ', icon: '🔤', type: 'reading' },
    { id: 'a1-2', title: '2. Сәлемдесу мен танысу', desc: 'Сәлеметсіз бе! Есіміңіз кім?', icon: '👋', type: 'interactive' },
    { id: 'a1-3', title: '3. Сандар мен уақыт', desc: '1-ден 100-ге дейін санау', icon: '🔢', type: 'quiz' },
    { id: 'a1-4', title: '4. Жіктеу есімдіктері', desc: 'Мен, сен, ол, біз, сіздер...', icon: '👥', type: 'grammar' },
    { id: 'a1-5', title: '5. Отбасы және мүшелері', desc: 'Әке, ана, аға, әпке, қарындас', icon: '🏠', type: 'vocab' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col md:flex-row">
      
      {/* Sidebar / Навигация */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center font-bold text-slate-900 text-xl">
              ҚҰ
            </div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              QazaqQadam
            </span>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('path')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                activeTab === 'path' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              🗺️ Оқу траекториясы
            </button>
            <button
              onClick={() => setActiveTab('vocab')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                activeTab === 'vocab' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📚 Сөздік & Флеш-карта
            </button>
            <button
              onClick={() => setActiveTab('grammar')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                activeTab === 'grammar' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              ✍️ Грамматика
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                activeTab === 'achievements' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              🏆 Жетістіктер
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-400 text-teal-300 flex items-center justify-center font-bold">
              {profile?.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">{profile?.username}</p>
              <p className="text-xs text-slate-400">Деңгей: {profile?.level}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition-all"
          >
            Шығу
          </button>
        </div>
      </aside>

      {/* Основная часть контента */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* Верхняя панель статистики (Стрик, Уровень, Баллы) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="text-2xl font-bold text-orange-400">{profile?.streak} күн</p>
              <p className="text-xs text-slate-400">Үздіксіз стрик</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-3xl">🎯</span>
            <div>
              <p className="text-2xl font-bold text-teal-400">{profile?.level}</p>
              <p className="text-xs text-slate-400">Қазіргі деңгей</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-3xl">⚡</span>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{profile?.points} XP</p>
              <p className="text-xs text-slate-400">Жинаған ұпай</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{profile?.completed_lessons.length} / 25</p>
              <p className="text-xs text-slate-400">Өтілген сабақ</p>
            </div>
          </div>
        </div>

        {/* Блок "Күндізгі жоспар" (Daily Goal) */}
        <div className="bg-gradient-to-r from-teal-900/40 to-slate-900 border border-teal-500/30 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-teal-300 mb-2">📅 Бүгінгі оқу жоспары</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-sm">📖 10 жаңа сөз жаттау</span>
              <span className="text-xs text-teal-400 font-bold">Орындалды</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-sm">✍️️ 1 грамматикалық тақырып</span>
              <span className="text-xs text-amber-400 font-bold">Орындалуда</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-sm">🎧 5 минут тыңдалым</span>
              <span className="text-xs text-slate-500 font-bold">Күтуде</span>
            </div>
          </div>
        </div>

        {/* ВКЛАДКА 1: Оқу траекториясы (Learning Path) */}
        {activeTab === 'path' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>А1 Деңгейі: Бастауыш</span>
            </h2>

            <div className="space-y-4 max-w-3xl">
              {a1Lessons.map((lesson, idx) => {
                const isCompleted = profile?.completed_lessons.includes(lesson.id)
                const isUnlocked = idx === 0 || profile?.completed_lessons.includes(a1Lessons[idx - 1].id)

                return (
                  <div
                    key={lesson.id}
                    className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
                      isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : isUnlocked
                        ? 'bg-slate-900 border-teal-500/50 hover:border-teal-400'
                        : 'bg-slate-900/40 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl bg-slate-800 p-3 rounded-xl border border-slate-700">
                        {lesson.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{lesson.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">{lesson.desc}</p>
                      </div>
                    </div>

                    <div>
                      {isCompleted ? (
                        <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold">
                          ✓ Өтілді
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => alert(`Сабақты бастау: ${lesson.title}`)}
                          className="px-5 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold rounded-xl text-sm hover:scale-105 transition-all"
                        >
                          Бастау
                        </button>
                      ) : (
                        <span className="px-4 py-2 bg-slate-800 text-slate-500 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1">
                          🔒 Құлыпталған
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ВКЛАДКА 2: Vocabulary */}
        {activeTab === 'vocab' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">📚 Тақырыптық сөздіктер</h2>
            <p className="text-slate-400 text-sm mb-6">Флеш-карталар арқылы сөздік қорды кеңейтіңіз</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {['Университет', 'Отбасы мен Достар', 'Тамақ пен Ресторан', 'Саяхат', 'Уақыт мен Ауа райы'].map((topic, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-teal-500/40 transition-all">
                  <div className="text-3xl mb-3">🏷️</div>
                  <h3 className="font-bold text-lg mb-2">{topic}</h3>
                  <p className="text-xs text-slate-400 mb-4">20 интерактивті сөз + дыбыс</p>
                  <button className="w-full py-2.5 bg-slate-800 hover:bg-teal-500/20 hover:text-teal-300 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all">
                    Карточкаларды ашу ➔
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ВКЛАДКА 3: Grammar */}
        {activeTab === 'grammar' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">✍️ Грамматикалық ережелер</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <span className="px-3 py-1 bg-teal-500/10 text-teal-400 text-xs font-bold rounded-lg border border-teal-500/20">A1 Деңгей</span>
                <h3 className="font-bold text-lg mt-3 mb-2">Жіктеу есімдіктері & Тәуелділік жалғау</h3>
                <p className="text-xs text-slate-400 mb-4">Менің кітабым, сенің қаламың, оның досы...</p>
                <button className="px-4 py-2 bg-teal-400 text-slate-900 font-bold text-xs rounded-xl">Ережені оқу</button>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-lg border border-amber-500/20">A2 Деңгей</span>
                <h3 className="font-bold text-lg mt-3 mb-2">Септіктер жүйесі (7 септік)</h3>
                <p className="text-xs text-slate-400 mb-4">Атау, iliк, Барыс, Табыс, Жатыс, Шығыс, Көмектес</p>
                <button className="px-4 py-2 bg-slate-800 text-slate-400 font-bold text-xs rounded-xl">🔒 Ашу үшін А1 аяқтаңыз</button>
              </div>
            </div>
          </div>
        )}

        {/* ВКЛАДКА 4: Achievements */}
        {activeTab === 'achievements' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">🏆 Сіздің жетістіктеріңіз</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-emerald-500/40 p-6 rounded-2xl flex items-center gap-4">
                <span className="text-4xl">🌟</span>
                <div>
                  <h4 className="font-bold">Алғашқы қадам</h4>
                  <p className="text-xs text-slate-400 mt-1">Алғашқы сабақты аяқтадыңыз</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4 opacity-50">
                <span className="text-4xl">🔥</span>
                <div>
                  <h4 className="font-bold">7 Күндік Стрик</h4>
                  <p className="text-xs text-slate-400 mt-1">Қатарнан 7 күн оқу</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4 opacity-50">
                <span className="text-4xl">📚</span>
                <div>
                  <h4 className="font-bold">Сөздік шебері</h4>
                  <p className="text-xs text-slate-400 mt-1">100 жаңа сөз жаттау</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}