'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Question {
  id: number;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  category: 'Grammar' | 'Vocabulary' | 'Listening/Context';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const assessmentQuestions: Question[] = [
  // A1 Level
  {
    id: 1,
    level: 'A1',
    category: 'Grammar',
    question: '«Сәлеметсіз бе! Менің атым — Аружан. Мен студент...» Сөйлемді дұрыс жалғаумен толықтырыңыз:',
    options: ['-пін', '-мін', '-бін', '-сіз'],
    correctAnswer: 1,
    explanation: '«Студент» сөзі ұяң «т» дыбысына аяқталғандықтан, I жақтың жіктеу жалғауы «-мін» жалғанады (студентпін/студентмін контекстке байланысты, стандарт бойынша: студентпін/студентмін).'
  },
  {
    id: 2,
    level: 'A1',
    category: 'Vocabulary',
    question: '«Отбасы» сөзінің аудармасы қандай?',
    options: ['Друзья', 'Семья', 'Работа', 'Университет'],
    correctAnswer: 1,
    explanation: '«Отбасы» қазақ тілінен аударғанда «Семья» дегенді білдіреді.'
  },
  // A2 Level
  {
    id: 3,
    level: 'A2',
    category: 'Grammar',
    question: '«Кеше біз мұражайға ...» Сөйлемдегі өткен шақ етістігін табыңыз:',
    options: ['барамыз', 'бардық', 'барып жатырмыз', 'бармақшымыз'],
    correctAnswer: 1,
    explanation: '«Кеше» сөзі өтіп кеткен уақытты білдіреді, сондықтан жедел өткен шақ жалғауы «бар-ды-қ» қолданылады.'
  },
  {
    id: 4,
    level: 'A2',
    category: 'Grammar',
    question: 'Барыс септігінің дұрыс жалғауын таңдаңыз: «Астана... барамын»',
    options: ['-ға', '-да', '-дан', '-ны'],
    correctAnswer: 0,
    explanation: 'Барыс септігі бағытты білдіреді (Қайда?). «Астана» сөзі дауыстыға аяқталғандықтан «-ға» жалғанады.'
  },
  // B1 Level
  {
    id: 5,
    level: 'B1',
    category: 'Grammar',
    question: '«Егер ертең ауа райы жақсы болса, біз тауға ...» Сөйлемді аяқтаңыз:',
    options: ['барар едік', 'барғанбыз', 'бармақпыз', 'барамыз'],
    correctAnswer: 0,
    explanation: 'Шартты райдан («болса») кейін ықтимал келер шақ формасы «барар едік» (мы бы пошли) қолданылады.'
  },
  {
    id: 6,
    level: 'B1',
    category: 'Listening/Context',
    question: 'Себеп-салдар байланысын білдіретін шылауды табыңыз:',
    options: ['Сондықтан', 'Бірақ', 'Яғни', 'Мисалға'],
    correctAnswer: 0,
    explanation: '«Сондықтан» (поэтому) шылауы себеп-салдарлық қатынасты білдіреді.'
  },
  // B2 Level
  {
    id: 7,
    level: 'B2',
    category: 'Grammar',
    question: '«Іс-шараның жоғары деңгейде өтуіне байланысты ұйымдастырушыларға алғыс білдірілді.» Осы сөйлемдегі тіркестің мағынасы:',
    options: ['Максатын білдіру', 'Себепті негіздеу', 'Қарсылықты білдіру', 'Уақытты межелеу'],
    correctAnswer: 1,
    explanation: '«...байланысты» тіркесі іс-әрекеттің орындалу себебін негіздеп тұр.'
  }
];

