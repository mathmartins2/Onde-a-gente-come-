import { drawConfiguration } from '@/lib/scoring/configuration'

export type MemberWeightOptions = {
  baseWeight: number
  increasePerRoundWithoutWinning: number
  minimumWeight: number
  maximumWeight: number
}

export const defaultMemberWeightOptions: MemberWeightOptions = {
  baseWeight: drawConfiguration.baseMemberWeight,
  increasePerRoundWithoutWinning: drawConfiguration.weightIncreasePerRoundWithoutWinning,
  minimumWeight: drawConfiguration.minimumMemberWeight,
  maximumWeight: drawConfiguration.maximumMemberWeight,
}

export const calculateMemberWeight = (
  roundsSinceLastWin: number,
  options: MemberWeightOptions = defaultMemberWeightOptions,
) => {
  const rawWeight = options.baseWeight + roundsSinceLastWin * options.increasePerRoundWithoutWinning
  return Math.min(Math.max(rawWeight, options.minimumWeight), options.maximumWeight)
}

export const calculateSelectionChances = (
  membersWithRounds: ReadonlyArray<{ memberId: string; roundsSinceLastWin: number }>,
  options: MemberWeightOptions = defaultMemberWeightOptions,
) => {
  const weighted = membersWithRounds.map((member) => ({
    memberId: member.memberId,
    weight: calculateMemberWeight(member.roundsSinceLastWin, options),
  }))

  const totalWeight = weighted.reduce((sum, member) => sum + member.weight, 0)
  if (totalWeight === 0) return weighted.map((member) => ({ ...member, chance: 0 }))

  return weighted.map((member) => ({ ...member, chance: member.weight / totalWeight }))
}
