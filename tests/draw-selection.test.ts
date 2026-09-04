import { describe, expect, it } from 'vitest'
import {
  applyRoundOutcome,
  listEligibleMembers,
  selectWinner,
  type DrawCandidateMember,
} from '@/lib/draw/selectWinner'
import {
  calculateMemberWeight,
  defaultMemberWeightOptions,
  type MemberWeightOptions,
} from '@/lib/draw/calculateMemberWeight'

const pityDisabledOptions: MemberWeightOptions = {
  ...defaultMemberWeightOptions,
  increasePerRoundWithoutWinning: 0,
}

const createMember = (
  memberId: string,
  nominationCount: number,
  roundsSinceLastWin = 0,
): DrawCandidateMember => ({
  memberId,
  roundsSinceLastWin,
  qualityMultiplier: 1,
  nominations: Array.from({ length: nominationCount }, (_unused, index) => ({
    nominationId: `${memberId}-nomination-${index}`,
    restaurantId: `${memberId}-restaurant-${index}`,
    weight: 1,
  })),
})

const createSeededRandom = (seed: number) => {
  const state = { current: seed }
  return () => {
    state.current = (state.current * 1664525 + 1013904223) % 4294967296
    return state.current / 4294967296
  }
}

const simulateRounds = (
  initialMembers: ReadonlyArray<DrawCandidateMember>,
  rounds: number,
  weightOptions: MemberWeightOptions = defaultMemberWeightOptions,
) => {
  const random = createSeededRandom(20260904)

  return Array.from({ length: rounds }).reduce<{
    members: ReadonlyArray<DrawCandidateMember>
    winsByMember: Record<string, number>
    longestDrought: Record<string, number>
    roundsSinceWin: Record<string, number>
    longDroughtCount: number
  }>(
    (state) => {
      const selection = selectWinner(state.members, random(), random(), weightOptions)
      if (!selection) return state

      const roundsSinceWin = Object.fromEntries(
        Object.entries(state.roundsSinceWin).map(([memberId, value]) => [
          memberId,
          memberId === selection.memberId ? 0 : value + 1,
        ]),
      )

      const longestDrought = Object.fromEntries(
        Object.entries(roundsSinceWin).map(([memberId, value]) => [
          memberId,
          Math.max(state.longestDrought[memberId] ?? 0, value),
        ]),
      )

      const longDroughtCount =
        state.longDroughtCount +
        Object.values(roundsSinceWin).filter((value) => value > 5).length

      return {
        members: applyRoundOutcome(state.members, selection.memberId),
        winsByMember: {
          ...state.winsByMember,
          [selection.memberId]: (state.winsByMember[selection.memberId] ?? 0) + 1,
        },
        longestDrought,
        roundsSinceWin,
        longDroughtCount,
      }
    },
    {
      members: initialMembers,
      winsByMember: Object.fromEntries(initialMembers.map((member) => [member.memberId, 0])),
      longestDrought: Object.fromEntries(initialMembers.map((member) => [member.memberId, 0])),
      roundsSinceWin: Object.fromEntries(initialMembers.map((member) => [member.memberId, 0])),
      longDroughtCount: 0,
    },
  )
}

describe('draw selection', () => {
  it('never selects a member who nominated nothing', () => {
    const members = [createMember('math', 2), createMember('vini', 0), createMember('alucard', 1)]

    expect(listEligibleMembers(members).map((member) => member.memberId)).toEqual([
      'math',
      'alucard',
    ])

    const results = Array.from({ length: 500 }, (_unused, index) =>
      selectWinner(members, index / 500, 0.5),
    )

    expect(results.every((result) => result?.memberId !== 'vini')).toBe(true)
  })

  it('does not grow the waiting bonus of a member who nominated nothing', () => {
    const members = [createMember('math', 1), createMember('vini', 0, 3)]
    const afterRound = applyRoundOutcome(members, 'math')

    const vini = afterRound.find((member) => member.memberId === 'vini')
    expect(vini?.roundsSinceLastWin).toBe(3)
  })

  it('resets the winner and advances every other eligible member', () => {
    const members = [createMember('math', 1, 2), createMember('vini', 1, 1)]
    const afterRound = applyRoundOutcome(members, 'math')

    expect(afterRound.find((member) => member.memberId === 'math')?.roundsSinceLastWin).toBe(0)
    expect(afterRound.find((member) => member.memberId === 'vini')?.roundsSinceLastWin).toBe(2)
  })

  it('gives a member who nominated five places the same chance as one who nominated a single place', () => {
    const members = [createMember('math', 5), createMember('vini', 1)]
    const selection = selectWinner(members, 0.1, 0.1)

    const chances = Object.fromEntries(
      (selection?.snapshot ?? []).map((entry) => [entry.memberId, entry.chance]),
    )

    expect(chances.math).toBeCloseTo(0.5, 6)
    expect(chances.vini).toBeCloseTo(0.5, 6)
  })

  it('spreads wins roughly evenly across four equally active members', () => {
    const members = ['math', 'alucard', 'romario', 'vini'].map((memberId) =>
      createMember(memberId, 2),
    )
    const rounds = 10000
    const outcome = simulateRounds(members, rounds)

    const expectedShare = rounds / members.length
    Object.values(outcome.winsByMember).forEach((wins) => {
      expect(wins).toBeGreaterThan(expectedShare * 0.85)
      expect(wins).toBeLessThan(expectedShare * 1.15)
    })
  })

  it('shortens the longest drought compared to an unweighted draw', () => {
    const members = ['math', 'alucard', 'romario', 'vini'].map((memberId) =>
      createMember(memberId, 2),
    )

    const withPityTimer = simulateRounds(members, 10000)
    const withoutPityTimer = simulateRounds(members, 10000, pityDisabledOptions)

    const worstDrought = (droughts: Record<string, number>) =>
      Math.max(...Object.values(droughts))

    expect(worstDrought(withPityTimer.longestDrought)).toBeLessThan(
      worstDrought(withoutPityTimer.longestDrought),
    )
  })

  it('reduces how often anyone waits more than five rounds', () => {
    const members = ['math', 'alucard', 'romario', 'vini'].map((memberId) =>
      createMember(memberId, 2),
    )

    const withPityTimer = simulateRounds(members, 10000)
    const withoutPityTimer = simulateRounds(members, 10000, pityDisabledOptions)

    expect(withPityTimer.longDroughtCount).toBeLessThan(withoutPityTimer.longDroughtCount)
  })

  it('raises the weight of a member the longer they go without winning', () => {
    expect(calculateMemberWeight(0)).toBeLessThan(calculateMemberWeight(1))
    expect(calculateMemberWeight(1)).toBeLessThan(calculateMemberWeight(3))
  })

  it('caps the waiting bonus so a long drought never guarantees a win', () => {
    expect(calculateMemberWeight(100)).toBe(calculateMemberWeight(1000))
    expect(calculateMemberWeight(100)).toBeLessThanOrEqual(2.5)
  })
})
