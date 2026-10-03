'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  type: 'Vocabulary' | 'Grammar' | 'Listening' | 'Reading';
  completed: boolean;
  locked: boolean;
}

const initialLessons: Lesson[] = [
  // A1 Level
  { id: 'a1-1', title: 'Алфавит және дыбыстар', subtitle: 'Қазақ тілінің төл дыбыстары (Ә, І, Ң, Ғ, Ү, Ұ, Қ, Ө, Һ)', level: 'A1', type: 'Vocabulary', completed: true, locked: false },
  { id: 'a1-2', title: 'Талдау және Сәлемдесу', subtitle: 'Сәлеметсіз бе! Танысқаныма қуаныштымын', level: 'A1', type: 'Vocabulary', completed: true, locked: false },
  { id: 'a1-3', title: 'Жіктеу есімдіктері мен Жіктеу жалғауы', subtitle: 'Мен студентпін, Сен оқушысың, Ол мұғалім', level: 'A1', type: 'Grammar', completed: false, locked: false },
  { id: 'a1-4', title: 'Сандар мен Уақыт', subtitle: '1-ден 100-ге дейінгі сандар, сағат қанша?', level: 'A1', type: 'Vocabulary', completed: false, locked: true },
  { id: 'a1-5', title: 'Отбасы және Достар', subtitle: 'Әке, ана, аға, әпке, іні, қарындас', level: 'A1', type: 'Reading', completed: false, locked: true },
  
  // A2 Level
  { id: 'a2-1', title: 'Көптік жалғаулар', subtitle: '-лар/-лер, -дар/-дер, -тар/-тер ережелері', level: 'A2', type: 'Grammar', completed: false, locked: true },
  { id: 'a2-2', title: 'Септіктер жүйесі (Падежи)', subtitle: 'Атау, ілік, барыс, табыс, жатыс, шығыс, көмектес', level: 'A2', type: 'Grammar', completed: false, locked: true },
  { id: 'a2-3', title: 'Өткен шақ (Жедел өткен шақ)', subtitle: 'Кеше мен кітап оқыдым, кино көрдім', level: 'A2', type: 'Listening', completed: false, locked: true },

  // B1 Level
  { id: 'b1-1', title: 'Сабақтас құрмалас сөйлемдер', subtitle: 'Шартты рай (-са/-се) және себеп-салдар байланысы', level: 'B1', type: 'Grammar', completed: false, locked: true },
  { id: 'b1-2', title: 'Аудирование: Мәдениет және Өнер', subtitle: 'Қазақ халқының салт-дәстүрлері мен өнері', level: 'B1', type: 'Listening', completed: false, locked: true }
];

export default function LearningPathPage() {
  const [lessons] = useState<Lesson[]>(initialLessons);
  const [activeTab, setActiveTab] = useState<'A1' | 'A2' | 'B1' | 'B2'>('A1');

  const activeLessons = lessons.filter((l) => l.level === activeTab);
  const completedCount = lessons.filter((l) => l.completed).length;
  const progressPercent = Math.round((completedCount / lessons.length) * 100);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-4 py-4 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-teal-400 font-bold hover:text-teal-300">
            <span>← Басты бет</span>
          </Link>

          {/* User Progress Stats Header */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xl">🔥</span>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Стрик</div>
                <div className="text-xs font-bold text-amber-400">7 күн қатар</div>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xl">🏆</span>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Ұпай (XP)</div>
                <div className="text-xs font-bold text-teal-400">450 XP</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Learning Track & Level Roadmap */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Level Tabs */}
          <div className="flex bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80">
            {(['A1', 'A2', 'B1', 'B2'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setActiveTab(lvl)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === lvl
                    ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Деңгей {lvl}
              </button>
            ))}
          </div>

          {/* Lessons List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <span>📚</span> {activeTab} деңгейінің сабақтары
            </h2>

            {activeLessons.map((lesson, idx) => (
              <div
                key={lesson.id}
                className={`p-5 rounded-2xl border transition-all duration-200 ${
                  lesson.locked
                    ? 'bg-slate-800/20 border-slate-800 opacity-60'
                    : lesson.completed
                    ? 'bg-slate-800/60 border-emerald-500/40 hover:border-emerald-500'
                    : 'bg-slate-800 border-teal-500/50 shadow-lg shadow-teal-500/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        lesson.completed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : lesson.locked
                          ? 'bg-slate-800 text-slate-500 border border-slate-700'
                          : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      }`}
                    >
                      {lesson.completed ? '✓' : lesson.locked ? '🔒' : idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300 uppercase">
                          {lesson.type}
                        </span>
                        {lesson.completed && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                            Аяқталды
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-100">{lesson.title}</h3>
                      <p className="text-slate-400 text-sm mt-1">{lesson.subtitle}</p>
                    </div>
                  </div>

                  {!lesson.locked ? (
                    <Link
                      href={`/lesson/${lesson.id}`}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-400 text-slate-900 hover:bg-teal-300 transition-colors shadow-md"
                    >
                      {lesson.completed ? 'Қайталау' : 'Бастау →'}
                    </Link>
                  ) : (
                    <span className="text-xs font-medium text-slate-500 py-2">Жабық</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Daily Plan & Overall Progress */}
        <div className="space-y-6">
          
          {/* Daily Goal / Plan Widget */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700 p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
              <span>🎯</span> Бүгінгі оқу жоспары
            </h3>
            <p className="text-xs text-slate-400 mb-4">Өз қарқыныңызды сақтау үшін тапсырмаларды орындаңыз</p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-slate-300">10 жаңа сөз жаттау</span>
                </div>
                <span className="text-xs text-emerald-400 font-semibold">+20 XP</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className="w-4 h-4 rounded-full border border-teal-400 flex items-center justify-center text-[10px] text-teal-400 font-bold">1</span>
                  <span className="text-slate-200">1 Грамматикалық тақырып</span>
                </div>
                <span className="text-xs text-teal-400 font-semibold">+30 XP</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className="w-4 h-4 rounded-full border border-slate-600" />
                  <span className="text-slate-400">5 минут тыңдалым (Listening)</span>
                </div>
                <span className="text-xs text-slate-500 font-semibold">+15 XP</span>
              </div>
            </div>
          </div>

          {/* Overall Course Progress Widget */}
          <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl backdrop-blur-sm">
            <h3 className="text-md font-bold text-slate-200 mb-3">Жалпы прогресс</h3>
            
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Өтілген сабақтар</span>
              <span className="font-bold text-teal-400">{completedCount} / {lessons.length}</span>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden mb-4">
              <div
                className="bg-gradient-to-r from-teal-400 to-emerald-400 h-3 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Тамаша нәтиже! Сіз курстың <strong className="text-teal-300">{progressPercent}%</strong> бөлігін аяқтадыңыз.
            </p>
          </div>

          {/* Achievements Preview */}
          <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl backdrop-blur-sm">
            <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2">
              <span>🏅</span> Жетістіктер (Achievements)
            </h3>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-teal-500/30">
                <div className="text-2xl mb-1">🚀</div>
                <div className="text-[10px] font-bold text-teal-300">Алғашқы қадам</div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-amber-500/30">
                <div className="text-2xl mb-1">🔥</div>
                <div className="text-[10px] font-bold text-amber-300">7 күн тізбек</div>
              </div>
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 opacity-50">
                <div className="text-2xl mb-1">🧠</div>
                <div className="text-[10px] font-bold text-slate-500">Грамматика шебері</div>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}