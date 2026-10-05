'use client'

import { useState } from 'react'
import { grammarTopics, type GrammarTopic } from '@/lib/grammar'

export default function GrammarTab() {
  const [openId, setOpenId] = useState<string | null>(null)
  const topic: GrammarTopic | undefined = grammarTopics.find((t) => t.id === openId)

  if (topic) {
    return (
      <div>
        <button
          onClick={() => setOpenId(null)}
          className="mb-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-bold rounded-xl transition-all"
        >
          ← Барлық тақырыптар
        </button>

        <span className="px-3 py-1 bg-teal-500/10 text-teal-400 text-xs font-bold rounded-lg border border-teal-500/20">
          {topic.level}
        </span>
        <h2 className="text-2xl font-bold mt-3 mb-6">{topic.title}</h2>

        <div className="space-y-6">
          {topic.blocks.map((block, i) => {
            if (block.type === 'text') {
              return (
                <p key={i} className="text-slate-300 leading-relaxed">
                  {block.text}
                </p>
              )
            }
            if (block.type === 'table') {
              return (
                <div key={i} className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-900 text-teal-300">
                      <tr>
                        {block.head.map((h) => (
                          <th key={h} className="px-4 py-3 font-bold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, r) => (
                        <tr key={r} className="border-t border-slate-800 bg-slate-950">
                          {row.map((cell, c) => (
                            <td key={c} className={`px-4 py-3 ${c === 0 ? 'font-bold text-white' : 'text-slate-300'}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
            return (
              <div key={i} className="space-y-2">
                {block.items.map((ex, e) => (
                  <div key={e} className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3">
                    <p className="font-bold text-white">{ex.kk}</p>
                    <p className="text-sm text-slate-400">{ex.ru}</p>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">✍️ Грамматикалық ережелер</h2>
      <p className="text-sm text-slate-400 mb-6">Тақырыпты таңдап, ережені оқыңыз.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {grammarTopics.map((t) => (
          <button
            key={t.id}
            onClick={() => setOpenId(t.id)}
            className="text-left bg-slate-900 border border-slate-800 hover:border-teal-400 p-6 rounded-2xl transition-all"
          >
            <span className="px-3 py-1 bg-teal-500/10 text-teal-400 text-xs font-bold rounded-lg border border-teal-500/20">
              {t.level}
            </span>
            <h3 className="font-bold text-lg mt-3 mb-2">{t.title}</h3>
            <p className="text-xs text-slate-400">{t.summary}</p>
          </button>
        ))}
      </div>
    </div>
  )
}