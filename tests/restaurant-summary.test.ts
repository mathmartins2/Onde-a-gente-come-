import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { buildRestaurantSummary, type SummaryRating, type SummaryVisit } from '@/lib/restaurantSummary/buildRestaurantSummary'

const buildRating = (overrides: Partial<SummaryRating> = {}): SummaryRating => ({
  memberId: faker.string.uuid(),
  authorName: faker.person.firstName(),
  score: 4,
  comment: null,
  criterionScores: { flavor: 4, price: 4, service: 4, ambience: 4, menu: 4, waitTime: 4 },
  ...overrides,
})

const buildVisit = (overrides: Partial<SummaryVisit> = {}): SummaryVisit => ({
  visitedAt: new Date('2026-03-10T20:00:00Z'),
  recommendedByMemberId: null,
  legacyScore: null,
  ratings: [],
  ...overrides,
})

describe('restaurant summary', () => {
  it('is empty when no visit has a score yet', () => {
    expect(buildRestaurantSummary([buildVisit()])).toBeNull()
  })

  it('averages the visit scores and each criterion across every rating', () => {
    const summary = buildRestaurantSummary([
      buildVisit({
        ratings: [
          buildRating({ score: 5, criterionScores: { flavor: 5, price: 3, service: 4, ambience: 5, menu: 4, waitTime: 2 } }),
          buildRating({ score: 3, criterionScores: { flavor: 4, price: 2, service: 3, ambience: 4, menu: 3, waitTime: 1 } }),
        ],
      }),
      buildVisit({ legacyScore: 2 }),
    ])

    expect(summary?.overallScore).toBe(3)
    expect(summary?.scoredVisitCount).toBe(2)
    expect(summary?.criteria.map((criterion) => [criterion.label, criterion.score])).toEqual([
      ['Sabor', 4.5],
      ['Preço', 2.5],
      ['Atendimento', 3.5],
      ['Ambiente', 4.5],
      ['Menu', 3.5],
      ['Tempo de espera', 1.5],
    ])
  })

  it('leaves out criteria nobody scored', () => {
    const summary = buildRestaurantSummary([
      buildVisit({
        ratings: [buildRating({ criterionScores: { flavor: 4, price: null, service: null, ambience: null, menu: null, waitTime: null } })],
      }),
    ])

    expect(summary?.criteria.map((criterion) => criterion.key)).toEqual(['flavor'])
  })

  it('lists the newest comments first and skips blank ones', () => {
    const summary = buildRestaurantSummary([
      buildVisit({ visitedAt: new Date('2026-01-05T20:00:00Z'), ratings: [buildRating({ comment: 'Older visit' })] }),
      buildVisit({
        visitedAt: new Date('2026-06-05T20:00:00Z'),
        ratings: [buildRating({ comment: '  Newer visit  ' }), buildRating({ comment: '   ' })],
      }),
    ])

    expect(summary?.comments.map((comment) => comment.text)).toEqual(['Newer visit', 'Older visit'])
    expect(summary?.lastVisitedAt).toEqual(new Date('2026-06-05T20:00:00Z'))
  })
})
