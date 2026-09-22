import { yearInReviewConfiguration } from './configuration'
import { formatScore, formatShortDay, roundScore } from './formatters'
import { listScoredVisits } from './resolveVisitScore'
import { buildSlideEntry } from './slideEntry'
import type { YearMember, YearSlide, YearVisit } from './types'

const findExtremeQuote = (visit: YearVisit, members: YearMember[], preferHighest: boolean) => {
  const commentedRating = visit.ratings
    .filter((rating) => rating.comment && rating.comment.trim().length > 0)
    .sort((first, second) => (preferHighest ? second.score - first.score : first.score - second.score))
    .at(0)
  if (!commentedRating?.comment) return null

  const author = members.find((member) => member.memberId === commentedRating.memberId)
  return { text: commentedRating.comment.trim(), author: author?.displayName ?? 'alguém da mesa' }
}

export const buildBestAndWorstSlide = (visits: YearVisit[], members: YearMember[]): YearSlide | null => {
  const scoredVisits = listScoredVisits(visits)
  if (scoredVisits.length < yearInReviewConfiguration.minimumScoredVisitsForBestAndWorst) return null

  const ordered = [...scoredVisits].sort(
    (first, second) => second.score - first.score || first.visit.visitedAt.getTime() - second.visit.visitedAt.getTime(),
  )
  const best = ordered[0]
  const worst = ordered[ordered.length - 1]

  return {
    key: 'bestAndWorst',
    eyebrow: 'o melhor e o pior',
    title: `${best.visit.restaurantName} levou o ano`,
    heroValue: formatScore(best.score),
    heroCaption: `melhor nota · ${formatShortDay(best.visit.visitedAt)}`,
    heroScore: roundScore(best.score),
    entries: [
      buildSlideEntry({
        label: 'melhor nota',
        value: formatScore(best.score),
        detail: best.visit.restaurantName,
        valueScore: roundScore(best.score),
      }),
      buildSlideEntry({
        label: 'pior nota',
        value: formatScore(worst.score),
        detail: `${worst.visit.restaurantName} · ${formatShortDay(worst.visit.visitedAt)}`,
        valueScore: roundScore(worst.score),
      }),
    ],
    quote: findExtremeQuote(worst.visit, members, false) ?? findExtremeQuote(best.visit, members, true),
    photoImageKey: best.visit.photoImageKey,
    avatar: null,
    restaurantId: best.visit.restaurantId,
  }
}
