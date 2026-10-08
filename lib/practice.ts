import { grammarTopics, type GrammarQuestion } from '@/lib/grammar'
import { levelDefs, currentLevelId } from '@/lib/levels'
import { collectWords, type WordEntry } from '@/lib/words'

export type PQ = GrammarQuestion & { audio?: string; tag: string }

// Күнге байланған тұрақты кездейсоқ сан (бір күнде бірдей, келесі күні басқа)
export function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(arr: T[], n: number, rnd: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

// Қолданушының сөздері: өткен сабақтардағы сөздер (аз болса, A1 сөздері)
export function userWords(completed: string[]): { pool: WordEntry[]; all: WordEntry[] } {
  const all = collectWords()
  let pool = all.filter((w) => completed.includes(w.lessonId))
  if (pool.length < 8) {
    const a1 = new Set((levelDefs.find((l) => l.id === 'A1')?.lessons ?? []).map((l) => l.id))
    pool = all.filter((w) => a1.has(w.lessonId))
  }
  return { pool, all }
}

function stem(s: string): string {
  return s.toLowerCase().replace(/[^а-яёa-zәғқңөұүһі0-9 ]/gi, '').slice(0, 6)
}

// Тосқауыл жауаптар: сол түрдегі (сөз/тіркес) және мағынасы ұқсамайтын жауаптар
function distractors(w: WordEntry, all: WordEntry[], rnd: () => number): string[] {
  const phrase = /\s/.test(w.kk)
  const seen = new Set([w.ru])
  const stems = new Set([stem(w.ru)])
  const out: string[] = []
  const cands = pick(all, all.length, rnd)
  for (const strict of [true, false]) {
    for (const c of cands) {
      if (out.length === 3) break
      if (seen.has(c.ru) || c.ru.length > 60) continue
      if (strict && /\s/.test(c.kk) !== phrase) continue
      if (stems.has(stem(c.ru))) continue
      seen.add(c.ru)
      stems.add(stem(c.ru))
      out.push(c.ru)
    }
  }
  return out
}

function dot(s: string): string {
  return /[.!?]$/.test(s) ? s : s + '.'
}

export function wordQuestions(pool: WordEntry[], all: WordEntry[], n: number, rnd: () => number, listen = false): PQ[] {
  const items = pick(pool.filter((w) => w.ru.length <= 60), n, rnd)
  const out: PQ[] = []
  for (const w of items) {
    const wrong = distractors(w, all, rnd)
    if (wrong.length < 3) continue
    const options = pick([w.ru, ...wrong], 4, rnd)
    out.push({
      kind: 'choice',
      prompt: listen ? 'Тыңдаңыз да, мағынасын таңдаңыз.' : `«${w.kk}» қандай мағынаны білдіреді?`,
      options,
      answer: options.indexOf(w.ru),
      explain: dot(`${w.kk} — ${w.ru}`),
      audio: listen ? w.kk : undefined,
      tag: listen ? 'Тыңдау' : 'Сөздер',
    })
  }
  return out
}

export function writeQuestions(pool: WordEntry[], all: WordEntry[], n: number, rnd: () => number): PQ[] {
  const simple = pool.filter((w) => /^[^\s.,!?—-]{3,}$/.test(w.kk) && w.ru.length <= 40)
  return pick(simple, n, rnd).map((w) => {
    const accepted = Array.from(new Set(all.filter((x) => x.ru === w.ru && !/\s/.test(x.kk)).map((x) => x.kk.toLowerCase())))
    return {
      kind: 'fill',
      prompt: `Қазақша жазыңыз: «${w.ru}»`,
      accepted: accepted.length ? accepted : [w.kk.toLowerCase()],
      explain: dot(`${w.ru} — ${w.kk}`),
      hint: `Бірінші әріп: ${w.kk[0]}`,
      tag: 'Жазу',
    }
  })
}

export function grammarQuestions(completed: string[], n: number, rnd: () => number): PQ[] {
  const cur = levelDefs.findIndex((l) => l.id === currentLevelId(completed))
  const wanted = new Set([levelDefs[cur]?.id, levelDefs[Math.max(0, cur - 1)]?.id].map((x) => `${x} деңгейі`))
  const pool: PQ[] = []
  for (const t of grammarTopics) {
    if (!wanted.has(t.level)) continue
    for (const q of [...t.exercises, ...t.quiz]) pool.push({ ...q, tag: 'Грамматика' })
  }
  return pick(pool, n, rnd)
}
