import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const MAX_TEXT = 200
// Модельді кодты өзгертпей, Vercel-дегі GEMINI_TTS_MODEL арқылы ауыстыруға болады
const DEFAULT_MODEL = 'gemini-3.8-flash-lite-tts'

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'no_key' }, { status: 503 })
  }
  const model = process.env.GEMINI_TTS_MODEL || DEFAULT_MODEL

  // Тек тіркелген қолданушыға рұқсат
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData.user) {
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

  let res: Response
  try {
    res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model,
        input: [{ type: 'user_input', content: [{ type: 'text', text }] }],
        response_format: { type: 'audio' },
        generation_config: { speech_config: [{ voice: 'Kore' }] },
      }),
    })
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