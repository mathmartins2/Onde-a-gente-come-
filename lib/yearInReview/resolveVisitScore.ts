import { calculateVisitScore } from '@/lib/scoring/calculateVisitScore'
import type { YearVisit } from './types'

export const resolveVisitScore = (visit: YearVisit) => {
  if (visit.ratings.length > 0) return calculateVisitScore(visit.ratings, visit.recommendedByMemberId)
  return visit.legacyScore
}

export const listScoredVisits = (visits: YearVisit[]) =>
  visits.flatMap((visit) => {
    const score = resolveVisitScore(visit)
    return score === null ? [] : [{ visit, score }]
  })
