import { describe, expect, it } from 'vitest'
import { buildMoneyAndDrawsSlide, findLongestDroughtByMember } from '@/lib/yearInReview/buildMoneyAndDrawsSlide'
import { buildYearDraw, buildYearMember, buildYearVisit } from '../support/yearInReviewFactories'

const lucky = buildYearMember({ displayName: 'Hugo' })
const unlucky = buildYearMember({ displayName: 'Iris' })

describe('money and draws slide', () => {
  it('is skipped when there are neither bills nor draws', () => {
    expect(buildMoneyAndDrawsSlide([buildYearVisit()], [], [lucky])).toBeNull()
  })

  it('sums the registered bills and averages only over visits with a bill', () => {
    const slide = buildMoneyAndDrawsSlide(
      [
        buildYearVisit({ billAmount: 300, restaurantName: 'Pricey' }),
        buildYearVisit({ billAmount: 100 }),
        buildYearVisit({ billAmount: null }),
      ],
      [],
      [lucky],
    )

    expect(slide?.heroValue?.replace(/\s/g, ' ')).toBe('R$ 400')
    expect(slide?.entries[0].value.replace(/\s/g, ' ')).toBe('R$ 200')
    expect(slide?.entries[1].detail).toBe('Pricey')
  })

  it('leads with the draw winner when no bill was registered', () => {
    const slide = buildMoneyAndDrawsSlide(
      [buildYearVisit()],
      [buildYearDraw(1, lucky), buildYearDraw(2, lucky), buildYearDraw(3, unlucky)],
      [lucky, unlucky],
    )

    expect(slide?.title).toBe('Hugo foi quem mais ganhou o sorteio')
    expect(slide?.heroValue).toBe('2')
  })

  it('measures the longest run of rounds each member went without winning', () => {
    const draws = [1, 2, 3, 4, 5].map((roundNumber) => buildYearDraw(roundNumber, roundNumber === 3 ? unlucky : lucky))

    const droughts = findLongestDroughtByMember([...draws].reverse(), [lucky, unlucky])

    expect(droughts.map((entry) => [entry.member.displayName, entry.longestDrought])).toEqual([
      ['Hugo', 1],
      ['Iris', 2],
    ])
  })
})
