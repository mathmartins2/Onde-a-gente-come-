import { describe, expect, it } from 'vitest'
import { formatHalfStarScore, roundToHalfStar } from '@/lib/scoring/roundToHalfStar'
import { buildBestAndWorstSlide } from '@/lib/yearInReview/buildBestAndWorstSlide'
import { buildStrictnessSlide } from '@/lib/yearInReview/buildStrictnessSlide'
import { buildYearMember, buildYearRating, buildYearVisit } from '../support/yearInReviewFactories'

const strictMember = buildYearMember({ displayName: 'Eva' })
const generousMember = buildYearMember({ displayName: 'Fabio' })

describe('half star score rounding', () => {
  it.each([
    [3.13, '3'],
    [3.27, '3.5'],
    [3.75, '4'],
    [4.8, '5'],
    [0.2, '0'],
    [5, '5'],
  ])('shows %s as %s', (score, expectedText) => {
    expect(formatHalfStarScore(score)).toBe(expectedText)
  })

  it('rounds to the nearest half star', () => {
    expect(roundToHalfStar(2.71)).toBe(2.5)
  })
})

describe('year in review score display', () => {
  it('shows best and worst scores as half stars and colours them by the shown value', () => {
    const best = buildYearVisit({ legacyScore: 4.83 })
    const worst = buildYearVisit({ legacyScore: 2.71 })

    const slide = buildBestAndWorstSlide([best, worst], [])

    expect(slide?.heroValue).toBe('5')
    expect(slide?.heroScore).toBe(5)
    expect(slide?.entries.map((entry) => [entry.value, entry.valueScore])).toEqual([
      ['5', 5],
      ['2.5', 2.5],
    ])
  })

  it('never writes a two decimal average inside the strictness quote', () => {
    const visits = [3.13, 3.27, 3.27].map((strictScore) =>
      buildYearVisit({
        ratings: [buildYearRating(strictMember, strictScore), buildYearRating(generousMember, 4.24)],
      }),
    )

    const slide = buildStrictnessSlide(visits, [strictMember, generousMember])

    expect(slide?.heroValue).toBe('3')
    expect(slide?.entries.map((entry) => entry.value)).toEqual(['3', '4'])
    expect(slide?.quote?.text).toBe('Fabio deu em média 4. Coração mole.')
  })

  it('links the slides that feature a restaurant to that restaurant', () => {
    const best = buildYearVisit({ legacyScore: 4.5 })
    const worst = buildYearVisit({ legacyScore: 2 })

    expect(buildBestAndWorstSlide([best, worst], [])?.restaurantId).toBe(best.restaurantId)
    expect(buildStrictnessSlide([best], [strictMember, generousMember])?.restaurantId ?? null).toBeNull()
  })
})
