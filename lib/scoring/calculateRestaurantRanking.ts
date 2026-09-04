import { rankingConfiguration } from './configuration'

export type RestaurantRatingSummary = {
  restaurantId: string
  name: string
  visitCount: number
  weightedScoreSum: number
  weightTotal: number
}

export const calculateGlobalAverage = (
  summaries: ReadonlyArray<RestaurantRatingSummary>,
) => {
  const totals = summaries.reduce(
    (accumulator, summary) => ({
      weightedScoreSum: accumulator.weightedScoreSum + summary.weightedScoreSum,
      weightTotal: accumulator.weightTotal + summary.weightTotal,
    }),
    { weightedScoreSum: 0, weightTotal: 0 },
  )

  if (totals.weightTotal === 0) return rankingConfiguration.bayesianPriorScore
  return totals.weightedScoreSum / totals.weightTotal
}

export const calculateRestaurantRanking = (
  summaries: ReadonlyArray<RestaurantRatingSummary>,
) => {
  const priorScore = rankingConfiguration.bayesianPriorScore
  const confidence = rankingConfiguration.bayesianConfidenceConstant

  const ranked = summaries.map((summary) => {
    const ratingCount = summary.weightTotal
    const averageScore = ratingCount === 0 ? null : summary.weightedScoreSum / ratingCount
    const bayesianScore =
      (confidence * priorScore + summary.weightedScoreSum) / (confidence + ratingCount)

    return {
      restaurantId: summary.restaurantId,
      name: summary.name,
      visitCount: summary.visitCount,
      averageScore,
      bayesianScore,
    }
  })

  return [...ranked].sort((first, second) => {
    if (second.bayesianScore !== first.bayesianScore) {
      return second.bayesianScore - first.bayesianScore
    }
    return second.visitCount - first.visitCount
  })
}
