// Грамматика бағдарламасы A1–C1: түсіндірме, ереже, мысал, мини-жаттығу және тест
import { part as p1 } from './grammar-part1'
import { part as p2 } from './grammar-part2'
import { part as p3 } from './grammar-part3'
import { part as p4 } from './grammar-part4'
import { part as p5 } from './grammar-part5'

export type GrammarBlock =
  | { type: 'text'; text: string }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'examples'; items: { kk: string; ru: string }[] }

export type GrammarSection = 'phonetics' | 'morphology' | 'cases' | 'syntax'

export type GrammarQuestion =
  | { kind: 'choice'; prompt: string; options: string[]; answer: number; explain: string }
  | { kind: 'fill'; prompt: string; accepted: string[]; explain: string; hint: string }

export interface GrammarTopic {
  id: string
  level: string
  section: GrammarSection
  title: string
  summary: string
  blocks: GrammarBlock[]
  exercises: GrammarQuestion[]
  quiz: GrammarQuestion[]
}

export const grammarSections: { id: GrammarSection; title: string }[] = [
  { id: 'phonetics', title: 'Фонетика' },
  { id: 'morphology', title: 'Сөз таптары' },
  { id: 'cases', title: 'Септіктер' },
  { id: 'syntax', title: 'Синтаксис' },
]

export const grammarTopics: GrammarTopic[] = [...p1, ...p2, ...p3, ...p4, ...p5]
