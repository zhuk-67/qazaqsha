// Деңгейлер мен сабақтардың тізімі (кабинет, басты бет және рейтинг осы файлды қолданады)

export interface LessonMeta {
  id: string
  title: string
  desc: string
  icon: string
}

export type LevelId = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

export interface LevelDef {
  id: LevelId
  tab: string
  title: string
  subtitle: string
  lessons: LessonMeta[]
}

// QAZIR бағдарламасы КАЗТЕСТ және CEFR деңгейлеріне сүйеніп жасалған авторлық бағдарлама.
// Сабақ идентификаторлары (a1-1, b1-2 т.б.) өзгермейді, сондықтан қолданушылардың прогресі сақталады.
export const levelDefs: LevelDef[] = [
  {
    id: 'A1',
    tab: 'A1 деңгейі',
    title: 'A1 деңгейі: Бастапқы деңгей',
    subtitle: 'Әліпби, сәлемдесу, сандар, отбасы, тәуелдік жалғау',
    lessons: [
      { id: 'a1-1', title: '1. Алфавит және дыбыстар', desc: 'Ерекше дыбыстар: Ә, Ғ, Қ, Ң, Ө, Ү, Ұ, І, Һ', icon: '🔤' },
      { id: 'a1-2', title: '2. Сәлемдесу мен танысу', desc: 'Сәлеметсіз бе! Есіміңіз кім?', icon: '👋' },
      { id: 'a1-3', title: '3. Сандар мен уақыт', desc: '1-ден 100-ге дейін санау', icon: '🔢' },
      { id: 'a1-4', title: '4. Жіктеу есімдіктері', desc: 'Мен, сен, ол, біз, сіздер...', icon: '👥' },
      { id: 'a1-5', title: '5. Отбасы және мүшелері', desc: 'Әке, ана, аға, әпке, қарындас', icon: '🏠' },
      { id: 'b1-2', title: '6. Тәуелдік жалғау', desc: 'Менің кітабым, сенің үйің, біздің мектебіміз', icon: '🔑' },
    ],
  },
  {
    id: 'A2',
    tab: 'A2 деңгейі',
    title: 'A2 деңгейі: Негізгі деңгей',
    subtitle: 'Тамақ, қала, күнделікті өмір, осы, өткен және келер шақ',
    lessons: [
      { id: 'a2-1', title: '1. Тамақ және сусындар', desc: 'Нан, шай, сүт және мейрамханада тапсырыс', icon: '🍽️' },
      { id: 'a2-2', title: '2. Қала және бағыт', desc: 'Дүкен қайда? Оңға бұрылыңыз', icon: '🏙️' },
      { id: 'a2-3', title: '3. Күнделікті өмір', desc: 'Оқимын, жазамын, келемін: осы шақ', icon: '⏰' },
      { id: 'a2-4', title: '4. Өткен шақ', desc: 'Бардым, келдім, жаздым', icon: '⏪' },
      { id: 'b1-1', title: '5. Келер шақ және жоспар', desc: 'Ертең барамын, демалмақшымын', icon: '🗓️' },
      { id: 'a2-5', title: '6. Сын есім және түстер', desc: 'Үлкен, жаңа, қызыл, көк', icon: '🎨' },
    ],
  },
  {
    id: 'B1',
    tab: 'B1 деңгейі',
    title: 'B1 деңгейі: Орта деңгей',
    subtitle: 'Денсаулық, жұмыс, саяхат, шартты рай, көсемше, есімше, етіс',
    lessons: [
      { id: 'b1-3', title: '1. Денсаулық және дәрігер', desc: 'Басым ауырады, дәрігерге бару керек', icon: '🩺' },
      { id: 'b1-4', title: '2. Мамандықтар мен жұмыс', desc: 'Мен мұғаліммін, ол дәрігер', icon: '💼' },
      { id: 'b1-5', title: '3. Саяхат және көлік', desc: 'Пойыз, ұшақ, қонақүй, билет', icon: '✈️' },
      { id: 'b2-1', title: '4. Шарт және себеп', desc: 'Егер жаңбыр жауса..., себебі..., сондықтан...', icon: '🔀' },
      { id: 'b2-2', title: '5. Көсемше', desc: 'Оқып, келіп, барып, жазып', icon: '🔗' },
      { id: 'c1-1', title: '6. Есімше және есімше оралымдары', desc: 'Оқыған кітап, келетін қонақ, келер жыл', icon: '📖' },
      { id: 'c1-2', title: '7. Етіс түрлері', desc: 'Ырықсыз, өзгелік, ортақ, өздік етіс', icon: '🔄' },
    ],
  },
  {
    id: 'B2',
    tab: 'B2 деңгейі',
    title: 'B2 деңгейі: Ортадан жоғары деңгей',
    subtitle: 'Мәдениет, табиғат, пікір, құрмалас сөйлем',
    lessons: [
      { id: 'b2-3', title: '1. Қазақстан мәдениеті', desc: 'Наурыз, домбыра, киіз үй, қонақжайлық', icon: '🏔️' },
      { id: 'b2-4', title: '2. Табиғат және ауа райы', desc: 'Жаңбыр, қар, жел, жыл мезгілдері', icon: '🌦️' },
      { id: 'b2-5', title: '3. Салыстыру және пікір', desc: 'Үлкенірек, ең жақсы, менің ойымша', icon: '⚖️' },
      { id: 'c1-3', title: '4. Құрмалас сөйлем', desc: 'Салалас және сабақтас сөйлемдер', icon: '🧩' },
    ],
  },
  {
    id: 'C1',
    tab: 'C1 деңгейі',
    title: 'C1 деңгейі: Жоғары деңгей',
    subtitle: 'Ресми және академиялық тіл, мақал-мәтелдер',
    lessons: [
      { id: 'c1-4', title: '1. Ресми және академиялық тіл', desc: 'Өтініш, құрметпен, ресми хат', icon: '🏛️' },
      { id: 'c1-5', title: '2. Мақал-мәтелдер', desc: 'Тұрақты тіркестер мен мақалдар', icon: '📜' },
    ],
  },
]

export const totalLessonCount = levelDefs.reduce((sum, l) => sum + l.lessons.length, 0)

export function doneInLevel(level: LevelDef, completed: string[]): number {
  return level.lessons.filter((l) => completed.includes(l.id)).length
}

export function isLevelFinished(level: LevelDef, completed: string[]): boolean {
  return doneInLevel(level, completed) === level.lessons.length
}

// Деңгей ашық па: біріншісі әрқашан ашық, қалғандары алдыңғысы аяқталғанда ашылады
export function isLevelUnlocked(index: number, completed: string[]): boolean {
  return index === 0 || isLevelFinished(levelDefs[index - 1], completed)
}

// Қазіргі деңгей: аяқталмаған бірінші деңгей (бәрі аяқталса, соңғысы)
export function currentLevelId(completed: string[]): LevelId {
  for (const level of levelDefs) {
    if (!isLevelFinished(level, completed)) return level.id
  }
  return levelDefs[levelDefs.length - 1].id
}

export function totalDone(completed: string[]): number {
  return levelDefs.reduce((sum, l) => sum + doneInLevel(l, completed), 0)
}

// Сабақтың қай деңгейде тұрғанын id префиксінен емес, нақты тізімнен анықтаймыз
export function levelOfLesson(lessonId: string): LevelId | null {
  for (const l of levelDefs) if (l.lessons.some((x) => x.id === lessonId)) return l.id
  return null
}
