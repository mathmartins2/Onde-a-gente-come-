import { desc, eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { calculateVisitScore } from '@/lib/scoring/calculateVisitScore'

type SnapshotContender = {
  restaurantId: string
  name?: string
  addedByName?: string
  chance: number
  bordaPoints?: number
  revisitWeight?: number
  supporters?: number
  topChoiceCount?: number
}

type SnapshotParticipant = {
  memberId: string
  displayName?: string
  isReady?: boolean
  rankedCount?: number
}

type SnapshotBallot = {
  memberId: string
  displayName: string
  ranking: Array<{ position: number; restaurantId: string; restaurantName: string }>
  banVote: { restaurantId: string | null; restaurantName: string | null } | null
}

type FullSnapshot = {
  participants?: SnapshotParticipant[]
  contenders?: SnapshotContender[]
  ballots?: SnapshotBallot[]
  bannedRestaurantName?: string | null
  banRound?: number
  fallback?: { restaurantId: string | null; name?: string; addedByName?: string } | null
}

const readSnapshot = (weightSnapshot: unknown) => {
  const snapshot = weightSnapshot as FullSnapshot | SnapshotParticipant[] | null

  if (Array.isArray(snapshot)) {
    return {
      participants: snapshot,
      contenders: [],
      ballots: [],
      bannedRestaurantName: null,
      banRound: 1,
      fallback: null,
    }
  }

  return {
    participants: snapshot?.participants ?? [],
    contenders: snapshot?.contenders ?? [],
    ballots: snapshot?.ballots ?? [],
    bannedRestaurantName: snapshot?.bannedRestaurantName ?? null,
    banRound: snapshot?.banRound ?? 1,
    fallback: snapshot?.fallback ?? null,
  }
}

const toOptionalNumber = (value: string | null) => (value === null ? null : Number(value))

export const loadHistory = async () => {
  const drawRows = await database
    .select({
      drawId: schema.draws.id,
      roundNumber: schema.draws.roundNumber,
      drawnAt: schema.draws.drawnAt,
      weightSnapshot: schema.draws.weightSnapshot,
      winnerRestaurantId: schema.draws.restaurantId,
      winnerRestaurantName: schema.restaurants.name,
      winnerNominatedByName: schema.members.displayName,
    })
    .from(schema.draws)
    .innerJoin(schema.restaurants, eq(schema.restaurants.id, schema.draws.restaurantId))
    .innerJoin(schema.members, eq(schema.members.id, schema.draws.winnerMemberId))
    .orderBy(desc(schema.draws.roundNumber))

  if (drawRows.length === 0) return []

  const visitRows = await database
    .select({
      visitId: schema.visits.id,
      drawId: schema.visits.drawId,
      revealedAt: schema.visits.revealedAt,
      recommendedByMemberId: schema.visits.recommendedByMemberId,
      usedFallback: schema.visits.usedFallback,
    })
    .from(schema.visits)

  const visitByDrawId = new Map(
    visitRows.flatMap((visit) => (visit.drawId ? [[visit.drawId, visit] as const] : [])),
  )

  const priceRows = await database
    .select({
      visitId: schema.visitPriceEntries.visitId,
      amount: schema.visitPriceEntries.amount,
      addedByName: schema.members.displayName,
    })
    .from(schema.visitPriceEntries)
    .innerJoin(schema.members, eq(schema.members.id, schema.visitPriceEntries.addedByMemberId))

  const priceByVisit = new Map(priceRows.map((row) => [row.visitId, row]))

  const ratingRows = await database
    .select({
      visitId: schema.ratings.visitId,
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

  const ratingsByVisit = new Map<string, typeof ratingRows>()
  ratingRows.forEach((rating) => {
    const existing = ratingsByVisit.get(rating.visitId) ?? []
    ratingsByVisit.set(rating.visitId, [...existing, rating])
  })

  return drawRows.map((draw) => {
    const snapshot = readSnapshot(draw.weightSnapshot)
    const visit = visitByDrawId.get(draw.drawId) ?? null
    const isRevealed = Boolean(visit?.revealedAt)
    const visitRatings = visit ? (ratingsByVisit.get(visit.visitId) ?? []) : []

    const ratings = isRevealed
      ? visitRatings.map((rating) => ({
          memberId: rating.memberId,
          displayName: rating.displayName,
          score: Number(rating.score),
          criteria: {
            flavor: toOptionalNumber(rating.flavorScore),
            price: toOptionalNumber(rating.priceScore),
            service: toOptionalNumber(rating.serviceScore),
            ambience: toOptionalNumber(rating.ambienceScore),
            menu: toOptionalNumber(rating.menuScore),
            waitTime: toOptionalNumber(rating.waitTimeScore),
          },
          comment: rating.comment,
          isRecommender: rating.memberId === visit?.recommendedByMemberId,
        }))
      : []

    const finalScore = isRevealed
      ? calculateVisitScore(
          visitRatings.map((rating) => ({
            memberId: rating.memberId,
            score: Number(rating.score),
          })),
          visit?.recommendedByMemberId ?? null,
        )
      : null

    return {
      drawId: draw.drawId,
      roundNumber: draw.roundNumber,
      drawnAt: draw.drawnAt,
      winnerRestaurantId: draw.winnerRestaurantId,
      winnerRestaurantName: draw.winnerRestaurantName,
      winnerNominatedByName: draw.winnerNominatedByName,
      contenders: snapshot.contenders.map((contender) => ({
        restaurantId: contender.restaurantId,
        restaurantName: contender.name ?? 'Restaurante',
        nominatedByName: contender.addedByName ?? '',
        chance: contender.chance,
        supporters: contender.supporters ?? 0,
        topChoiceCount: contender.topChoiceCount ?? 0,
        revisitWeight: contender.revisitWeight ?? 1,
      })),
      participants: snapshot.participants.map((participant) => ({
        memberId: participant.memberId,
        displayName: participant.displayName ?? '',
        rankedCount: participant.rankedCount ?? 0,
      })),
      ballots: snapshot.ballots,
      bannedRestaurantName: snapshot.bannedRestaurantName,
      banRound: snapshot.banRound,
      fallback: snapshot.fallback,
      usedFallback: visit?.usedFallback ?? false,
      visitId: visit?.visitId ?? null,
      totalPaid: visit ? (priceByVisit.get(visit.visitId)?.amount ?? null) : null,
      paidPerPerson:
        visit && priceByVisit.get(visit.visitId) && snapshot.participants.length > 0
          ? Number(priceByVisit.get(visit.visitId)?.amount) / snapshot.participants.length
          : null,
      isRevealed,
      finalScore,
      ratings,
    }
  })
}
