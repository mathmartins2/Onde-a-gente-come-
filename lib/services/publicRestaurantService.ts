import { randomBytes } from 'node:crypto'
import { and, eq, inArray, isNotNull, or, sql } from 'drizzle-orm'
import { cache } from 'react'
import { database, schema } from '@/lib/database/client'
import { buildRestaurantSummary, type SummaryRating } from '@/lib/restaurantSummary/buildRestaurantSummary'
import { normalizeImage } from '@/lib/images/normalizeImage'
import { resolveImageStorage } from '@/lib/images/resolveImageStorage'

const shareTokenByteLength = 12
const shareTokenPattern = /^[A-Za-z0-9_-]{16}$/

const generateShareToken = () => randomBytes(shareTokenByteLength).toString('base64url')

export const buildPublicRestaurantPath = (shareToken: string) => `/r/${shareToken}`

const buildPublicRestaurantPhotoPath = (shareToken: string, imageKey: string) =>
  `${buildPublicRestaurantPath(shareToken)}/photo/${imageKey}`

const toScoreOrNull = (value: string | null) => (value === null ? null : Number(value))

const loadSharedRestaurantRow = async (shareToken: string) => {
  if (!shareTokenPattern.test(shareToken)) return null

  const rows = await database
    .select({
      id: schema.restaurants.id,
      name: schema.restaurants.name,
      neighborhood: schema.restaurants.neighborhood,
      city: schema.restaurants.city,
      cuisines: schema.restaurants.cuisines,
      photoImageKey: schema.restaurants.photoImageKey,
    })
    .from(schema.restaurants)
    .where(eq(schema.restaurants.publicShareToken, shareToken))
    .limit(1)
  return rows.at(0) ?? null
}

const loadCompletedVisitRows = async (restaurantId: string) =>
  database
    .select({
      visitId: schema.visits.id,
      visitedAt: schema.visits.visitedAt,
      revealedAt: schema.visits.revealedAt,
      recommendedByMemberId: schema.visits.recommendedByMemberId,
      legacyScore: schema.visits.legacyScore,
    })
    .from(schema.visits)
    .where(
      and(
        eq(schema.visits.restaurantId, restaurantId),
        or(isNotNull(schema.visits.revealedAt), isNotNull(schema.visits.legacyScore)),
      ),
    )

const loadRevealedRatingsByVisit = async (revealedVisitIds: string[]) => {
  if (revealedVisitIds.length === 0) return new Map<string, SummaryRating[]>()

  const rows = await database
    .select({
      visitId: schema.ratings.visitId,
      memberId: schema.ratings.memberId,
      authorName: schema.members.displayName,
      score: schema.ratings.score,
      comment: schema.ratings.comment,
      flavorScore: schema.ratings.flavorScore,
      priceScore: schema.ratings.priceScore,
      serviceScore: schema.ratings.serviceScore,
      ambienceScore: schema.ratings.ambienceScore,
      menuScore: schema.ratings.menuScore,
      waitTimeScore: schema.ratings.waitTimeScore,
    })
    .from(schema.ratings)
    .innerJoin(schema.members, eq(schema.members.id, schema.ratings.memberId))
    .where(inArray(schema.ratings.visitId, revealedVisitIds))

  return rows.reduce(
    (ratingsByVisit, row) =>
      ratingsByVisit.set(row.visitId, [
        ...(ratingsByVisit.get(row.visitId) ?? []),
        {
          memberId: row.memberId,
          authorName: row.authorName,
          score: Number(row.score),
          comment: row.comment,
          criterionScores: {
            flavor: toScoreOrNull(row.flavorScore),
            price: toScoreOrNull(row.priceScore),
            service: toScoreOrNull(row.serviceScore),
            ambience: toScoreOrNull(row.ambienceScore),
            menu: toScoreOrNull(row.menuScore),
            waitTime: toScoreOrNull(row.waitTimeScore),
          },
        },
      ]),
    new Map<string, SummaryRating[]>(),
  )
}

export const ensureRestaurantShareToken = async (restaurantId: string) => {
  const rows = await database
    .update(schema.restaurants)
    .set({ publicShareToken: sql`coalesce(${schema.restaurants.publicShareToken}, ${generateShareToken()})` })
    .where(eq(schema.restaurants.id, restaurantId))
    .returning({ publicShareToken: schema.restaurants.publicShareToken })
  return rows.at(0)?.publicShareToken ?? null
}

export const loadPublicRestaurantSummary = cache(async (shareToken: string) => {
  const restaurant = await loadSharedRestaurantRow(shareToken)
  if (!restaurant) return null

  const visitRows = await loadCompletedVisitRows(restaurant.id)
  const revealedVisitIds = visitRows.filter((visit) => visit.revealedAt !== null).map((visit) => visit.visitId)
  const ratingsByVisit = await loadRevealedRatingsByVisit(revealedVisitIds)

  const summary = buildRestaurantSummary(
    visitRows.map((visit) => ({
      visitedAt: visit.visitedAt,
      recommendedByMemberId: visit.recommendedByMemberId,
      legacyScore: toScoreOrNull(visit.legacyScore),
      ratings: ratingsByVisit.get(visit.visitId) ?? [],
    })),
  )
  if (!summary) return null

  return {
    name: restaurant.name,
    neighborhood: restaurant.neighborhood,
    city: restaurant.city,
    cuisines: restaurant.cuisines,
    photoUrl: restaurant.photoImageKey ? buildPublicRestaurantPhotoPath(shareToken, restaurant.photoImageKey) : null,
    ...summary,
  }
})

export type PublicRestaurantSummary = NonNullable<Awaited<ReturnType<typeof loadPublicRestaurantSummary>>>

export const loadPublicRestaurantPhoto = async (shareToken: string, imageKey: string) => {
  const restaurant = await loadSharedRestaurantRow(shareToken)
  if (!restaurant || restaurant.photoImageKey !== imageKey) return null

  const storedImage = await resolveImageStorage().readImage(imageKey)
  if (!storedImage) return null
  return normalizeImage(storedImage.bytes, 'storyAvatar')
}
