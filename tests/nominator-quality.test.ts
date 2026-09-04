import { describe, expect, it } from 'vitest'
import { calculateQualityMultiplier } from '@/lib/draw/calculateQualityMultiplier'

describe('nominator quality multiplier', () => {
  it('stays neutral for someone with no history yet', () => {
    expect(calculateQualityMultiplier(null, 4)).toBe(1)
  })

  it('stays neutral when the group itself has no history', () => {
    expect(calculateQualityMultiplier(4.8, null)).toBe(1)
  })

  it('raises the chance of someone whose picks score above the group average', () => {
    expect(calculateQualityMultiplier(4.6, 4)).toBeGreaterThan(1)
  })

  it('lowers the chance of someone whose picks score below the group average', () => {
    expect(calculateQualityMultiplier(3.2, 4)).toBeLessThan(1)
  })

  it('is exactly neutral for someone who scores the group average', () => {
    expect(calculateQualityMultiplier(4.1, 4.1)).toBe(1)
  })

  it('keeps the nudge slight even for a perfect track record', () => {
    const multiplier = calculateQualityMultiplier(5, 1)
    expect(multiplier).toBeLessThanOrEqual(1.15)
  })

  it('keeps the penalty slight even for a terrible track record', () => {
    const multiplier = calculateQualityMultiplier(0, 5)
    expect(multiplier).toBeGreaterThanOrEqual(0.85)
  })

  it('orders two nominators by how well their picks did', () => {
    const better = calculateQualityMultiplier(4.7, 4)
    const worse = calculateQualityMultiplier(3.5, 4)
    expect(better).toBeGreaterThan(worse)
  })
})
