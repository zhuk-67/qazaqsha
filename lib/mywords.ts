// «Менің сөздерім»: қолданушы өзі қосқан сөздер (осы құрылғыда сақталады)

export interface MyWord {
  kk: string
  ru: string
  note?: string
  source?: string
  at: string
}

const KEY = 'qq_mywords'

export function loadMyWords(): MyWord[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as MyWord[]) : []
  } catch {
    return []
  }
}

function save(list: MyWord[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // сақтау мүмкін болмаса, өткізіп жібереміз
  }
}

export function hasMyWord(kk: string): boolean {
  return loadMyWords().some((w) => w.kk.toLowerCase() === kk.toLowerCase())
}

export function addMyWord(w: Omit<MyWord, 'at'>): void {
  const list = loadMyWords()
  if (list.some((x) => x.kk.toLowerCase() === w.kk.toLowerCase())) return
  list.push({ ...w, at: new Date().toISOString() })
  save(list)
}

export function removeMyWord(kk: string): void {
  save(loadMyWords().filter((w) => w.kk.toLowerCase() !== kk.toLowerCase()))
}
