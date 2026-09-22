import { calculateVisitScore, type VisitRatingInput } from './calculateVisitScore'

export type ScorableVisit = {
  ratings: ReadonlyArray<VisitRatingInput>
  recommendedByMemberId: string | null
  legacyScore: number | null
}

export const resolveVisitScore = (visit: ScorableVisit) => {
  if (visit.ratings.length > 0) return calculateVisitScore(visit.ratings, visit.recommendedByMemberId)
  return visit.legacyScore
}
