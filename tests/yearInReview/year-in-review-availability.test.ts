import { describe, expect, it } from 'vitest'
import { buildYearInReview } from '@/lib/yearInReview/buildYearInReview'
import { buildYearMember, buildYearRating, buildYearVisit } from '../support/yearInReviewFactories'

const member = buildYearMember({ displayName: 'Ana' })

describe('year in review availability', () => {
  it('stays unavailable below the minimum number of outings', () => {
    const review = buildYearInReview({
      year: 2026,
      memberId: member.memberId,
      visits: [buildYearVisit(), buildYearVisit()],
      draws: [],
      members: [member],
    })

    expect(review.isAvailable).toBe(false)
    expect(review.slides).toEqual([])
  })

  it('becomes available at the minimum number of outings and skips slides without data', () => {
    const review = buildYearInReview({
      year: 2026,
      memberId: member.memberId,
      visits: [buildYearVisit(), buildYearVisit(), buildYearVisit()],
      draws: [],
      members: [member],
    })

    expect(review.isAvailable).toBe(true)
    expect(review.slides.map((slide) => slide.key)).toEqual(['summary'])
  })

  it('keeps the slide order from the group to the personal part', () => {
    const second = buildYearMember({ displayName: 'Bia' })
    const visits = [3, 4, 5].map((score) =>
      buildYearVisit({ ratings: [buildYearRating(member, score), buildYearRating(second, score - 1)], billAmount: 100 }),
    )

    const review = buildYearInReview({ year: 2026, memberId: member.memberId, visits, draws: [], members: [member, second] })

    expect(review.slides.map((slide) => slide.key)).toEqual([
      'summary',
      'bestAndWorst',
      'strictness',
      'moneyAndDraws',
      'personal',
    ])
  })
})
