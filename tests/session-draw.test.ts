import { describe, expect, it } from 'vitest'
import {
  applySessionOutcome,
  buildSessionContenders,
  selectSessionWinner,
  type SessionParticipant,
  type SessionPoolRestaurant,
} from '@/lib/draw/selectSessionWinner'

const participant = (
  memberId: string,
  roundsSinceLastWin = 0,
  qualityMultiplier = 1,
): SessionParticipant => ({ memberId, roundsSinceLastWin, qualityMultiplier })

const poolEntry = (
  restaurantId: string,
  addedByMemberId: string,
  revisitWeight = 1,
  isVetoed = false,
): SessionPoolRestaurant => ({
  restaurantId,
  addedByMemberId,
  putInRoundByMemberId: addedByMemberId,
  revisitWeight,
  isVetoed,
})

const chanceOf = (contenders: ReturnType<typeof buildSessionContenders>, restaurantId: string) =>
  contenders.find((contender) => contender.restaurantId === restaurantId)?.chance ?? 0

describe('session draw combines every rule', () => {
  it('favours the restaurant the group ranked highest', () => {
    const contenders = buildSessionContenders(
      [poolEntry('zen', 'math'), poolEntry('entre-amigos', 'romario')],
      [participant('math'), participant('romario'), participant('vini')],
      [
        { memberId: 'math', rankedRestaurantIds: ['zen', 'entre-amigos'] },
        { memberId: 'romario', rankedRestaurantIds: ['entre-amigos', 'zen'] },
        { memberId: 'vini', rankedRestaurantIds: ['entre-amigos', 'zen'] },
      ],
    )

    expect(chanceOf(contenders, 'entre-amigos')).toBeGreaterThan(chanceOf(contenders, 'zen'))
  })

  it('still boosts someone who has gone many rounds without winning', () => {
    const evenPreferences = [
      { memberId: 'math', rankedRestaurantIds: ['zen', 'entre-amigos'] },
      { memberId: 'romario', rankedRestaurantIds: ['entre-amigos', 'zen'] },
    ]

    const balanced = buildSessionContenders(
      [poolEntry('zen', 'math'), poolEntry('entre-amigos', 'romario')],
      [participant('math'), participant('romario')],
      evenPreferences,
    )
    const romarioWaiting = buildSessionContenders(
      [poolEntry('zen', 'math'), poolEntry('entre-amigos', 'romario')],
      [participant('math'), participant('romario', 4)],
      evenPreferences,
    )

    expect(chanceOf(romarioWaiting, 'entre-amigos')).toBeGreaterThan(
      chanceOf(balanced, 'entre-amigos'),
    )
  })

  it('still punishes a restaurant the group visited recently', () => {
    const contenders = buildSessionContenders(
      [poolEntry('ja-fomos', 'math', 0.2), poolEntry('novo', 'romario', 1)],
      [participant('math'), participant('romario')],
      [
        { memberId: 'math', rankedRestaurantIds: ['ja-fomos', 'novo'] },
        { memberId: 'romario', rankedRestaurantIds: ['ja-fomos', 'novo'] },
      ],
    )

    expect(chanceOf(contenders, 'novo')).toBeGreaterThan(chanceOf(contenders, 'ja-fomos'))
  })

  it('still rewards whoever has been recommending well', () => {
    const preferences = [
      { memberId: 'math', rankedRestaurantIds: ['zen', 'entre-amigos'] },
      { memberId: 'romario', rankedRestaurantIds: ['entre-amigos', 'zen'] },
    ]

    const neutral = buildSessionContenders(
      [poolEntry('zen', 'math'), poolEntry('entre-amigos', 'romario')],
      [participant('math'), participant('romario')],
      preferences,
    )
    const romarioTrusted = buildSessionContenders(
      [poolEntry('zen', 'math'), poolEntry('entre-amigos', 'romario')],
      [participant('math'), participant('romario', 0, 1.15)],
      preferences,
    )

    expect(chanceOf(romarioTrusted, 'entre-amigos')).toBeGreaterThan(
      chanceOf(neutral, 'entre-amigos'),
    )
  })

  it('removes a vetoed restaurant from the round entirely', () => {
    const contenders = buildSessionContenders(
      [poolEntry('vetado', 'math', 1, true), poolEntry('ok', 'romario')],
      [participant('math'), participant('romario')],
      [
        { memberId: 'math', rankedRestaurantIds: ['vetado', 'ok'] },
        { memberId: 'romario', rankedRestaurantIds: ['vetado', 'ok'] },
      ],
    )

    expect(contenders.map((contender) => contender.restaurantId)).toEqual(['ok'])
  })

  it('ignores a restaurant that nobody ranked', () => {
    const contenders = buildSessionContenders(
      [poolEntry('ninguem-quer', 'math'), poolEntry('querido', 'romario')],
      [participant('math'), participant('romario')],
      [{ memberId: 'romario', rankedRestaurantIds: ['querido'] }],
    )

    expect(contenders.map((contender) => contender.restaurantId)).toEqual(['querido'])
  })

  it('keeps a restaurant whose owner is absent, using the weight of whoever brought it', () => {
    const contenders = buildSessionContenders(
      [
        {
          restaurantId: 'do-ausente',
          addedByMemberId: 'ausente',
          putInRoundByMemberId: 'math',
          revisitWeight: 1,
          isVetoed: false,
        },
        poolEntry('valido', 'math'),
      ],
      [participant('math')],
      [{ memberId: 'math', rankedRestaurantIds: ['do-ausente', 'valido'] }],
    )

    expect(contenders.map((contender) => contender.restaurantId).sort()).toEqual([
      'do-ausente',
      'valido',
    ])
    expect(
      contenders.find((contender) => contender.restaurantId === 'do-ausente')?.addedByMemberId,
    ).toBe('math')
  })

  it('ignores a restaurant when neither the owner nor who brought it is in the session', () => {
    const contenders = buildSessionContenders(
      [
        {
          restaurantId: 'orfao',
          addedByMemberId: 'ausente',
          putInRoundByMemberId: 'tambem-ausente',
          revisitWeight: 1,
          isVetoed: false,
        },
        poolEntry('valido', 'math'),
      ],
      [participant('math')],
      [{ memberId: 'math', rankedRestaurantIds: ['orfao', 'valido'] }],
    )

    expect(contenders.map((contender) => contender.restaurantId)).toEqual(['valido'])
  })

  it('returns nothing when every restaurant was vetoed', () => {
    const selection = selectSessionWinner(
      [poolEntry('a', 'math', 1, true)],
      [participant('math')],
      [{ memberId: 'math', rankedRestaurantIds: ['a'] }],
      0.5,
    )

    expect(selection).toBeNull()
  })

  it('publishes chances that add up to one so the group can audit the draw', () => {
    const contenders = buildSessionContenders(
      [poolEntry('a', 'math'), poolEntry('b', 'romario'), poolEntry('c', 'vini')],
      [participant('math'), participant('romario', 2), participant('vini')],
      [
        { memberId: 'math', rankedRestaurantIds: ['a', 'b', 'c'] },
        { memberId: 'romario', rankedRestaurantIds: ['b', 'c', 'a'] },
        { memberId: 'vini', rankedRestaurantIds: ['c', 'a', 'b'] },
      ],
    )

    const total = contenders.reduce((sum, contender) => sum + contender.chance, 0)
    expect(total).toBeCloseTo(1, 6)
  })

  it('resets the winner and advances everyone else who took part', () => {
    const after = applySessionOutcome(
      [participant('math', 3), participant('romario', 1)],
      'math',
    )

    expect(after.find((entry) => entry.memberId === 'math')?.roundsSinceLastWin).toBe(0)
    expect(after.find((entry) => entry.memberId === 'romario')?.roundsSinceLastWin).toBe(2)
  })
})
