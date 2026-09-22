import { eq, inArray } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { normalizeImage } from '@/lib/images/normalizeImage'
import { resolveImageStorage } from '@/lib/images/resolveImageStorage'
import { loadStoryImageAccentColor, loadStoryImageDataUrl } from '@/lib/share/loadStoryImage'
import type { VisitStoryData } from '@/lib/share/VisitStory'
import { formatLongDayInAppTimeZone } from '@/lib/utilities/appTimeZone'
import { listDishPhotoKeysByVisit } from './dishPhotoService'
import { loadRevealedVisit } from './ratingService'

const maximumStoryPolaroidCount = 3

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

  const dishPhotoKeys = (await listDishPhotoKeysByVisit([visitId])).get(visitId) ?? []
  const [backgroundDishPhotoKey, ...polaroidDishPhotoKeys] = dishPhotoKeys

  const [photoDataUrl, logoAccentColor, backgroundDishPhotoDataUrl, dishPolaroidDataUrls, avatarDataUrls] = await Promise.all([
    loadStoryImageDataUrl(visit.photoImageKey, 'storyBackground'),
    loadStoryImageAccentColor(visit.photoImageKey),
    loadStoryImageDataUrl(backgroundDishPhotoKey ?? null, 'storyBackground'),
    Promise.all(
      polaroidDishPhotoKeys
        .slice(0, maximumStoryPolaroidCount)
        .map((imageKey) => loadStoryImageDataUrl(imageKey, 'storyPolaroid')),
    ),
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
      backgroundPhotoDataUrl: backgroundDishPhotoDataUrl ?? photoDataUrl,
      dishPolaroidDataUrls: dishPolaroidDataUrls.flatMap((dataUrl) => (dataUrl ? [dataUrl] : [])),
      logoAccentColor,
      finalScore: reveal.finalScore,
      criteriaAverages: reveal.criteriaAverages,
      ratings: [...reveal.ratings]
        .sort((first, second) => second.score - first.score)
        .map((rating) => ({
          memberId: rating.memberId,
          displayName: rating.displayName,
          score: rating.score,
          comment: rating.comment,
          avatarDataUrl: avatarDataUrlByMemberId.get(rating.memberId) ?? null,
        })),
    },
  }
}

const maximumStoryVideoPhotoCount = 6

const loadStoryVideoPhoto = async (imageKey: string) => {
  const storedImage = await resolveImageStorage().readImage(imageKey)
  if (!storedImage) return null
  return (await normalizeImage(storedImage.bytes, 'storyBackground')).bytes
}

const loadRestaurantPhotoKey = async (visitId: string) => {
  const rows = await database
    .select({ photoImageKey: schema.restaurants.photoImageKey })
    .from(schema.visits)
    .innerJoin(schema.restaurants, eq(schema.restaurants.id, schema.visits.restaurantId))
    .where(eq(schema.visits.id, visitId))
    .limit(1)
  return rows.at(0)?.photoImageKey ?? null
}

export const loadVisitStoryVideoPhotos = async (visitId: string) => {
  const dishPhotoKeys = (await listDishPhotoKeysByVisit([visitId])).get(visitId) ?? []
  const restaurantPhotoKey = dishPhotoKeys.length > 0 ? null : await loadRestaurantPhotoKey(visitId)
  const backgroundKeys = restaurantPhotoKey ? [restaurantPhotoKey] : dishPhotoKeys
  const photos = await Promise.all(backgroundKeys.slice(0, maximumStoryVideoPhotoCount).map(loadStoryVideoPhoto))
  return photos.flatMap((photo) => (photo ? [photo] : []))
}
