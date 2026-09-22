import { eq, inArray } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { loadStoryImageDataUrl } from '@/lib/share/loadStoryImage'
import type { VisitStoryData } from '@/lib/share/VisitStory'
import { formatLongDayInAppTimeZone } from '@/lib/utilities/appTimeZone'
import { loadRevealedVisit } from './ratingService'

type VisitStoryOutcome =
  | { status: 'missing' }
  | { status: 'hidden' }
  | { status: 'ready'; data: VisitStoryData }

export const loadVisitStory = async (visitId: string): Promise<VisitStoryOutcome> => {
  const visitRows = await database
    .select({
      restaurantName: schema.restaurants.name,
      neighborhood: schema.restaurants.neighborhood,
      photoImageKey: schema.restaurants.photoImageKey,
      visitedAt: schema.visits.visitedAt,
      revealedAt: schema.visits.revealedAt,
    })
    .from(schema.visits)
    .innerJoin(schema.restaurants, eq(schema.restaurants.id, schema.visits.restaurantId))
    .where(eq(schema.visits.id, visitId))
    .limit(1)

  const visit = visitRows.at(0)
  if (!visit) return { status: 'missing' }
  if (!visit.revealedAt) return { status: 'hidden' }

  const reveal = await loadRevealedVisit(visitId)
  if (!reveal?.revealed || reveal.finalScore === null) return { status: 'hidden' }

  const memberIds = reveal.ratings.map((rating) => rating.memberId)
  const avatarRows = await database
    .select({ id: schema.members.id, avatarImageKey: schema.members.avatarImageKey })
    .from(schema.members)
    .where(inArray(schema.members.id, memberIds))
  const avatarKeyByMemberId = new Map(avatarRows.map((row) => [row.id, row.avatarImageKey]))

  const [photoDataUrl, avatarDataUrls] = await Promise.all([
    loadStoryImageDataUrl(visit.photoImageKey, 'storyBackground'),
    Promise.all(
      memberIds.map((memberId) => loadStoryImageDataUrl(avatarKeyByMemberId.get(memberId) ?? null, 'storyAvatar')),
    ),
  ])
  const avatarDataUrlByMemberId = new Map(
    memberIds.map((memberId, memberIndex) => [memberId, avatarDataUrls[memberIndex]]),
  )

  return {
    status: 'ready',
    data: {
      restaurantName: visit.restaurantName,
      neighborhood: visit.neighborhood,
      visitDayLabel: formatLongDayInAppTimeZone(visit.visitedAt),
      photoDataUrl,
      finalScore: reveal.finalScore,
      criteriaAverages: reveal.criteriaAverages,
      ratings: [...reveal.ratings]
        .sort((first, second) => second.score - first.score)
        .map((rating) => ({
          memberId: rating.memberId,
          displayName: rating.displayName,
          score: rating.score,
          avatarDataUrl: avatarDataUrlByMemberId.get(rating.memberId) ?? null,
        })),
    },
  }
}
