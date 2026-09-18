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

export const scoreTextClassFor = (score: number) => scoreToneTextClass[resolveScoreTone(score)]

export const scoreHexFor = (score: number) => scoreToneHex[resolveScoreTone(score)]
