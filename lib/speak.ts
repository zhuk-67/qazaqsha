import { supabase } from '@/lib/supabase'

// Қазақша дыбыстау: алдымен браузердегі қазақ дауысы, ол болмаса сервер арқылы Gemini

const CACHE_NAME = 'qq-tts-v1'
const memory = new Map<string, string>() // мәтін -> уақытша аудио сілтемесі
let currentAudio: HTMLAudioElement | null = null

// «жазу → жазамын» сияқты жолдан тек соңғы бөлігін айтады
export function speechText(raw: string): string {
  const part = raw.includes('→') ? (raw.split('→').pop() ?? raw) : raw
  return part.replace(/\s+/g, ' ').trim().slice(0, 200)
}

function stopCurrent() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([])
      return
    }
    const now = window.speechSynthesis.getVoices()
    if (now.length > 0) {
      resolve(now)
      return
    }
    const timer = setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000)
    window.speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        clearTimeout(timer)
        resolve(window.speechSynthesis.getVoices())
      },
      { once: true }
    )
  })
}

// Браузерде қазақ дауысы болса, соны қолданады. Дауыс жоқ болса, false қайтарады
async function speakWithBrowser(text: string): Promise<boolean> {
  const voices = await loadVoices()
  const voice = voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('kk'))
  if (!voice) return false

  await new Promise<void>((resolve, reject) => {
    const u = new SpeechSynthesisUtterance(text)
    u.voice = voice
    u.lang = voice.lang
    u.rate = 0.9
    u.onend = () => resolve()
    u.onerror = (e) => {
      // басқа дыбыс бастағанда алдыңғысы үзіледі, бұл қате емес
      if (e.error === 'interrupted' || e.error === 'canceled') resolve()
      else reject(new Error('browser_tts'))
    }
    window.speechSynthesis.speak(u)
  })
  return true
}

async function getServerAudioUrl(text: string): Promise<string> {
  const hit = memory.get(text)
  if (hit) return hit

  const key = `/tts/${encodeURIComponent(text)}`
  let blob: Blob | null = null

  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME)
      const found = await cache.match(key)
      if (found) blob = await found.blob()
    } catch {
      // кэш қолжетімсіз болса, жалғастырамыз
    }
  }

  if (!blob) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('auth')

    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) {
      let code = 'server'
      try {
        const data = (await res.json()) as { error?: string }
        code = data.error ?? code
      } catch {
        // JSON емес жауап
      }
      throw new Error(code)
    }
    blob = await res.blob()

    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME)
        await cache.put(key, new Response(blob, { headers: { 'Content-Type': blob.type || 'audio/wav' } }))
      } catch {
        // сақтау мүмкін болмаса, ештеңе етпейді
      }
    }
  }

  const url = URL.createObjectURL(blob)
  memory.set(text, url)
  return url
}

export async function speak(raw: string): Promise<void> {
  const text = speechText(raw)
  if (!text) return
  stopCurrent()

  let browserFailed = false
  try {
    if (await speakWithBrowser(text)) return
  } catch {
    browserFailed = true
  }

  try {
    const url = await getServerAudioUrl(text)
    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(url)
      currentAudio = audio
      audio.onended = () => resolve()
      audio.onerror = () => reject(new Error('play'))
      audio.play().catch(() => reject(new Error('play')))
    })
  } catch (e) {
    if (browserFailed && e instanceof Error && e.message === 'no_key') throw new Error('browser_tts')
    throw e
  }
}

export function speakErrorMessage(err: unknown): string {
  const code = err instanceof Error ? err.message : ''
  if (code === 'no_key') return 'Бұл құрылғыда қазақ дауысы жоқ, ал сервердегі дыбыстау әлі қосылмаған.'
  if (code === 'auth' || code === 'unauthorized') return 'Дыбыстау үшін жүйеге кіріңіз.'
  if (code === 'provider') return 'Дыбыстау сервері жауап бермеді. Кейінірек қайта көріңіз.'
  if (code === 'play') return 'Дыбысты ойнату мүмкін болмады.'
  if (code === 'browser_tts') return 'Браузердің дыбыстауы жұмыс істемеді.'
  return 'Дыбыстау мүмкін болмады. Кейінірек қайта көріңіз.'
}