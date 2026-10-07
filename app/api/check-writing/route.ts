// app/api/check-writing/route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userText, taskPrompt, userLevel } = await req.json();

    if (!userText) {
      return NextResponse.json({ error: 'Мәтін жіберілмеді' }, { status: 400 });
    }

    const systemPrompt = `
Сіз — QAZIR платформасының қазақ тілі мұғалімісіз.
Пайдаланушының деңгейі: ${userLevel || 'A1'}.
Тапсырма: ${taskPrompt || 'Еркін тақырып'}.

Пайдаланушы жіберген жауапты грамматика, орфография, жалғаулар және сөз тәртібі бойынша тексеріңіз.
Жауапты ТЕК ҚАЗАҚ ТІЛІНДЕ, келесі JSON форматында қайтарыңыз:
{
  "isCorrect": boolean,
  "score": number,
  "corrections": [
    {
      "original": "қате сөз",
      "corrected": "дұрыс сөз",
      "explanation": "Түсіндірме"
    }
  ],
  "generalFeedback": "Жалпы пікір"
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'AI тексеру кезінде қате орын алды' }, { status: 500 });
  }
}
