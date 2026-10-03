import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-teal-500 selection:text-white">
      {/* Header / Navigation */}
      <header className="border-b border-slate-800 backdrop-blur-md bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center font-bold text-slate-900 text-xl shadow-lg shadow-teal-500/20">
              ҚҰ
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              QazaqQadam
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-teal-400 transition-colors">Мүмкіндіктер</a>
            <a href="#levels" className="hover:text-teal-400 transition-colors">Деңгейлер</a>
            <a href="#ai" className="hover:text-teal-400 transition-colors">AI Мүмкіндіктері</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Кіру
            </Link>
            <Link
              href="/assessment"
              className="px-4 py-2 text-sm font-semibold text-slate-900 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02]"
            >
              Бастау
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-6">
            ✨ Жаңа педагогикалық мүмкіндіктер
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Қазақ тілін <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">Заманауи ИИ Тәсілмен</span> Үйреніңіз
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal">
            Интерактивті жаттығулар, жасанды интеллект тексерісі, сөйлеу мен тыңдалым модулі және жеке оқу траекториясы.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/assessment"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-slate-900 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 shadow-xl shadow-teal-500/20 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Деңгейді анықтау (A1 - B2)
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-slate-200 border border-slate-700 hover:bg-slate-800/60 transition-colors"
            >
              Кіру / Тіркелу
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-slate-800/80 pt-10">
            <div>
              <div className="text-3xl font-bold text-teal-400">4+</div>
              <div className="text-xs text-slate-400 mt-1">Оқу деңгейі (A1-B2)</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">1000+</div>
              <div className="text-xs text-slate-400 mt-1">Интерактивті сөздер</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">AI</div>
              <div className="text-xs text-slate-400 mt-1">Ақылды тексеруші</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">Геймификация & Стриктер</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="py-20 bg-slate-950/50 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Оқу Платформасының Мүмкіндіктері</h2>
            <p className="mt-3 text-slate-400">Тіл үйрену процесін тиімді әрі қызықты ететін құралдар</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-teal-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center text-2xl mb-4">
                🎯
              </div>
              <h3 className="text-xl font-bold mb-2">Жеке оқу жоспары</h3>
              <p className="text-slate-400 text-sm">
                Күнделікті 10 жаңа сөз, 1 грамматикалық тақырып, флеш-карточкалар және қайталау тапсырмалары.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl mb-4">
                🤖
              </div>
              <h3 className="text-xl font-bold mb-2">ИИ Тексерісі мен Тыңдалым</h3>
              <p className="text-slate-400 text-sm">
                Қазақ тіліне бейімделген ИИ дауысы арқылы аудирование және жазылым тапсырмаларын лезде тексеру.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-cyan-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-2xl mb-4">
                🏆
              </div>
              <h3 className="text-xl font-bold mb-2">Ачивкалар мен Стриктер</h3>
              <p className="text-slate-400 text-sm">
                Үздіксіз оқу күндерін сақтаңыз, рейтингте жоғарылаңыз және жетістіктерді (Achievements) ашыңыз.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}