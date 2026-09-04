import { drawConfiguration } from '@/lib/scoring/configuration'

export type QuorumStatus = {
  presentCount: number
  totalMemberCount: number
  requiredCount: number
  hasQuorum: boolean
}

export const checkQuorum = (
  presentCount: number,
  totalMemberCount: number,
  minimumRatio: number = drawConfiguration.minimumQuorumRatio,
): QuorumStatus => {
  const requiredCount = Math.ceil(totalMemberCount * minimumRatio)

  return {
    presentCount,
    totalMemberCount,
    requiredCount,
    hasQuorum: totalMemberCount > 0 && presentCount >= requiredCount,
  }
}
