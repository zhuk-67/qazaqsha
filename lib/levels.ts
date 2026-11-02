import { curLevels, curriculum, lessonId, lessonState, coveredIn, topicIcon, type CurLevel } from '@/lib/curriculum'
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
  lessons: LessonMeta[] // нақты ашылған сабақтар
  soon: { n: number; title: string; desc: string; note: string }[] // әлі қосылмаған не басқа сабақта қамтылған тақырыптар
}

const MAIN: LevelId[] = ['A1', 'A2', 'B1', 'B2', 'C1']

// Сабақтар QAZIR бағдарламасынан алынады (lib/curriculum.ts). КАЗТЕСТ-тің ресми бөлінісі емес.
export const levelDefs: LevelDef[] = MAIN.map((id) => {
  const info = curLevels.find((l) => l.id === id)
  const lv = id as CurLevel
  const lessons: LessonMeta[] = []
  const soon: LevelDef['soon'] = []
  for (const tp of curriculum[lv]) {
    const st = lessonState(lv, tp)
    if (st === 'open') {
      lessons.push({ id: lessonId(lv, tp.n), title: `${tp.n}. ${tp.kk}`, desc: tp.ru, icon: topicIcon(tp) })
    } else if (st === 'covered') {
      const c = coveredIn(tp)
      soon.push({ n: tp.n, title: tp.kk, desc: tp.ru, note: c ? `Қамтылған: ${c.level} деңгейі, ${c.n}-сабақ` : 'Басқа сабақта қамтылған' })
    } else {
      soon.push({ n: tp.n, title: tp.kk, desc: tp.ru, note: 'Жақында' })
    }
  }
  return {
    id,
    tab: `${id} деңгейі`,
    title: `${id} деңгейі: ${info?.name ?? ''}`,
    subtitle: info?.focus ?? '',
    lessons,
    soon,
  }
})

// Ескі (бұрынғы) сабақтардың деңгейі: олар енді тізімде көрсетілмейді, бірақ сөздік пен қайталауда қолданылады
export const legacyLessonLevel: Record<string, LevelId> = {
  'a1-1': 'A1',
  'a1-2': 'A1',
  'a1-3': 'A1',
  'a1-4': 'A1',
  'a1-5': 'A1',
  'b1-2': 'A1',
  'a2-1': 'A2',
  'a2-2': 'A2',
  'a2-3': 'A2',
  'a2-4': 'A2',
  'b1-1': 'A2',
  'a2-5': 'A2',
  'b1-3': 'B1',
  'b1-4': 'B1',
  'b1-5': 'B1',
  'b2-1': 'B1',
  'b2-2': 'B1',
  'c1-1': 'B1',
  'c1-2': 'B1',
  'b2-3': 'B2',
  'b2-4': 'B2',
  'b2-5': 'B2',
  'c1-3': 'B2',
  'c1-4': 'C1',
  'c1-5': 'C1',
}

export function legacyIds(level: LevelId): string[] {
  return Object.keys(legacyLessonLevel).filter((k) => legacyLessonLevel[k] === level)
}

export function levelOfLesson(lessonId: string): LevelId | null {
  for (const l of levelDefs) if (l.lessons.some((x) => x.id === lessonId)) return l.id
  return legacyLessonLevel[lessonId] ?? null
}

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
