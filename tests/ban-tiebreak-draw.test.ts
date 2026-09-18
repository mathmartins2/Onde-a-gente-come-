import { describe, expect, it } from 'vitest'
import { resolveBannedRestaurant } from '@/lib/draw/resolveBannedRestaurant'

const vote = (memberId: string, restaurantId: string | null) => ({ memberId, restaurantId })

const tiedVotes = [
  vote('math', 'outback'),
  vote('romario', 'outback'),
  vote('vini', 'zen'),
  vote('alucard', 'zen'),
]

describe('ban tiebreak', () => {
  it('always bans someone when a tiebreak fraction is given', () => {
    Array.from({ length: 50 }, (_unused, index) => index / 50).forEach((fraction) => {
      const outcome = resolveBannedRestaurant(tiedVotes, fraction)
      expect(outcome.bannedRestaurantId).not.toBeNull()
      expect(outcome.wasDecidedByTiebreak).toBe(true)
    })
  })

  it('can reach every tied restaurant across the fraction range', () => {
    const drawnRestaurantIds = new Set(
      Array.from({ length: 50 }, (_unused, index) =>
        resolveBannedRestaurant(tiedVotes, index / 50).bannedRestaurantId,
      ),
    )

    expect([...drawnRestaurantIds].sort()).toEqual(['outback', 'zen'])
  })

  it('draws the same restaurant for the same fraction', () => {
    const first = resolveBannedRestaurant(tiedVotes, 0.42)
    const second = resolveBannedRestaurant(tiedVotes, 0.42)

    expect(first.bannedRestaurantId).toBe(second.bannedRestaurantId)
  })

  it('keeps the outright leader when there is no tie to break', () => {
    const outcome = resolveBannedRestaurant(
      [vote('math', 'outback'), vote('romario', 'outback'), vote('vini', 'zen')],
      0.99,
    )

    expect(outcome.bannedRestaurantId).toBe('outback')
    expect(outcome.wasDecidedByTiebreak).toBe(false)
  })

  it('bans the leader chosen by the voters when abstentions are the majority', () => {
    const outcome = resolveBannedRestaurant([
      vote('math', null),
      vote('romario', null),
      vote('vini', 'zen'),
    ])

    expect(outcome.bannedRestaurantId).toBe('zen')
    expect(outcome.tally).toHaveLength(1)
  })

  it('bans nobody when everyone abstains', () => {
    const outcome = resolveBannedRestaurant(
      [vote('math', null), vote('romario', null), vote('vini', null)],
      0.5,
    )

    expect(outcome.bannedRestaurantId).toBeNull()
    expect(outcome.wasDecidedByTiebreak).toBe(false)
  })

  it('breaks a tie between three restaurants without leaving it undecided', () => {
    const outcome = resolveBannedRestaurant(
      [vote('math', 'outback'), vote('romario', 'zen'), vote('vini', 'forneria')],
      0.7,
    )

    expect(outcome.tiedRestaurantIds).toEqual(['forneria', 'outback', 'zen'])
    expect(outcome.tiedRestaurantIds).toContain(outcome.bannedRestaurantId)
  })
})
