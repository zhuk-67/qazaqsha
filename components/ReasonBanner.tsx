'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { loadReason } from '@/lib/mood'

export default function ReasonBanner() {
  const [reason, setReason] = useState('')

  useEffect(() => {
    setReason(loadReason())
  }, [])

  if (!reason) return null
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
      <Link
        href="/mood"
        className="block bg-slate-900 border border-teal-500 rounded-2xl px-4 py-3 text-sm hover:bg-slate-800 transition-all"
      >
        <span className="text-teal-300 font-semibold">Неге үйренемін: </span>
        <span className="text-slate-300">{reason}</span>
      </Link>
    </section>
  )
}
