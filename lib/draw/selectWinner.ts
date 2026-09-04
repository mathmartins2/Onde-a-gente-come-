import {
  calculateMemberWeight,
  defaultMemberWeightOptions,
  type MemberWeightOptions,
} from './calculateMemberWeight'
import { selectWeightedIndex } from './selectWeightedIndex'

export type DrawCandidateNomination = {
  nominationId: string
  restaurantId: string
  weight: number
}

export type DrawCandidateMember = {
  memberId: string
  roundsSinceLastWin: number
  qualityMultiplier: number
  nominations: ReadonlyArray<DrawCandidateNomination>
}

export type DrawSelection = {
  memberId: string
  nominationId: string
  restaurantId: string
  snapshot: ReadonlyArray<{ memberId: string; weight: number; chance: number }>
}

export const listEligibleMembers = (members: ReadonlyArray<DrawCandidateMember>) =>
  members.filter((member) => member.nominations.length > 0)

export const selectWinner = (
  members: ReadonlyArray<DrawCandidateMember>,
  memberRandomValue: number,
  nominationRandomValue: number,
  weightOptions: MemberWeightOptions = defaultMemberWeightOptions,
): DrawSelection | null => {
  const eligibleMembers = listEligibleMembers(members)
  if (eligibleMembers.length === 0) return null

  const memberWeights = eligibleMembers.map(
    (member) =>
      calculateMemberWeight(member.roundsSinceLastWin, weightOptions) * member.qualityMultiplier,
  )
  const totalMemberWeight = memberWeights.reduce((sum, weight) => sum + weight, 0)

  const snapshot = eligibleMembers.map((member, index) => ({
    memberId: member.memberId,
    weight: memberWeights[index],
    chance: memberWeights[index] / totalMemberWeight,
  }))

  const winnerIndex = selectWeightedIndex(memberWeights, memberRandomValue)
  if (winnerIndex < 0) return null

  const winner = eligibleMembers[winnerIndex]
  const nominationWeights = winner.nominations.map((nomination) => nomination.weight)
  const nominationIndex = selectWeightedIndex(nominationWeights, nominationRandomValue)
  if (nominationIndex < 0) return null

  const selectedNomination = winner.nominations[nominationIndex]

  return {
    memberId: winner.memberId,
    nominationId: selectedNomination.nominationId,
    restaurantId: selectedNomination.restaurantId,
    snapshot,
  }
}

export const applyRoundOutcome = (
  members: ReadonlyArray<DrawCandidateMember>,
  winnerMemberId: string,
) => {
  const eligibleMemberIds = new Set(
    listEligibleMembers(members).map((member) => member.memberId),
  )

  return members.map((member) => {
    if (member.memberId === winnerMemberId) return { ...member, roundsSinceLastWin: 0 }
    if (!eligibleMemberIds.has(member.memberId)) return member
    return { ...member, roundsSinceLastWin: member.roundsSinceLastWin + 1 }
  })
}
