import { describe, expect, it } from 'vitest'
import { calculateNominationWeight } from '@/lib/draw/calculateNominationWeight'

const now = new Date('2026-09-04T12:00:00Z')
const monthsAgo = (months: number) =>
  new Date(now.getTime() - months * 30.4375 * 24 * 60 * 60 * 1000)

describe('revisit weight', () => {
  it('gives full weight to a restaurant the group never visited', () => {
    expect(calculateNominationWeight({ visitCount: 0, lastVisitedAt: null }, now)).toBe(1)
  })

  it('drops the weight sharply right after a visit', () => {
    const weight = calculateNominationWeight(
      { visitCount: 1, lastVisitedAt: monthsAgo(0) },
      now,
    )
    expect(weight).toBeCloseTo(0.2, 4)
  })

  it('recovers gradually as months pass', () => {
    const justVisited = calculateNominationWeight({ visitCount: 1, lastVisitedAt: monthsAgo(1) }, now)
    const halfYear = calculateNominationWeight({ visitCount: 1, lastVisitedAt: monthsAgo(6) }, now)

    expect(halfYear).toBeGreaterThan(justVisited)
    expect(halfYear).toBeLessThan(1)
  })

  it('returns to full weight once the recovery window has passed', () => {
    expect(
      calculateNominationWeight({ visitCount: 1, lastVisitedAt: monthsAgo(12) }, now),
    ).toBeCloseTo(1, 4)
  })

  it('punishes a restaurant the group keeps going back to', () => {
    const visitedOnce = calculateNominationWeight({ visitCount: 1, lastVisitedAt: monthsAgo(3) }, now)
    const visitedFourTimes = calculateNominationWeight(
      { visitCount: 4, lastVisitedAt: monthsAgo(3) },
      now,
    )

    expect(visitedFourTimes).toBeLessThan(visitedOnce)
  })

  it('keeps a visited restaurant far less likely than a fresh one', () => {
    const fresh = calculateNominationWeight({ visitCount: 0, lastVisitedAt: null }, now)
    const recentlyVisited = calculateNominationWeight(
      { visitCount: 1, lastVisitedAt: monthsAgo(0.5) },
      now,
    )

    expect(recentlyVisited).toBeLessThan(fresh * 0.35)
  })

  it('never returns a negative weight for a future timestamp', () => {
    const future = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30)
    expect(calculateNominationWeight({ visitCount: 1, lastVisitedAt: future }, now)).toBeGreaterThan(0)
  })
})
