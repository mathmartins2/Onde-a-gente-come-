import { describe, expect, it } from 'vitest'
import { pickCurrentRound } from '@/lib/session/pickCurrentRound'

const buildRound = (roundNumber: number, overrides: { visitId?: string | null; isRevealed?: boolean } = {}) => ({
  roundNumber,
  visitId: `visit-${roundNumber}`,
  isRevealed: true,
  ...overrides,
})

describe('current round on the home screen', () => {
  it('treats the newest drawn round that is still waiting for scores as the current one', () => {
    const rounds = [buildRound(2, { isRevealed: false }), buildRound(1)]

    const { currentRound, lastRevealedRound } = pickCurrentRound(rounds)

    expect(currentRound?.roundNumber).toBe(2)
    expect(lastRevealedRound?.roundNumber).toBe(1)
  })

  it('has no current round once every round is revealed', () => {
    const { currentRound, lastRevealedRound } = pickCurrentRound([buildRound(3), buildRound(2)])

    expect(currentRound).toBeNull()
    expect(lastRevealedRound?.roundNumber).toBe(3)
  })

  it('ignores draws that never became a visit', () => {
    const { currentRound } = pickCurrentRound([buildRound(4, { visitId: null, isRevealed: false }), buildRound(3)])

    expect(currentRound).toBeNull()
  })
})
