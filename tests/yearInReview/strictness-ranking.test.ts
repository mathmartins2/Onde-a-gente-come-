import { describe, expect, it } from 'vitest'
import { buildStrictnessSlide } from '@/lib/yearInReview/buildStrictnessSlide'
import { buildYearMember, buildYearRating, buildYearVisit } from '../support/yearInReviewFactories'

const strict = buildYearMember({ displayName: 'Eva' })
const generous = buildYearMember({ displayName: 'Fabio' })
const occasional = buildYearMember({ displayName: 'Gil' })

const visitsWith = (scoresByMember: Array<[typeof strict, number[]]>) =>
  [0, 1, 2].map((visitIndex) =>
    buildYearVisit({
      ratings: scoresByMember.flatMap(([member, scores]) =>
        scores[visitIndex] === undefined ? [] : [buildYearRating(member, scores[visitIndex])],
      ),
    }),
  )

describe('strictness slide', () => {
  it('orders members from the strictest to the most generous', () => {
    const slide = buildStrictnessSlide(
      visitsWith([
        [generous, [5, 4.5, 5]],
        [strict, [2, 3, 2.5]],
      ]),
      [generous, strict],
    )

    expect(slide?.title).toBe('Eva é o carrasco da mesa')
    expect(slide?.entries.map((entry) => entry.label)).toEqual(['Eva', 'Fabio'])
    expect(slide?.entries.map((entry) => entry.detail)).toEqual(['o mais exigente', 'o mais bonzinho'])
  })

  it('ignores members with too few ratings to judge', () => {
    const slide = buildStrictnessSlide(
      visitsWith([
        [generous, [5, 4.5, 5]],
        [strict, [2, 3, 2.5]],
        [occasional, [0.5]],
      ]),
      [generous, strict, occasional],
    )

    expect(slide?.entries.map((entry) => entry.label)).toEqual(['Eva', 'Fabio'])
  })

  it('is skipped when fewer than two members qualify', () => {
    expect(buildStrictnessSlide(visitsWith([[strict, [2, 3, 2.5]]]), [strict, occasional])).toBeNull()
  })
})
