import { lessonContent } from '@/lib/lessons'
import { levelDefs, type LevelId } from '@/lib/levels'
import { grammarTopics } from '@/lib/grammar'
import { pick, type PQ } from '@/lib/practice'

const KEY = 'qq_checkpoints'
export const PASS_PERCENT = 70

export function loadCheckpoints(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

export function saveCheckpoint(level: string, percent: number): Record<string, number> {
  const all = loadCheckpoints()
  if (percent > (all[level] ?? -1)) all[level] = percent
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // сақтау мүмкін болмаса, өткізіп жібереміз
  }
  return all
}

// Деңгейдің сабақтарынан 12 және грамматикадан 6 сұрақ
export function buildCheckpoint(level: LevelId): PQ[] {
  const def = levelDefs.find((l) => l.id === level)
  const fromLessons: PQ[] = []
  for (const meta of def?.lessons ?? []) {
    const lesson = lessonContent[meta.id]
    if (!lesson) continue
    for (const q of lesson.questions) {
      if (q.type === 'write') {
        fromLessons.push({ kind: 'fill', prompt: q.prompt, accepted: q.accepted.map((a) => a.toLowerCase()), explain: q.explain, hint: q.hint ?? '', tag: lesson.title })
      } else if (q.type === undefined || q.type === 'choice') {
        fromLessons.push({ kind: 'choice', prompt: q.prompt, options: q.options, answer: q.answer, explain: q.explain, tag: lesson.title })
      }
    }
  }
  const grammar: PQ[] = []
  for (const t of grammarTopics) {
    if (t.level !== `${level} деңгейі`) continue
    for (const q of [...t.exercises, ...t.quiz]) grammar.push({ ...q, tag: 'Грамматика' })
  }
  const rnd = Math.random
  const picked = [...pick(fromLessons, 12, rnd), ...pick(grammar, 6, rnd)]
  return pick(picked, picked.length, rnd)
}
