import { describe, expect, it } from 'vitest'
import { buildBestAndWorstSlide } from '@/lib/yearInReview/buildBestAndWorstSlide'
import { buildYearMember, buildYearRating, buildYearVisit } from '../support/yearInReviewFactories'

const harsh = buildYearMember({ displayName: 'Caio' })
const kind = buildYearMember({ displayName: 'Duda' })

describe('best and worst slide', () => {
  it('needs at least two scored visits', () => {
    expect(buildBestAndWorstSlide([buildYearVisit({ legacyScore: 4 }), buildYearVisit()], [harsh])).toBeNull()
  })

  it('ranks visits using legacy scores when there are no individual ratings', () => {
    const imported = buildYearVisit({ restaurantName: 'Imported Place', legacyScore: 4.8 })
    const rated = buildYearVisit({
      restaurantName: 'Rated Place',
      ratings: [buildYearRating(harsh, 3), buildYearRating(kind, 3)],
    })

    const slide = buildBestAndWorstSlide([imported, rated], [harsh, kind])

    expect(slide?.title).toBe('Imported Place levou o ano')
    expect(slide?.entries[1].detail).toContain('Rated Place')
    expect(slide?.heroScore).toBe(5)
  })

  it('quotes the harshest comment left on the worst visit', () => {
    const worst = buildYearVisit({
      ratings: [buildYearRating(harsh, 1, 'Cold food'), buildYearRating(kind, 3, 'It was fine')],
    })
    const best = buildYearVisit({ ratings: [buildYearRating(harsh, 5), buildYearRating(kind, 5)] })

    const slide = buildBestAndWorstSlide([worst, best], [harsh, kind])

    expect(slide?.quote).toEqual({ text: 'Cold food', author: 'Caio' })
  })

  it('falls back to the best restaurant photo when nobody photographed a dish', () => {
    const best = buildYearVisit({ legacyScore: 5, photoImageKey: 'best-photo' })
    const worst = buildYearVisit({ legacyScore: 2, photoImageKey: 'worst-photo' })

    expect(buildBestAndWorstSlide([worst, best], [])?.photoImageKey).toBe('best-photo')
  })
})
