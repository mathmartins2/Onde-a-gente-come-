import { drawConfiguration } from '@/lib/scoring/configuration'

const millisecondsPerMonth = 1000 * 60 * 60 * 24 * 30.4375

type NominationVisitHistory = {
  visitCount: number
  lastVisitedAt: Date | null
}

export const calculateNominationWeight = (
  history: NominationVisitHistory,
  now: Date = new Date(),
) => {
  if (history.visitCount <= 0) return 1
  if (!history.lastVisitedAt) return drawConfiguration.recentlyVisitedPenalty

  const monthsSinceLastVisit =
    (now.getTime() - history.lastVisitedAt.getTime()) / millisecondsPerMonth

  const recovery = Math.min(
    Math.max(monthsSinceLastVisit / drawConfiguration.monthsToFullyRecoverFromVisit, 0),
    1,
  )

  const recencyWeight =
    drawConfiguration.recentlyVisitedPenalty +
    (1 - drawConfiguration.recentlyVisitedPenalty) * recovery

  return recencyWeight / history.visitCount
}
