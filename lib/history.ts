// Оқу тарихы: аяқталған жаттығулар (осы құрылғыда сақталады)

export interface HistoryEntry {
  at: string // ISO уақыт
  kind: string // 'daily' | 'quick' | 'checkpoint' | ...
  score: number
  total: number
}

const KEY = 'qq_history'

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

export function addHistory(kind: string, score: number, total: number): void {
  try {
    const list = loadHistory()
    list.push({ at: new Date().toISOString(), kind, score, total })
    localStorage.setItem(KEY, JSON.stringify(list.slice(-300)))
  } catch {
    // сақтау мүмкін болмаса, өткізіп жібереміз
  }
}

export function localDay(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
