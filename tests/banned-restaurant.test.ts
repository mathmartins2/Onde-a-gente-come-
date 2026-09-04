import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { resolveBannedRestaurant } from '@/lib/draw/resolveBannedRestaurant'

const vote = (memberId: string, restaurantId: string) => ({ memberId, restaurantId })

describe('banned restaurant', () => {
  it('bans nothing when nobody voted', () => {
    const outcome = resolveBannedRestaurant([])
    expect(outcome.bannedRestaurantId).toBeNull()
    expect(outcome.isTied).toBe(false)
  })

  it('bans the single most voted restaurant', () => {
    const outcome = resolveBannedRestaurant([
      vote('math', 'outback'),
      vote('romario', 'outback'),
      vote('vini', 'zen'),
    ])

    expect(outcome.bannedRestaurantId).toBe('outback')
  })

  it('bans only one restaurant even when several got votes', () => {
    const outcome = resolveBannedRestaurant([
      vote('math', 'outback'),
      vote('romario', 'outback'),
      vote('vini', 'zen'),
      vote('alucard', 'forneria'),
    ])

    expect(outcome.bannedRestaurantId).toBe('outback')
    expect(outcome.tally).toHaveLength(3)
  })

  it('bans nothing when the leaders are tied', () => {
    const outcome = resolveBannedRestaurant([
      vote('math', 'outback'),
      vote('romario', 'outback'),
      vote('vini', 'zen'),
      vote('alucard', 'zen'),
    ])

    expect(outcome.bannedRestaurantId).toBeNull()
    expect(outcome.isTied).toBe(true)
  })

  it('bans with a single vote when it is the only one cast', () => {
    const outcome = resolveBannedRestaurant([vote('math', 'outback')])
    expect(outcome.bannedRestaurantId).toBe('outback')
  })

  it('reports the tally ordered from most to least voted', () => {
    const outcome = resolveBannedRestaurant([
      vote('a', 'x'),
      vote('b', 'x'),
      vote('c', 'x'),
      vote('d', 'y'),
      vote('e', 'y'),
      vote('f', 'z'),
    ])

    expect(outcome.tally.map((entry) => entry.restaurantId)).toEqual(['x', 'y', 'z'])
    expect(outcome.tally.map((entry) => entry.votes)).toEqual([3, 2, 1])
  })

  it('never bans more than one restaurant for arbitrary vote sets', () => {
    Array.from({ length: 30 }).forEach(() => {
      const restaurantIds = Array.from({ length: 4 }, () => faker.string.uuid())
      const votes = Array.from({ length: faker.number.int({ min: 0, max: 8 }) }, () =>
        vote(faker.string.uuid(), faker.helpers.arrayElement(restaurantIds)),
      )

      const outcome = resolveBannedRestaurant(votes)
      const bannedCount = outcome.bannedRestaurantId === null ? 0 : 1
      expect(bannedCount).toBeLessThanOrEqual(1)
    })
  })
})
