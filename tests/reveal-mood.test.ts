import { describe, expect, it } from 'vitest'
import { resolveRevealMood } from '@/lib/scoring/revealMood'

describe('resolveRevealMood', () => {
  it('treats scores below 3.20 as a flop', () => {
    expect([0, 2.71, 3.19].map(resolveRevealMood)).toEqual(['flop', 'flop', 'flop'])
  })

  it('treats scores from 3.20 up to 3.80 as approved', () => {
    expect([3.2, 3.5, 3.8].map(resolveRevealMood)).toEqual(['approved', 'approved', 'approved'])
  })

  it('treats scores above 3.80 as legendary', () => {
    expect([3.81, 4.44, 5].map(resolveRevealMood)).toEqual(['legendary', 'legendary', 'legendary'])
  })
})
