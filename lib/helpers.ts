// Ортақ көмекші функциялар

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

// Латын әріптері кириллицаға ұқсас болғандықтан, қателесіп латынша жазса да қабылдаймыз
const LATIN_TO_CYRILLIC: Record<string, string> = {
  a: 'а',
  c: 'с',
  e: 'е',
  i: 'і',
  o: 'о',
  p: 'р',
  x: 'х',
  y: 'у',
  k: 'к',
  m: 'м',
  t: 'т',
}

// Жауапты салыстыруға дайындайды: кіші әріп, артық бос орындарсыз, тыныс белгілерісіз
export function normalizeAnswer(input: string): string {
  const lower = input.normalize('NFC').toLowerCase()
  let out = ''
  for (const ch of lower) {
    out += LATIN_TO_CYRILLIC[ch] ?? ch
  }
  return out
    .replace(/[.,!?;:«»"'()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}