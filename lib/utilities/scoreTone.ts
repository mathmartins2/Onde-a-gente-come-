import type { ResolvedTheme } from '@/lib/theme/themePreference'

export type ScoreTone = 'great' | 'good' | 'fair' | 'poor'

const greatThreshold = 4
const goodThreshold = 3
const fairThreshold = 2

export const resolveScoreTone = (score: number): ScoreTone => {
  if (score >= greatThreshold) return 'great'
  if (score >= goodThreshold) return 'good'
  if (score >= fairThreshold) return 'fair'
  return 'poor'
}

export const scoreToneTextClass: Record<ScoreTone, string> = {
  great: 'text-[var(--success)]',
  good: 'text-[var(--herb)]',
  fair: 'text-[var(--warning)]',
  poor: 'text-[var(--danger)]',
}

export const scoreToneHex: Record<ScoreTone, string> = {
  great: '#5fd68f',
  good: '#a8dd52',
  fair: '#fbbf24',
  poor: '#ff6b6b',
}

const lightScoreToneHex: Record<ScoreTone, string> = {
  great: '#15794a',
  good: '#3f7410',
  fair: '#8f5a06',
  poor: '#d12f2f',
}

export const scoreToneHexFor = (theme: ResolvedTheme) => (theme === 'light' ? lightScoreToneHex : scoreToneHex)

export const scoreTextClassFor = (score: number) => scoreToneTextClass[resolveScoreTone(score)]

export const scoreHexFor = (score: number, theme: ResolvedTheme = 'dark') =>
  scoreToneHexFor(theme)[resolveScoreTone(score)]
