import { describe, expect, it } from 'vitest'
import { buildSummarySlide } from '@/lib/yearInReview/buildSummarySlide'
import { buildYearVisit } from '../support/yearInReviewFactories'

describe('year summary slide', () => {
  it('counts each new restaurant once even when the group returned to it', () => {
    const firstVisit = buildYearVisit({ isFirstVisitEver: true })
    const returnVisit = buildYearVisit({ restaurantId: firstVisit.restaurantId, isFirstVisitEver: true })
    const knownPlace = buildYearVisit({ isFirstVisitEver: false })

    const slide = buildSummarySlide(2026, [firstVisit, returnVisit, knownPlace])

    expect(slide?.heroValue).toBe('3')
    expect(slide?.entries.find((entry) => entry.label === 'lugares novos pra mesa')?.value).toBe('1')
    expect(slide?.entries.find((entry) => entry.label === 'lugares diferentes')?.value).toBe('2')
  })

  it('names the cuisine that showed up the most', () => {
    const slide = buildSummarySlide(2026, [
      buildYearVisit({ cuisines: ['Japanese'] }),
      buildYearVisit({ cuisines: ['Japanese', 'Seafood'] }),
      buildYearVisit({ cuisines: ['Pizza'] }),
    ])

    const cuisineEntry = slide?.entries.find((entry) => entry.label === 'a culinária do ano')
    expect(cuisineEntry?.value).toBe('Japanese')
    expect(cuisineEntry?.detail).toBe('2 vezes')
  })

  it('leaves out the neighborhood count when no restaurant has one', () => {
    const slide = buildSummarySlide(2026, [buildYearVisit()])

    expect(slide?.entries.some((entry) => entry.label === 'bairros')).toBe(false)
  })
})
