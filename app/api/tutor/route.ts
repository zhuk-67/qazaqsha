import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Стабильная базовая модель с наименьшей вероятностью отказа
const MODELS_TO_TRY = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']

interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY бапталмаған' }, { status: 503 })
  }

  // Тек тіркелген қолданушыға рұқсат
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return NextResponse.json({ error: 'Кіру қажет (unauthorized)' }, { status: 401 })
  }
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Сессия жарамсыз (unauthorized)' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Қате сұраныс (bad_request)' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : ''
  if (!message) {
    return NextResponse.json({ error: 'Сұрақ бос болмауы керек' }, { status: 400 })
  }

  const history = Array.isArray(body.history) ? (body.history as ChatMessage[]) : []

  const system =
    'Ты — дружелюбный виртуальный тьютор по казахскому языку на платформе QazaqQadam.\n' +
    'Твои ученики — русскоязычные ученики уровней A1–A2.\n' +
    'Отвечай по-русски, кратко (2-3 коротких абзаца), понятно и с примерами на казахском с переводом.'

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []

  const recentHistory = history.slice(-4)
  for (const item of recentHistory) {
    if (item.role === 'user' || item.role === 'model') {
      contents.push({
        role: item.role,
        parts: [{ text: item.text }],
      })
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: message }],
  })

  // Перебираем стабильные модели, пока одна из них не ответит
  let lastError = ''
  for (const model of MODELS_TO_TRY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents,
            generationConfig: { maxOutputTokens: 600 },
          }),
        }
      )

      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[]
        }
        const answer = (data.candidates?.[0]?.content?.parts ?? [])
          .map((p) => p.text ?? '')
          .join('')
          .trim()

        if (answer) {
          return NextResponse.json({ reply: answer })
        }
      } else {
        const errBody = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        lastError = errBody.error?.message || `Статус ${res.status}`
      }
    } catch {
      lastError = 'Желілік қате'
    }
  }

  return NextResponse.json(
    { error: `Gemini сервелері уақытша бос емес: ${lastError}` },
    { status: 503 }
  )
}