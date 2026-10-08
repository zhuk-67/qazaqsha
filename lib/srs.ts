// Аралықты қайталау: сөз қорапшалары (осы құрылғыда сақталады)

export interface SrsEntry {
  box: number // 0–6
  due: string // келесі қайталау күні (YYYY-MM-DD)
  seen: number
  forgot: number
}

export type SrsMap = Record<string, SrsEntry>

const KEY = 'qq_srs'
const INTERVALS = [0, 1, 2, 4, 8, 16, 32] // күн

export function dateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr(): string {
  return dateStr(new Date())
}

export function loadSrs(): SrsMap {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SrsMap) : {}
  } catch {
    return {}
  }
}

export function saveSrs(map: SrsMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    // сақтау мүмкін болмаса, өткізіп жібереміз
  }
}

export function gradeEntry(prev: SrsEntry | undefined, known: boolean): SrsEntry {
  const base: SrsEntry = prev ?? { box: 0, due: todayStr(), seen: 0, forgot: 0 }
  const box = known ? Math.min(base.box + 1, INTERVALS.length - 1) : 0
  const next = new Date()
  next.setDate(next.getDate() + INTERVALS[box])
  return {
    box,
    due: known ? dateStr(next) : todayStr(),
    seen: base.seen + 1,
    forgot: base.forgot + (known ? 0 : 1),
  }
}
