import { lessonContent } from '@/lib/lessons'

export interface WordEntry {
  key: string
  kk: string
  ru: string
  note?: string
  lessonId: string
  lessonTitle: string
}

// Барлық сабақтардағы сөздер мен тіркестер (қайталанбайтындай кілтпен)
export function collectWords(): WordEntry[] {
  const seen = new Set<string>()
  const out: WordEntry[] = []
  const add = (lessonId: string, lessonTitle: string, kk: string, ru: string, note?: string) => {
    const key = `${lessonId}|${kk}`
    if (seen.has(key)) return
    seen.add(key)
    out.push({ key, kk, ru, note, lessonId, lessonTitle })
  }
  for (const lesson of Object.values(lessonContent)) {
    for (const letter of lesson.letters ?? []) {
      for (const ex of letter.examples) add(lesson.id, lesson.title, ex.kk, ex.ru)
    }
    for (const section of lesson.sections ?? []) {
      for (const item of section.items) add(lesson.id, lesson.title, item.kk, item.ru, item.note)
    }
  }
  return out
}
