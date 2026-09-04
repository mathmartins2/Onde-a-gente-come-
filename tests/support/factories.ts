import { faker } from '@faker-js/faker'
import type { DrawCandidateMember } from '@/lib/draw/selectWinner'
import type { RestaurantRatingSummary } from '@/lib/scoring/calculateRestaurantRanking'

faker.seed(20260904)

export const buildMemberId = () => faker.string.uuid()

export const buildRestaurantName = () => faker.company.name()

export const buildDrawCandidate = (
  overrides: Partial<DrawCandidateMember> & { nominationCount?: number } = {},
): DrawCandidateMember => {
  const memberId = overrides.memberId ?? buildMemberId()
  const nominationCount = overrides.nominationCount ?? faker.number.int({ min: 1, max: 4 })

  return {
    memberId,
    roundsSinceLastWin: overrides.roundsSinceLastWin ?? 0,
    qualityMultiplier: overrides.qualityMultiplier ?? 1,
    nominations:
      overrides.nominations ??
      Array.from({ length: nominationCount }, () => ({
        nominationId: faker.string.uuid(),
        restaurantId: faker.string.uuid(),
        weight: 1,
      })),
  }
}

export const buildRatingSummary = (
  overrides: Partial<RestaurantRatingSummary> & { averageScore?: number; ratingCount?: number } = {},
): RestaurantRatingSummary => {
  const ratingCount = overrides.ratingCount ?? faker.number.int({ min: 1, max: 20 })
  const averageScore = overrides.averageScore ?? faker.number.float({ min: 1, max: 5, fractionDigits: 1 })

  return {
    restaurantId: overrides.restaurantId ?? faker.string.uuid(),
    name: overrides.name ?? buildRestaurantName(),
    visitCount: overrides.visitCount ?? faker.number.int({ min: 1, max: 5 }),
    weightedScoreSum: overrides.weightedScoreSum ?? averageScore * ratingCount,
    weightTotal: overrides.weightTotal ?? ratingCount,
  }
}
