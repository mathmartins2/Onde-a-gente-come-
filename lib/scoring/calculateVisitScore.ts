import { ratingConfiguration } from './configuration'

export type VisitRatingInput = {
  memberId: string
  score: number
}

export const resolveRatingWeight = (memberId: string, recommendedByMemberId: string | null) => {
  if (memberId === recommendedByMemberId) return ratingConfiguration.recommenderWeight
  return ratingConfiguration.nonRecommenderWeight
}

export const calculateVisitScore = (
  ratingsGiven: ReadonlyArray<VisitRatingInput>,
  recommendedByMemberId: string | null,
) => {
  if (ratingsGiven.length === 0) return null

  const totals = ratingsGiven.reduce(
    (accumulator, rating) => {
      const weight = resolveRatingWeight(rating.memberId, recommendedByMemberId)
      return {
        weightedSum: accumulator.weightedSum + rating.score * weight,
        weightTotal: accumulator.weightTotal + weight,
      }
    },
    { weightedSum: 0, weightTotal: 0 },
  )

  if (totals.weightTotal === 0) return null
  return totals.weightedSum / totals.weightTotal
}
