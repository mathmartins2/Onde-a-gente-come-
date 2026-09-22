import { ratingCriteria, type RatingCriterionKey } from '@/lib/scoring/configuration'
import { resolveVisitScore } from '@/lib/scoring/resolveVisitScore'

export type SummaryRating = {
  memberId: string
  authorName: string
  score: number
  comment: string | null
  criterionScores: Record<RatingCriterionKey, number | null>
}

export type SummaryVisit = {
  visitedAt: Date
  recommendedByMemberId: string | null
  legacyScore: number | null
  ratings: SummaryRating[]
}

export type RestaurantCriterionSummary = {
  key: RatingCriterionKey
  label: string
  score: number
}

export type RestaurantComment = {
  text: string
  authorName: string
  visitedAt: Date
}

export type RestaurantSummary = {
  overallScore: number
  scoredVisitCount: number
  lastVisitedAt: Date
  criteria: RestaurantCriterionSummary[]
  comments: RestaurantComment[]
}

const maximumCommentCount = 6

const averageOf = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

const summarizeCriteria = (ratings: SummaryRating[]) =>
  ratingCriteria.flatMap((criterion) => {
    const scores = ratings.flatMap((rating) => {
      const score = rating.criterionScores[criterion.key]
      return score === null ? [] : [score]
    })
    return scores.length === 0 ? [] : [{ key: criterion.key, label: criterion.label, score: averageOf(scores) }]
  })

const collectComments = (visits: SummaryVisit[]) =>
  [...visits]
    .sort((first, second) => second.visitedAt.getTime() - first.visitedAt.getTime())
    .flatMap((visit) =>
      visit.ratings.flatMap((rating) => {
        const text = rating.comment?.trim() ?? ''
        return text.length === 0 ? [] : [{ text, authorName: rating.authorName, visitedAt: visit.visitedAt }]
      }),
    )
    .slice(0, maximumCommentCount)

export const buildRestaurantSummary = (visits: SummaryVisit[]): RestaurantSummary | null => {
  const scoredVisits = visits.flatMap((visit) => {
    const score = resolveVisitScore(visit)
    return score === null ? [] : [{ visit, score }]
  })
  if (scoredVisits.length === 0) return null

  return {
    overallScore: averageOf(scoredVisits.map((scoredVisit) => scoredVisit.score)),
    scoredVisitCount: scoredVisits.length,
    lastVisitedAt: new Date(Math.max(...scoredVisits.map((scoredVisit) => scoredVisit.visit.visitedAt.getTime()))),
    criteria: summarizeCriteria(scoredVisits.flatMap((scoredVisit) => scoredVisit.visit.ratings)),
    comments: collectComments(scoredVisits.map((scoredVisit) => scoredVisit.visit)),
  }
}
