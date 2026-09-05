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
  visitedAt: Date
  usedFallback: boolean
  hasFallbackOption: boolean
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
      visitedAt: schema.visits.visitedAt,
      usedFallback: schema.visits.usedFallback,
      drawId: schema.visits.drawId,
    })
    .from(schema.visits)
    .innerJoin(schema.restaurants, eq(schema.restaurants.id, schema.visits.restaurantId))
    .where(eq(schema.visits.id, visitId))
    .limit(1)

  const visit = visitRows.at(0)
  if (!visit) return null

  const sessionMembers = await database
    .select({
      id: schema.members.id,
      displayName: schema.members.displayName,
      ratingPinHash: schema.members.ratingPinHash,
    })
    .from(schema.ratingSessionParticipants)
    .innerJoin(schema.members, eq(schema.members.id, schema.ratingSessionParticipants.memberId))
    .where(eq(schema.ratingSessionParticipants.visitId, visitId))

  const allMembers =
    sessionMembers.length > 0
      ? sessionMembers
      : await database
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
    visitedAt: visit.visitedAt,
    usedFallback: visit.usedFallback,
    hasFallbackOption: Boolean(visit.drawId),
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

export const discardRatingDraft = async (visitId: string, memberId: string) => {
  await database
    .delete(schema.ratingDrafts)
    .where(
      and(eq(schema.ratingDrafts.visitId, visitId), eq(schema.ratingDrafts.memberId, memberId)),
    )
}
export type SubmitRatingInput = {
  visitId: string
  memberId: string
  pin: string
  scores: CriterionScores
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
    score: String(calculateOverallScore(input.scores)),
    flavorScore: String(input.scores.flavor),
    priceScore: String(input.scores.price),
    serviceScore: String(input.scores.service),
    ambienceScore: String(input.scores.ambience),
    menuScore: String(input.scores.menu),
    waitTimeScore: String(input.scores.waitTime),
    comment: input.comment,
    appliedWeight: String(appliedWeight),
  })

  await discardRatingDraft(input.visitId, input.memberId)

  return { ok: true as const }
}

