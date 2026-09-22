import { describe, expect, it } from 'vitest'
import { buildPersonalSlide } from '@/lib/yearInReview/buildPersonalSlide'
import { buildYearDraw, buildYearMember, buildYearRating, buildYearVisit } from '../support/yearInReviewFactories'

const viewer = buildYearMember({ displayName: 'Joana' })
const friend = buildYearMember({ displayName: 'Kaio' })

describe('personal slide', () => {
  it('is skipped for a member who rated nothing that year', () => {
    const visits = [buildYearVisit({ ratings: [buildYearRating(friend, 4)] })]

    expect(buildPersonalSlide(2026, viewer.memberId, visits, [], [viewer, friend])).toBeNull()
  })

  it('reports the member average, favorite place, strictness rank and draw wins', () => {
    const visits = [
      buildYearVisit({ restaurantName: 'Favorite', ratings: [buildYearRating(viewer, 4.5), buildYearRating(friend, 5)] }),
      buildYearVisit({ restaurantName: 'Other', ratings: [buildYearRating(viewer, 3), buildYearRating(friend, 4)] }),
      buildYearVisit({ restaurantName: 'Third', ratings: [buildYearRating(viewer, 3), buildYearRating(friend, 4)] }),
    ]

    const slide = buildPersonalSlide(2026, viewer.memberId, visits, [buildYearDraw(1, viewer)], [viewer, friend])

    expect(slide?.heroValue).toBe('3.5')
    expect(slide?.title).toBe('Você deu 3 notas em 2026')
    expect(slide?.entries.map((entry) => [entry.label, entry.value])).toEqual([
      ['no ranking de carrasco', '1º de 2'],
      ['seu lugar favorito', '4.5'],
      ['sorteios que você ganhou', '1'],
    ])
    expect(slide?.entries[1].detail).toBe('Favorite')
  })
})
