import { and, eq, gte, inArray, isNotNull, lt, or, sql } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { resolveImageUrl } from '@/lib/images/resolveImageStorage'
import { buildYearBoundariesInAppTimeZone } from '@/lib/utilities/appTimeZone'
import { buildYearInReview, type YearInReview } from '@/lib/yearInReview/buildYearInReview'
import type { YearSlide, YearSlideAvatar } from '@/lib/yearInReview/types'
import { listDishPhotoKeysByVisit } from './dishPhotoService'

const completedVisits = or(isNotNull(schema.visits.revealedAt), isNotNull(schema.visits.legacyScore))

const loadYearVisitRows = async (startsAt: Date, endsBefore: Date) =>
  database
    .select({
      visitId: schema.visits.id,
      restaurantId: schema.visits.restaurantId,
      restaurantName: schema.restaurants.name,
      neighborhood: schema.restaurants.neighborhood,
      cuisines: schema.restaurants.cuisines,
      photoImageKey: schema.restaurants.photoImageKey,
      visitedAt: schema.visits.visitedAt,
      revealedAt: schema.visits.revealedAt,
      recommendedByMemberId: schema.visits.recommendedByMemberId,
      legacyScore: schema.visits.legacyScore,
    })
    .from(schema.visits)
    .innerJoin(schema.restaurants, eq(schema.restaurants.id, schema.visits.restaurantId))
    .where(and(gte(schema.visits.visitedAt, startsAt), lt(schema.visits.visitedAt, endsBefore), completedVisits))

const loadFirstVisitByRestaurant = async () => {
  const rows = await database
    .select({
      restaurantId: schema.visits.restaurantId,
      firstVisitedAt: sql<Date>`min(${schema.visits.visitedAt})`.mapWith((value) => new Date(value)),
    })
    .from(schema.visits)
    .where(completedVisits)
    .groupBy(schema.visits.restaurantId)

  return new Map(rows.map((row) => [row.restaurantId, row.firstVisitedAt]))
}

const loadRatingsByVisit = async (revealedVisitIds: string[]) => {
  if (revealedVisitIds.length === 0) return new Map<string, Array<{ memberId: string; score: number; comment: string | null }>>()

  const rows = await database
    .select({
      visitId: schema.ratings.visitId,
      memberId: schema.ratings.memberId,
      score: schema.ratings.score,
      comment: schema.ratings.comment,
    })
    .from(schema.ratings)
    .where(inArray(schema.ratings.visitId, revealedVisitIds))

  return rows.reduce(
    (ratingsByVisit, row) =>
      ratingsByVisit.set(row.visitId, [
        ...(ratingsByVisit.get(row.visitId) ?? []),
        { memberId: row.memberId, score: Number(row.score), comment: row.comment },
      ]),
    new Map<string, Array<{ memberId: string; score: number; comment: string | null }>>(),
  )
}

const loadBillByVisit = async (visitIds: string[]) => {
  if (visitIds.length === 0) return new Map<string, number>()

  const rows = await database
    .select({ visitId: schema.visitPriceEntries.visitId, amount: schema.visitPriceEntries.amount })
    .from(schema.visitPriceEntries)
    .where(inArray(schema.visitPriceEntries.visitId, visitIds))

  return new Map(rows.map((row) => [row.visitId, Number(row.amount)]))
}

export const loadYearInReview = async (year: number, memberId: string): Promise<YearInReview> => {
  const { startsAt, endsBefore } = buildYearBoundariesInAppTimeZone(year)

  const [visitRows, firstVisitByRestaurant, drawRows, memberRows] = await Promise.all([
    loadYearVisitRows(startsAt, endsBefore),
    loadFirstVisitByRestaurant(),
    database
      .select({ roundNumber: schema.draws.roundNumber, winnerMemberId: schema.draws.winnerMemberId })
      .from(schema.draws)
      .where(and(gte(schema.draws.drawnAt, startsAt), lt(schema.draws.drawnAt, endsBefore))),
    database
      .select({
        memberId: schema.members.id,
        displayName: schema.members.displayName,
        avatarImageKey: schema.members.avatarImageKey,
      })
      .from(schema.members),
  ])

  const visitIds = visitRows.map((visit) => visit.visitId)
  const revealedVisitIds = visitRows.filter((visit) => visit.revealedAt !== null).map((visit) => visit.visitId)
  const [ratingsByVisit, billByVisit, dishPhotoKeysByVisit] = await Promise.all([
    loadRatingsByVisit(revealedVisitIds),
    loadBillByVisit(visitIds),
    listDishPhotoKeysByVisit(revealedVisitIds),
  ])

  return buildYearInReview({
    year,
    memberId,
    visits: visitRows.map((visit) => {
      const firstVisitedAt = firstVisitByRestaurant.get(visit.restaurantId)
      return {
        visitId: visit.visitId,
        restaurantId: visit.restaurantId,
        restaurantName: visit.restaurantName,
        neighborhood: visit.neighborhood,
        cuisines: visit.cuisines,
        photoImageKey: visit.photoImageKey,
        visitedAt: visit.visitedAt,
        recommendedByMemberId: visit.recommendedByMemberId,
        legacyScore: visit.legacyScore === null ? null : Number(visit.legacyScore),
        isFirstVisitEver: firstVisitedAt !== undefined && firstVisitedAt >= startsAt,
        billAmount: billByVisit.get(visit.visitId) ?? null,
        dishPhotoKeys: dishPhotoKeysByVisit.get(visit.visitId) ?? [],
        ratings: ratingsByVisit.get(visit.visitId) ?? [],
      }
    }),
    draws: drawRows,
    members: memberRows,
  })
}

const toClientAvatar = (avatar: YearSlideAvatar | null) =>
  avatar ? { name: avatar.name, imageUrl: resolveImageUrl(avatar.imageKey) } : null

const toClientSlide = ({ photoImageKey, avatar, entries, galleryImageKeys, ...slide }: YearSlide) => ({
  ...slide,
  photoUrl: resolveImageUrl(photoImageKey),
  galleryUrls: galleryImageKeys.flatMap((imageKey) => {
    const imageUrl = resolveImageUrl(imageKey)
    return imageUrl ? [imageUrl] : []
  }),
  avatar: toClientAvatar(avatar),
  entries: entries.map((entry) => ({ ...entry, avatar: toClientAvatar(entry.avatar) })),
})

export const toClientYearInReview = (yearInReview: YearInReview) => ({
  ...yearInReview,
  slides: yearInReview.slides.map(toClientSlide),
})

export type ClientYearInReview = ReturnType<typeof toClientYearInReview>
export type ClientYearSlide = ClientYearInReview['slides'][number]