const averageOf = (values: ReadonlyArray<string | null>) => {
  const present = values.flatMap((value) => (value === null ? [] : [Number(value)]))
  if (present.length === 0) return null
  return present.reduce((sum, value) => sum + value, 0) / present.length
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

  const participantRows = await database
    .select({ memberId: schema.ratingSessionParticipants.memberId })
    .from(schema.ratingSessionParticipants)
    .where(eq(schema.ratingSessionParticipants.visitId, visitId))

  const memberCountRows =
    participantRows.length > 0
      ? participantRows
      : await database.select({ memberId: schema.members.id }).from(schema.members)
  const ratingRows = await database
    .select({
      memberId: schema.ratings.memberId,
      displayName: schema.members.displayName,
      score: schema.ratings.score,
      flavorScore: schema.ratings.flavorScore,
      priceScore: schema.ratings.priceScore,
      serviceScore: schema.ratings.serviceScore,
      ambienceScore: schema.ratings.ambienceScore,
      menuScore: schema.ratings.menuScore,
      waitTimeScore: schema.ratings.waitTimeScore,
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
    criteriaAverages: {
      flavor: averageOf(ratingRows.map((rating) => rating.flavorScore)),
      price: averageOf(ratingRows.map((rating) => rating.priceScore)),
      service: averageOf(ratingRows.map((rating) => rating.serviceScore)),
      ambience: averageOf(ratingRows.map((rating) => rating.ambienceScore)),
      menu: averageOf(ratingRows.map((rating) => rating.menuScore)),
      waitTime: averageOf(ratingRows.map((rating) => rating.waitTimeScore)),
    },
    ratings: ratingRows.map((rating) => ({
      memberId: rating.memberId,
      displayName: rating.displayName,
      score: Number(rating.score),
      flavor: rating.flavorScore === null ? null : Number(rating.flavorScore),
      price: rating.priceScore === null ? null : Number(rating.priceScore),
      service: rating.serviceScore === null ? null : Number(rating.serviceScore),
      ambience: rating.ambienceScore === null ? null : Number(rating.ambienceScore),
      menu: rating.menuScore === null ? null : Number(rating.menuScore),
      waitTime: rating.waitTimeScore === null ? null : Number(rating.waitTimeScore),
      comment: rating.comment,
      isRecommender: rating.memberId === visit.recommendedByMemberId,
    })),
  }
}

export type CriterionScores = {
  flavor: number
  price: number
  service: number
  ambience: number
  menu: number
  waitTime: number
}

export const calculateOverallScore = (scores: CriterionScores) => {
  const values = [scores.flavor, scores.price, scores.service, scores.ambience, scores.menu, scores.waitTime]
  return values.reduce((sum, value) => sum + value, 0) / values.length
}


export const loadOwnRating = async (visitId: string, memberId: string) => {
  const rows = await database
    .select({
      flavorScore: schema.ratings.flavorScore,
      priceScore: schema.ratings.priceScore,
      serviceScore: schema.ratings.serviceScore,
      ambienceScore: schema.ratings.ambienceScore,
      menuScore: schema.ratings.menuScore,
      waitTimeScore: schema.ratings.waitTimeScore,
      comment: schema.ratings.comment,
    })
    .from(schema.ratings)
    .where(and(eq(schema.ratings.visitId, visitId), eq(schema.ratings.memberId, memberId)))
    .limit(1)

  const rating = rows.at(0)
  if (!rating) return null

  return {
    flavor: rating.flavorScore === null ? null : Number(rating.flavorScore),
    price: rating.priceScore === null ? null : Number(rating.priceScore),
    service: rating.serviceScore === null ? null : Number(rating.serviceScore),
    ambience: rating.ambienceScore === null ? null : Number(rating.ambienceScore),
    menu: rating.menuScore === null ? null : Number(rating.menuScore),
    waitTime: rating.waitTimeScore === null ? null : Number(rating.waitTimeScore),
    comment: rating.comment,
  }
}

export const listRatingParticipants = async (visitId: string) => {
  const rows = await database
    .select({ id: schema.members.id, displayName: schema.members.displayName })
    .from(schema.ratingSessionParticipants)
    .innerJoin(schema.members, eq(schema.members.id, schema.ratingSessionParticipants.memberId))
    .where(eq(schema.ratingSessionParticipants.visitId, visitId))

  if (rows.length > 0) return rows

  return database
    .select({ id: schema.members.id, displayName: schema.members.displayName })
    .from(schema.members)
}

export const submitOwnRating = async (input: {
  visitId: string
  memberId: string
  scores: CriterionScores
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

  const overallScore = String(calculateOverallScore(input.scores))
  const criterionColumns = {
    flavorScore: String(input.scores.flavor),
    priceScore: String(input.scores.price),
    serviceScore: String(input.scores.service),
    ambienceScore: String(input.scores.ambience),
    menuScore: String(input.scores.menu),
    waitTimeScore: String(input.scores.waitTime),
  }

  await database
    .insert(schema.ratings)
    .values({
      visitId: input.visitId,
      memberId: input.memberId,
      score: overallScore,
      ...criterionColumns,
      comment: input.comment,
      appliedWeight: String(appliedWeight),
    })
    .onConflictDoUpdate({
      target: [schema.ratings.visitId, schema.ratings.memberId],
      set: {
        score: overallScore,
        ...criterionColumns,
        comment: input.comment,
        appliedWeight: String(appliedWeight),
      },
    })

  await discardRatingDraft(input.visitId, input.memberId)

  return { ok: true as const }
}

export type RatingDraftInput = {
  visitId: string
  memberId: string
  flavor: number | null
  price: number | null
  service: number | null
  ambience: number | null
  menu: number | null
  waitTime: number | null
  comment: string | null
}

const toNumericText = (value: number | null) => (value === null ? null : String(value))

export const saveRatingDraft = async (input: RatingDraftInput) => {
  const draftColumns = {
    flavorScore: toNumericText(input.flavor),
    priceScore: toNumericText(input.price),
    serviceScore: toNumericText(input.service),
    ambienceScore: toNumericText(input.ambience),
    menuScore: toNumericText(input.menu),
    waitTimeScore: toNumericText(input.waitTime),
    comment: input.comment,
    updatedAt: new Date(),
  }

  await database
    .insert(schema.ratingDrafts)
    .values({ visitId: input.visitId, memberId: input.memberId, ...draftColumns })
    .onConflictDoUpdate({
      target: [schema.ratingDrafts.visitId, schema.ratingDrafts.memberId],
      set: draftColumns,
    })
}

export const loadRatingDraft = async (visitId: string, memberId: string) => {
  const rows = await database
    .select({
      flavorScore: schema.ratingDrafts.flavorScore,
      priceScore: schema.ratingDrafts.priceScore,
      serviceScore: schema.ratingDrafts.serviceScore,
      ambienceScore: schema.ratingDrafts.ambienceScore,
      menuScore: schema.ratingDrafts.menuScore,
      waitTimeScore: schema.ratingDrafts.waitTimeScore,
      comment: schema.ratingDrafts.comment,
    })
    .from(schema.ratingDrafts)
    .where(
      and(eq(schema.ratingDrafts.visitId, visitId), eq(schema.ratingDrafts.memberId, memberId)),
    )
    .limit(1)

  const draft = rows.at(0)
  if (!draft) return null

  return {
    flavor: draft.flavorScore === null ? null : Number(draft.flavorScore),
    price: draft.priceScore === null ? null : Number(draft.priceScore),
    service: draft.serviceScore === null ? null : Number(draft.serviceScore),
    ambience: draft.ambienceScore === null ? null : Number(draft.ambienceScore),
    menu: draft.menuScore === null ? null : Number(draft.menuScore),
    waitTime: draft.waitTimeScore === null ? null : Number(draft.waitTimeScore),
    comment: draft.comment,
  }
}


