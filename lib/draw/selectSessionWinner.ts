import { calculateMemberWeight } from './calculateMemberWeight'
import { calculateBordaScores, type MemberPreference } from './calculateBordaScores'
import { selectWeightedIndex } from './selectWeightedIndex'

export type SessionPoolRestaurant = {
  restaurantId: string
  addedByMemberId: string
  putInRoundByMemberId: string
  revisitWeight: number
  isVetoed: boolean
  isPreviousWinner: boolean
}

export type SessionParticipant = {
  memberId: string
  roundsSinceLastWin: number
  qualityMultiplier: number
}

export type SessionContender = {
  restaurantId: string
  addedByMemberId: string
  bordaPoints: number
  ownerWeight: number
  revisitWeight: number
  weight: number
  chance: number
  supporters: number
  topChoiceCount: number
}

export type SessionDrawSelection = {
  restaurantId: string
  addedByMemberId: string
  fallbackRestaurantId: string | null
  fallbackMemberId: string | null
  contenders: SessionContender[]
}

export const buildSessionContenders = (
  pool: ReadonlyArray<SessionPoolRestaurant>,
  participants: ReadonlyArray<SessionParticipant>,
  preferences: ReadonlyArray<MemberPreference>,
): SessionContender[] => {
  const bordaByRestaurant = new Map(
    calculateBordaScores(preferences).map((entry) => [entry.restaurantId, entry]),
  )

  const participantById = new Map(
    participants.map((participant) => [participant.memberId, participant]),
  )

  const withoutBanned = pool.filter((entry) => !entry.isVetoed)
  const withoutPreviousWinner = withoutBanned.filter((entry) => !entry.isPreviousWinner)
  const eligiblePool =
    withoutPreviousWinner.length > 0 ? withoutPreviousWinner : withoutBanned

  const scored = eligiblePool.flatMap((entry) => {
      const borda = bordaByRestaurant.get(entry.restaurantId)
      if (!borda || borda.points <= 0) return []

      const owner =
        participantById.get(entry.addedByMemberId) ??
        participantById.get(entry.putInRoundByMemberId)
      if (!owner) return []

      const ownerWeight =
        calculateMemberWeight(owner.roundsSinceLastWin) * owner.qualityMultiplier
      const weight = borda.points * ownerWeight * entry.revisitWeight
      if (weight <= 0) return []

      return [
        {
          restaurantId: entry.restaurantId,
          addedByMemberId: owner.memberId,
          bordaPoints: borda.points,
          ownerWeight,
          revisitWeight: entry.revisitWeight,
          weight,
          chance: 0,
          supporters: borda.supporters,
          topChoiceCount: borda.topChoiceCount,
        },
    ]
  })

  const totalWeight = scored.reduce((sum, contender) => sum + contender.weight, 0)
  if (totalWeight <= 0) return scored

  return scored
    .map((contender) => ({ ...contender, chance: contender.weight / totalWeight }))
    .sort((first, second) => second.chance - first.chance)
}

export const selectSessionWinner = (
  pool: ReadonlyArray<SessionPoolRestaurant>,
  participants: ReadonlyArray<SessionParticipant>,
  preferences: ReadonlyArray<MemberPreference>,
  randomValueBetweenZeroAndOne: number,
  fallbackRandomValueBetweenZeroAndOne: number = randomValueBetweenZeroAndOne,
): SessionDrawSelection | null => {
  const contenders = buildSessionContenders(pool, participants, preferences)
  if (contenders.length === 0) return null

  const winnerIndex = selectWeightedIndex(
    contenders.map((contender) => contender.weight),
    randomValueBetweenZeroAndOne,
  )
  if (winnerIndex < 0) return null

  const winner = contenders[winnerIndex]
  const remaining = contenders.filter((contender) => contender.restaurantId !== winner.restaurantId)

  const fallbackIndex =
    remaining.length === 0
      ? -1
      : selectWeightedIndex(
          remaining.map((contender) => contender.weight),
          fallbackRandomValueBetweenZeroAndOne,
        )
  const fallback = fallbackIndex >= 0 ? remaining[fallbackIndex] : null

  return {
    restaurantId: winner.restaurantId,
    addedByMemberId: winner.addedByMemberId,
    fallbackRestaurantId: fallback?.restaurantId ?? null,
    fallbackMemberId: fallback?.addedByMemberId ?? null,
    contenders,
  }
}

export const applySessionOutcome = (
  participants: ReadonlyArray<SessionParticipant>,
  winnerMemberId: string,
) =>
  participants.map((participant) => {
    if (participant.memberId === winnerMemberId) {
      return { ...participant, roundsSinceLastWin: 0 }
    }
    return { ...participant, roundsSinceLastWin: participant.roundsSinceLastWin + 1 }
  })
