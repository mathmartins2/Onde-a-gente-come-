export type RevealMood = 'flop' | 'approved' | 'legendary'

const approvedThreshold = 3.2
const legendaryThreshold = 3.8

export const resolveRevealMood = (finalScore: number): RevealMood => {
  if (finalScore > legendaryThreshold) return 'legendary'
  if (finalScore >= approvedThreshold) return 'approved'
  return 'flop'
}
