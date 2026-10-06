import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const MAX_TEXT = 200
// Модель мен дауысты кодты өзгертпей, Vercel-дегі GEMINI_TTS_MODEL және GEMINI_TTS_VOICE арқылы ауыстыруға болады
const DEFAULT_MODEL = 'gemini-3.8-flash-lite-tts'
const FALLBACK_VOICE = 'Kore'
const BASE = 'https://generativelanguage.googleapis.com/v1beta'

interface VoiceInfo {
  id?: string
  name?: string
  display_name?: string
  language_code?: string
  accent?: string
  gender?: string
}

let cachedKazakhVoice: string | null = null

async function authorize(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return false
  const { data, error } = await supabase.auth.getUser(token)
  return !error && !!data.user
}

async function listKazakhVoices(apiKey: string): Promise<VoiceInfo[]> {
  try {
    const res = await fetch(`${BASE}/voices?language_code=kk`, {
      headers: { 'x-goog-api-key': apiKey },
    })
    if (!res.ok) return []
    const data = (await res.json()) as { voices?: VoiceInfo[]; items?: VoiceInfo[] }
    return data.voices ?? data.items ?? []
  } catch {
    return []
  }
}

// Қазақ дауысын таңдаймыз: алдымен қолмен берілген, содан соң каталогтағы бірінші қазақ дауысы
async function pickVoice(apiKey: string): Promise<string> {
  const forced = process.env.GEMINI_TTS_VOICE
  if (forced) return forced
  if (cachedKazakhVoice) return cachedKazakhVoice
  const voices = await listKazakhVoices(apiKey)
  const first = voices.find((v) => v.id || v.name)
  const id = first?.id ?? first?.name
  if (id) {
    cachedKazakhVoice = id
    return id
  }
  return FALLBACK_VOICE
}

async function requestSpeech(apiKey: string, model: string, voice: string, text: string): Promise<Response> {
  return fetch(`${BASE}/interactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model,
      input: [{ type: 'user_input', content: [{ type: 'text', text }] }],
      response_format: { type: 'audio' },
      generation_config: { speech_config: [{ voice }] },
    }),
  })
}

// Тексеру үшін: қазақ дауыстарының тізімін көрсетеді
export async function GET(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'no_key' }, { status: 503 })
  if (!(await authorize(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const voices = await listKazakhVoices(apiKey)
  return NextResponse.json({
    chosen: await pickVoice(apiKey),
    voices: voices.slice(0, 20).map((v) => ({
      id: v.id ?? v.name,
      name: v.display_name,
      lang: v.language_code,
      accent: v.accent,
      gender: v.gender,
    })),
  })
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'no_key' }, { status: 503 })
  }
  const model = process.env.GEMINI_TTS_MODEL || DEFAULT_MODEL

  if (!(await authorize(req))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, MAX_TEXT) : ''
  if (!text) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  let voice = await pickVoice(apiKey)
  let res: Response
  try {
    res = await requestSpeech(apiKey, model, voice, text)
    // Таңдалған дауыс қабылданбаса, әдеттегі дауыспен қайталаймыз
    if (!res.ok && voice !== FALLBACK_VOICE) {
      cachedKazakhVoice = null
      voice = FALLBACK_VOICE
      res = await requestSpeech(apiKey, model, voice, text)
    }
  } catch {
    return NextResponse.json({ error: 'network' }, { status: 502 })
  }

  if (!res.ok) {
    let detail = ''
    try {
      const errBody = (await res.json()) as { error?: { message?: string; status?: string } }
      detail = `${errBody.error?.status ?? ''} ${errBody.error?.message ?? ''}`.trim().slice(0, 200)
    } catch {
      // JSON емес жауап
    }
    return NextResponse.json({ error: 'provider', status: res.status, detail }, { status: 502 })
  }

  const data = (await res.json()) as {
    steps?: { type?: string; content?: { type?: string; data?: string }[] }[]
  }
  const audioParts = (data.steps ?? [])
    .filter((s) => s.type === 'model_output')
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === 'audio' && typeof c.data === 'string')
  const base64 = audioParts[audioParts.length - 1]?.data
  if (!base64) {
    return NextResponse.json({ error: 'empty' }, { status: 502 })
  }

  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0))
  return new Response(bytes, {
    status: 200,
    headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, max-age=86400' },
  })
}