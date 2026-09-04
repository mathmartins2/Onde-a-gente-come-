import { describe, expect, it } from 'vitest'
import { calculateVisitScore, resolveRatingWeight } from '@/lib/scoring/calculateVisitScore'

describe('visit score', () => {
  it('gives more weight to members who did not recommend the restaurant', () => {
    const score = calculateVisitScore(
      [
        { memberId: 'romario', score: 5 },
        { memberId: 'math', score: 3 },
        { memberId: 'vini', score: 4 },
        { memberId: 'alucard', score: 4 },
      ],
      'romario',
    )

    expect(score).toBeCloseTo(18.75 / 4.75, 4)
  })

  it('lands below the plain average when the recommender is the most enthusiastic', () => {
    const plainAverage = (5 + 3 + 4 + 4) / 4
    const score = calculateVisitScore(
      [
        { memberId: 'romario', score: 5 },
        { memberId: 'math', score: 3 },
        { memberId: 'vini', score: 4 },
        { memberId: 'alucard', score: 4 },
      ],
      'romario',
    )

    expect(score).toBeLessThan(plainAverage)
  })

  it('rises above the plain average when the recommender is the harshest critic', () => {
    const plainAverage = (1 + 5 + 5 + 5) / 4
    const score = calculateVisitScore(
      [
        { memberId: 'romario', score: 1 },
        { memberId: 'math', score: 5 },
        { memberId: 'vini', score: 5 },
        { memberId: 'alucard', score: 5 },
      ],
      'romario',
    )

    expect(score).toBeGreaterThan(plainAverage)
  })

  it('equals the plain average when nobody recommended the restaurant', () => {
    const score = calculateVisitScore(
      [
        { memberId: 'math', score: 3 },
        { memberId: 'vini', score: 5 },
      ],
      null,
    )

    expect(score).toBeCloseTo(4, 6)
  })

  it('returns null when there is no rating yet', () => {
    expect(calculateVisitScore([], 'math')).toBeNull()
  })

  it('weighs the recommender lighter than everyone else', () => {
    expect(resolveRatingWeight('math', 'math')).toBeLessThan(resolveRatingWeight('vini', 'math'))
  })
})
