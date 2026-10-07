'use client'

import { useTheme } from '@/components/ThemeProvider'

export default function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Күндізгі режимге ауысу' : 'Түнгі режимге ауысу'}
      title={isDark ? 'Күндізгі режим' : 'Түнгі режим'}
      className="inline-flex items-center justify-center gap-2 h-9 min-w-9 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm transition-all"
    >
      <span>{isDark ? '☀️' : '🌙'}</span>
      {withLabel && <span className="text-xs font-medium">{isDark ? 'Күндізгі режим' : 'Түнгі режим'}</span>}
    </button>
  )
}