import { and, eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { verifySecret } from '@/lib/auth/password'
import { assertNotLocked, clearFailures, registerFailure } from '@/lib/auth/rateLimit'
import { resolveRatingWeight, calculateVisitScore } from '@/lib/scoring/calculateVisitScore'
import { securityConfiguration } from '@/lib/scoring/configuration'

const pinPolicy = {
  maximumFailures: securityConfiguration.maximumPinAttemptsPerVisit,
  lockoutInSeconds: securityConfiguration.pinLockoutInSeconds,
}

export type RatingSessionState = {
  visitId: string
  restaurantName: string
  recommendedByMemberId: string | null
  isRevealed: boolean
  pendingMembers: Array<{ id: string; displayName: string; hasRatingPin: boolean }>
  ratedMemberIds: string[]
}

export const loadRatingSession = async (visitId: string): Promise<RatingSessionState | null> => {
  const visitRows = await database
    .select({
      id: schema.visits.id,
      restaurantName: schema.restaurants.name,
      recommendedByMemberId: schema.visits.recommendedByMemberId,
      revealedAt: schema.visits.revealedAt,
    })
    .from(schema.visits)
    .innerJoin(schema.restaurants, eq(schema.restaurants.id, schema.visits.restaurantId))
    .where(eq(schema.visits.id, visitId))
    .limit(1)

  const visit = visitRows.at(0)
  if (!visit) return null

  const allMembers = await database
    .select({
      id: schema.members.id,
      displayName: schema.members.displayName,
      ratingPinHash: schema.members.ratingPinHash,
    })
    .from(schema.members)

  const existingRatings = await database
    .select({ memberId: schema.ratings.memberId })
    .from(schema.ratings)
    .where(eq(schema.ratings.visitId, visitId))

  const ratedMemberIds = existingRatings.map((rating) => rating.memberId)

  return {
    visitId: visit.id,
    restaurantName: visit.restaurantName,
    recommendedByMemberId: visit.recommendedByMemberId,
    isRevealed: Boolean(visit.revealedAt),
    pendingMembers: allMembers
      .filter((member) => !ratedMemberIds.includes(member.id))
      .map((member) => ({
        id: member.id,
        displayName: member.displayName,
        hasRatingPin: Boolean(member.ratingPinHash),
      })),
    ratedMemberIds,
  }
}

export type SubmitRatingInput = {
  visitId: string
  memberId: string
  pin: string
  score: number
  comment: string | null
}

export const submitRating = async (input: SubmitRatingInput) => {
  const lockScope = `rating-pin:${input.visitId}`
  const lockState = await assertNotLocked(lockScope, input.memberId)
  if (lockState.locked) {
    return { ok: false as const, reason: 'LOCKED' as const, retryAfterSeconds: lockState.retryAfterSeconds }
  }

  const memberRows = await database
    .select({ id: schema.members.id, ratingPinHash: schema.members.ratingPinHash })
    .from(schema.members)
    .where(eq(schema.members.id, input.memberId))
    .limit(1)

  const member = memberRows.at(0)
  if (!member?.ratingPinHash) return { ok: false as const, reason: 'NO_PIN' as const }

  const pinMatches = await verifySecret(member.ratingPinHash, input.pin)
  if (!pinMatches) {
    const failure = await registerFailure(lockScope, input.memberId, pinPolicy)
    return { ok: false as const, reason: 'INVALID_PIN' as const, locked: failure.locked }
  }

  await clearFailures(lockScope, input.memberId)

  const visitRows = await database
    .select({
      id: schema.visits.id,
      recommendedByMemberId: schema.visits.recommendedByMemberId,
      revealedAt: schema.visits.revealedAt,
    })
    .from(schema.visits)
    .where(eq(schema.visits.id, input.visitId))
    .limit(1)

  const visit = visitRows.at(0)
  if (!visit) return { ok: false as const, reason: 'VISIT_NOT_FOUND' as const }
  if (visit.revealedAt) return { ok: false as const, reason: 'ALREADY_REVEALED' as const }

  const alreadyRated = await database
    .select({ id: schema.ratings.id })
    .from(schema.ratings)
    .where(and(eq(schema.ratings.visitId, input.visitId), eq(schema.ratings.memberId, input.memberId)))
    .limit(1)

  if (alreadyRated.length > 0) return { ok: false as const, reason: 'ALREADY_RATED' as const }

  const appliedWeight = resolveRatingWeight(input.memberId, visit.recommendedByMemberId)

  await database.insert(schema.ratings).values({
    visitId: input.visitId,
    memberId: input.memberId,
    score: String(input.score),
    comment: input.comment,
    appliedWeight: String(appliedWeight),
  })

  return { ok: true as const }
}

export const revealVisit = async (visitId: string) => {
  const visitRows = await database
    .select({
      id: schema.visits.id,
      recommendedByMemberId: schema.visits.recommendedByMemberId,
      revealedAt: schema.visits.revealedAt,
    })
    .from(schema.visits)
    .where(eq(schema.visits.id, visitId))
    .limit(1)

  const visit = visitRows.at(0)
  if (!visit) return null

  const memberCountRows = await database.select({ id: schema.members.id }).from(schema.members)
  const ratingRows = await database
    .select({
      memberId: schema.ratings.memberId,
      displayName: schema.members.displayName,
      score: schema.ratings.score,
      comment: schema.ratings.comment,
    })
    .from(schema.ratings)
    .innerJoin(schema.members, eq(schema.members.id, schema.ratings.memberId))
    .where(eq(schema.ratings.visitId, visitId))

  if (ratingRows.length < memberCountRows.length) {
    return { revealed: false as const, missing: memberCountRows.length - ratingRows.length }
  }

  const finalScore = calculateVisitScore(
    ratingRows.map((rating) => ({ memberId: rating.memberId, score: Number(rating.score) })),
    visit.recommendedByMemberId,
  )

  if (!visit.revealedAt) {
    await database
      .update(schema.visits)
      .set({ revealedAt: new Date() })
      .where(eq(schema.visits.id, visitId))
  }

  return {
    revealed: true as const,
    finalScore,
    ratings: ratingRows.map((rating) => ({
      memberId: rating.memberId,
      displayName: rating.displayName,
      score: Number(rating.score),
      comment: rating.comment,
      isRecommender: rating.memberId === visit.recommendedByMemberId,
    })),
  }
}

export const submitOwnRating = async (input: {
  visitId: string
  memberId: string
  score: number
  comment: string | null
}) => {
  const visitRows = await database
    .select({
      id: schema.visits.id,
      recommendedByMemberId: schema.visits.recommendedByMemberId,
      revealedAt: schema.visits.revealedAt,
    })
    .from(schema.visits)
    .where(eq(schema.visits.id, input.visitId))
    .limit(1)

  const visit = visitRows.at(0)
  if (!visit) return { ok: false as const, reason: 'VISIT_NOT_FOUND' as const }
  if (visit.revealedAt) return { ok: false as const, reason: 'ALREADY_REVEALED' as const }

  const appliedWeight = resolveRatingWeight(input.memberId, visit.recommendedByMemberId)

  await database
    .insert(schema.ratings)
    .values({
      visitId: input.visitId,
      memberId: input.memberId,
      score: String(input.score),
      comment: input.comment,
      appliedWeight: String(appliedWeight),
    })
    .onConflictDoUpdate({
      target: [schema.ratings.visitId, schema.ratings.memberId],
      set: {
        score: String(input.score),
        comment: input.comment,
        appliedWeight: String(appliedWeight),
      },
    })

  return { ok: true as const }
}