export default function AssessmentPage() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const currentQuestion = assessmentQuestions[currentStep];

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentStep < assessmentQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsSubmitted(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Расчет результата и уровня
  const calculateResult = () => {
    let score = 0;
    assessmentQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const percentage = Math.round((score / assessmentQuestions.length) * 100);

    let level = 'A1';
    let description = 'Бастапқы деңгей (Beginner). Сіз негізгі сөздер мен қарапайым фразаларды үйренуден бастайсыз.';
    
    if (percentage >= 85) {
      level = 'B2';
      description = 'Жоғары орта деңгей (Upper-Intermediate). Сіз күрделі грамматиканы түсінесіз және еркін сөйлей аласыз.';
    } else if (percentage >= 60) {
      level = 'B1';
      description = 'Орта деңгей (Intermediate). Сіз сөйлемдерді құрап, негізгі контекстті еркін түсінесіз.';
    } else if (percentage >= 35) {
      level = 'A2';
      description = 'Базалық деңгей (Elementary). Сіз күнделікті қарапайым тақырыптарда қатыса аласыз.';
    }

    return { score, percentage, level, description };
  };

  const result = calculateResult();

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-teal-400 font-bold hover:text-teal-300">
            <span>← Басты бетке</span>
          </Link>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Деңгейді анықтау тесті
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {!isSubmitted ? (
          <div>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                <span>Сұрақ {currentStep + 1} / {assessmentQuestions.length}</span>
                <span>Деңгей: <strong className="text-teal-400">{currentQuestion.level}</strong></span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-400 to-emerald-400 h-2.5 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / assessmentQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  {currentQuestion.category}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-slate-100 leading-snug">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectOption(index)}
                      className={`w-full text-left p-4 rounded-xl border font-medium transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'border-teal-400 bg-teal-500/15 text-teal-200 shadow-md shadow-teal-500/10'
                          : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50'
                      }`}
                    >
                      <span>{option}</span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-teal-400 bg-teal-400' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="mt-8 flex justify-between items-center pt-4 border-t border-slate-700/50">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Артқа
                </button>

                <button
                  onClick={handleNext}
                  disabled={selectedAnswers[currentQuestion.id] === undefined}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-900 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {currentStep === assessmentQuestions.length - 1 ? 'Нәтижені көру' : 'Келесі сұрақ →'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Results Screen */
          <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6 sm:p-10 text-center shadow-2xl backdrop-blur-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-400 flex items-center justify-center text-3xl font-extrabold text-slate-900 shadow-lg shadow-teal-500/20">
              {result.level}
            </div>

            <h1 className="text-3xl font-extrabold mb-2 text-slate-100">
              Сіздің деңгейіңіз: <span className="text-teal-400">{result.level}</span>
            </h1>

            <p className="text-slate-300 text-base max-w-lg mx-auto mb-6">
              {result.description}
            </p>

            <div className="inline-flex items-center gap-6 px-6 py-3 rounded-xl bg-slate-900/60 border border-slate-700/60 mb-8">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Дұрыс жауаптар</div>
                <div className="text-xl font-bold text-emerald-400">{result.score} / {assessmentQuestions.length}</div>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Дәлдік көрсеткіші</div>
                <div className="text-xl font-bold text-teal-400">{result.percentage}%</div>
              </div>
            </div>

            {/* Error Analysis / Detailed Feedback */}
            <div className="text-left mb-8 bg-slate-900/40 p-5 rounded-xl border border-slate-800">
              <h3 className="text-md font-bold mb-3 text-slate-200">📊 Тапсырмалар бойынша талдау:</h3>
              <div className="space-y-3">
                {assessmentQuestions.map((q) => {
                  const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
                  return (
                    <div key={q.id} className="p-3 rounded-lg bg-slate-800/80 text-xs border border-slate-700/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-slate-300">#{q.id} ({q.level} - {q.category})</span>
                        <span className={isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {isCorrect ? '✓ Дұрыс' : '✗ Қате'}
                        </span>
                      </div>
                      {!isCorrect && (
                        <p className="text-slate-400 mt-1">
                          💡 <span className="text-slate-300">{q.explanation}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/learning-path"
                className="px-8 py-3.5 rounded-xl text-base font-bold text-slate-900 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 shadow-lg transition-all"
              >
                Оқу жоспарына өту ({result.level})
              </Link>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setCurrentStep(0);
                  setSelectedAnswers({});
                }}
                className="px-6 py-3.5 rounded-xl text-base font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors"
              >
                Тестті қайта тапсыру
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}