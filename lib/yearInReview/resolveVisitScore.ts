import { resolveVisitScore } from '@/lib/scoring/resolveVisitScore'
import type { YearVisit } from './types'

export const listScoredVisits = (visits: YearVisit[]) =>
  visits.flatMap((visit) => {
    const score = resolveVisitScore(visit)
    return score === null ? [] : [{ visit, score }]
  })
