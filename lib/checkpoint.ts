import { levelDefs, type LevelId } from '@/lib/levels'
import { curriculum } from '@/lib/curriculum'
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

// Деңгей бағдарламасының тақырыптарынан 14 және деңгейдің грамматикасынан 6 сұрақ
export function buildCheckpoint(level: LevelId): PQ[] {
  const fromLessons: PQ[] = []
  const used = new Set<string>()
  for (const tp of curriculum[level]) {
    for (const id of tp.ids) {
      if (used.has(id)) continue
      used.add(id)
      const topic = grammarTopics.find((g) => g.id === id)
      if (!topic) continue
      for (const q of [...topic.exercises, ...topic.quiz]) fromLessons.push({ ...q, tag: topic.title })
    }
  }
  const grammar: PQ[] = []
  for (const t of grammarTopics) {
    if (t.level !== `${level} деңгейі`) continue
    for (const q of [...t.exercises, ...t.quiz]) grammar.push({ ...q, tag: 'Грамматика' })
  }
  const rnd = Math.random
  const seen = new Set<string>()
  const picked = [...pick(fromLessons, 14, rnd), ...pick(grammar, 6, rnd)].filter((q) => (seen.has(q.prompt) ? false : (seen.add(q.prompt), true)))
  return pick(picked, picked.length, rnd)
}
