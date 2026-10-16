// Көңіл-күй, «Неге үйренемін?» және жылы хабарламалар. Деректер тек осы құрылғыда (localStorage) сақталады.
export type MoodId = 'great' | 'ok' | 'tired' | 'sad'

export const MOODS: { id: MoodId; emoji: string; label: string }[] = [
  { id: 'great', emoji: '😄', label: 'Керемет' },
  { id: 'ok', emoji: '🙂', label: 'Қалыпты' },
  { id: 'tired', emoji: '😴', label: 'Шаршадым' },
  { id: 'sad', emoji: '😔', label: 'Көңілім жоқ' },
]

export const REASONS = ['Отбасым қазақ', 'Жұмыс', 'Қазақстанға көшу', 'Мәдениет пен тіл', 'Достарым', 'Оқу']

export interface MoodEntry {
  at: string
  mood: MoodId
}

const MOOD_KEY = 'qq_mood'
const REASON_KEY = 'qq_reason'

export function loadMoods(): MoodEntry[] {
  try {
    const raw = localStorage.getItem(MOOD_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (e): e is MoodEntry =>
        !!e && typeof (e as MoodEntry).at === 'string' && MOODS.some((m) => m.id === (e as MoodEntry).mood)
    )
  } catch {
    return []
  }
}

export function addMood(mood: MoodId): void {
  try {
    const list = loadMoods()
    list.push({ at: new Date().toISOString(), mood })
    localStorage.setItem(MOOD_KEY, JSON.stringify(list.slice(-60)))
  } catch {
    // сақтау мүмкін болмаса, өткізіп жібереміз
  }
}

export function loadReason(): string {
  try {
    return (localStorage.getItem(REASON_KEY) ?? '').slice(0, 300)
  } catch {
    return ''
  }
}

export function saveReason(text: string): void {
  try {
    const t = text.trim().slice(0, 300)
    if (t) localStorage.setItem(REASON_KEY, t)
    else localStorage.removeItem(REASON_KEY)
  } catch {
    // ignore
  }
}

export function suggestionFor(mood: MoodId): { text: string; href: string; label: string } {
  if (mood === 'great') return { text: 'Күшің мол екен, қиынырақ тапсырма алып көр.', href: '/checkpoint', label: 'Checkpoint-тест' }
  if (mood === 'ok') return { text: 'Бүгінгі тапсырмадан бастайық.', href: '/daily', label: 'Күннің тапсырмасы' }
  if (mood === 'tired') return { text: 'Шаршаған кезде аз да болса жеткілікті: небәрі 5 минут.', href: '/quick', label: '5 минуттық жаттығу' }
  return { text: 'Жеңіл ойыннан бастайық, ешқандай қысым жоқ.', href: '/games', label: 'Ойын жаттығулары' }
}

const PRAISE = ['Жарайсың!', 'Тамаша!', 'Дәл тауып қойдың!', 'Керемет!', 'Осылай жалғастыр!']
const SOFT = [
  'Қате дәптерге түсті, келесіде міндетті түрде шығады.',
  'Қателік дегеніміз үйренудің бір бөлігі.',
  'Жақын болдың, тағы бір рет көр.',
  'Бұл сөз қиын, бірақ сен үйренесің.',
]

export function warmMessage(correct: boolean): string {
  const list = correct ? PRAISE : SOFT
  return list[Math.floor(Math.random() * list.length)]
}
