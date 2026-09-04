import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import {
  calculateBordaScores,
  calculatePreferencePoints,
  type MemberPreference,
} from '@/lib/draw/calculateBordaScores'

const buildPreference = (memberId: string, rankedRestaurantIds: string[]): MemberPreference => ({
  memberId,
  rankedRestaurantIds,
})

describe('preference points', () => {
  it('gives more points to a higher position', () => {
    expect(calculatePreferencePoints(1, 3)).toBeGreaterThan(calculatePreferencePoints(2, 3))
    expect(calculatePreferencePoints(2, 3)).toBeGreaterThan(calculatePreferencePoints(3, 3))
  })

  it('gives every member the same total influence regardless of list length', () => {
    const shortListTotal = [1, 2].reduce(
      (total, position) => total + calculatePreferencePoints(position, 2),
      0,
    )
    const longListTotal = [1, 2, 3, 4, 5].reduce(
      (total, position) => total + calculatePreferencePoints(position, 5),
      0,
    )

    expect(shortListTotal).toBeCloseTo(1, 6)
    expect(longListTotal).toBeCloseTo(1, 6)
  })

  it('returns nothing for a position outside the list', () => {
    expect(calculatePreferencePoints(0, 3)).toBe(0)
    expect(calculatePreferencePoints(4, 3)).toBe(0)
    expect(calculatePreferencePoints(1, 0)).toBe(0)
  })
})

describe('borda scores', () => {
  it('ranks the restaurant the group collectively wants most on top', () => {
    const scores = calculateBordaScores([
      buildPreference('math', ['zen', 'entre-amigos', 'forneria']),
      buildPreference('romario', ['entre-amigos', 'zen', 'forneria']),
      buildPreference('vini', ['entre-amigos', 'forneria', 'zen']),
    ])

    expect(scores.at(0)?.restaurantId).toBe('entre-amigos')
  })

  it('lets a broadly liked second choice beat a divisive first choice', () => {
    const scores = calculateBordaScores([
      buildPreference('math', ['polemico', 'consenso']),
      buildPreference('romario', ['consenso', 'polemico']),
      buildPreference('vini', ['consenso', 'polemico']),
    ])

    expect(scores.at(0)?.restaurantId).toBe('consenso')
  })

  it('does not let one person outvote the group by listing more places', () => {
    const scores = calculateBordaScores([
      buildPreference('math', ['a', 'b', 'c', 'd', 'e', 'f']),
      buildPreference('romario', ['z']),
    ])

    const mathFavourite = scores.find((entry) => entry.restaurantId === 'a')
    const romarioOnly = scores.find((entry) => entry.restaurantId === 'z')

    expect(romarioOnly?.points).toBeGreaterThan(mathFavourite?.points ?? 0)
  })

  it('counts how many people backed each restaurant and how many put it first', () => {
    const scores = calculateBordaScores([
      buildPreference('math', ['zen', 'forneria']),
      buildPreference('romario', ['zen', 'forneria']),
      buildPreference('vini', ['forneria']),
    ])

    const zen = scores.find((entry) => entry.restaurantId === 'zen')
    const forneria = scores.find((entry) => entry.restaurantId === 'forneria')

    expect(zen?.supporters).toBe(2)
    expect(zen?.topChoiceCount).toBe(2)
    expect(forneria?.supporters).toBe(3)
    expect(forneria?.topChoiceCount).toBe(1)
  })

  it('returns an empty result when nobody ranked anything', () => {
    expect(calculateBordaScores([])).toEqual([])
    expect(calculateBordaScores([buildPreference('math', [])])).toEqual([])
  })

  it('keeps every restaurant that anyone ranked, with arbitrary member data', () => {
    const restaurantIds = Array.from({ length: 4 }, () => faker.string.uuid())
    const preferences = Array.from({ length: 3 }, () =>
      buildPreference(faker.string.uuid(), faker.helpers.shuffle([...restaurantIds])),
    )

    const scores = calculateBordaScores(preferences)
    expect(scores).toHaveLength(restaurantIds.length)
    expect(scores.every((entry) => entry.points > 0)).toBe(true)
  })
})
