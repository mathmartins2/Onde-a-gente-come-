import { and, desc, eq, ne, sql } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { onlyRevealedVisits } from '@/lib/database/visitFilters'
import { calculateMemberWeight } from '@/lib/draw/calculateMemberWeight'
import { buildDrawCandidates, getCurrentRoundNumber } from './drawService'

export const loadBoardState = async () => {
  const roundNumber = await getCurrentRoundNumber()
  const candidates = await buildDrawCandidates()

  const members = await database
    .select({
      id: schema.members.id,
      displayName: schema.members.displayName,
      roundsSinceLastWin: schema.members.roundsSinceLastWin,
    })
    .from(schema.members)

  const restaurants = await database.select().from(schema.restaurants)
  const restaurantById = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]))

  const nominationRows = await database
    .select({
      id: schema.nominations.id,
      memberId: schema.nominations.memberId,
      restaurantId: schema.nominations.restaurantId,
      memberName: schema.members.displayName,
    })
    .from(schema.nominations)
    .innerJoin(schema.members, eq(schema.members.id, schema.nominations.memberId))
    .where(sql`${schema.nominations.consumedAt} is null`)

  const vetoRows = await database
    .select({
      nominationId: schema.vetoes.nominationId,
      memberId: schema.vetoes.memberId,
      memberName: schema.members.displayName,
    })
    .from(schema.vetoes)
    .innerJoin(schema.members, eq(schema.members.id, schema.vetoes.memberId))
    .where(eq(schema.vetoes.roundNumber, roundNumber))

  const vetoByNominationId = new Map(vetoRows.map((veto) => [veto.nominationId, veto]))

  const eligibleCandidates = candidates.filter((candidate) => candidate.nominations.length > 0)
  const weights = eligibleCandidates.map(
    (candidate) =>
      calculateMemberWeight(candidate.roundsSinceLastWin) * candidate.qualityMultiplier,
  )
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)

  const memberChances = members.map((member) => {
    const eligibleIndex = eligibleCandidates.findIndex(
      (candidate) => candidate.memberId === member.id,
    )
    const isEligible = eligibleIndex >= 0

    return {
      memberId: member.id,
      displayName: member.displayName,
      roundsSinceLastWin: member.roundsSinceLastWin,
      isEligible,
      qualityMultiplier: isEligible ? eligibleCandidates[eligibleIndex].qualityMultiplier : 1,
      weight: isEligible ? weights[eligibleIndex] : 0,
      chance: isEligible && totalWeight > 0 ? weights[eligibleIndex] / totalWeight : 0,
    }
  })

  const nominations = nominationRows.map((nomination) => {
    const restaurant = restaurantById.get(nomination.restaurantId)
    const veto = vetoByNominationId.get(nomination.id)

    return {
      id: nomination.id,
      memberId: nomination.memberId,
      memberName: nomination.memberName,
      restaurantId: nomination.restaurantId,
      restaurantName: restaurant?.name ?? 'Restaurante',
      neighborhood: restaurant?.neighborhood ?? null,
      cuisines: restaurant?.cuisines ?? [],
      vetoedBy: veto?.memberName ?? null,
    }
  })

  const latestDrawRows = await database
    .select({
      id: schema.draws.id,
      roundNumber: schema.draws.roundNumber,
      drawnAt: schema.draws.drawnAt,
      winnerName: schema.members.displayName,
      restaurantName: schema.restaurants.name,
      weightSnapshot: schema.draws.weightSnapshot,
    })
    .from(schema.draws)
    .innerJoin(schema.members, eq(schema.members.id, schema.draws.winnerMemberId))
    .innerJoin(schema.restaurants, eq(schema.restaurants.id, schema.draws.restaurantId))
    .orderBy(desc(schema.draws.roundNumber))
    .limit(10)

  return { roundNumber, memberChances, nominations, history: latestDrawRows }
}

export const loadRestaurantVisitContext = async (
  restaurantId: string,
  currentVisitId: string,
) => {
  const earlierVisits = and(
    eq(schema.visits.restaurantId, restaurantId),
    ne(schema.visits.id, currentVisitId),
  )

  const rows = await database
    .select({
      visitCount: sql<number>`count(*)::int`,
      lastVisitedAt: sql<Date | null>`max(${schema.visits.visitedAt})`,
    })
    .from(schema.visits)
    .where(earlierVisits)

  const summary = rows.at(0)
  if (!summary || summary.visitCount === 0) return { visitCount: 0, lastVisitedAt: null, lastScore: null }

  const scoreRows = await database
    .select({
      visitId: schema.visits.id,
      legacyScore: schema.visits.legacyScore,
      averageScore: sql<string | null>`avg(${schema.ratings.score})`,
      visitedAt: schema.visits.visitedAt,
    })
    .from(schema.visits)
    .leftJoin(schema.ratings, eq(schema.ratings.visitId, schema.visits.id))
    .where(and(earlierVisits, onlyRevealedVisits))
    .groupBy(schema.visits.id, schema.visits.legacyScore, schema.visits.visitedAt)
    .orderBy(desc(schema.visits.visitedAt))
    .limit(1)

  const latest = scoreRows.at(0)
  const lastScore = latest?.averageScore
    ? Number(latest.averageScore)
    : latest?.legacyScore
      ? Number(latest.legacyScore)
      : null

  return {
    visitCount: summary.visitCount,
    lastVisitedAt: summary.lastVisitedAt,
    lastScore,
  }
}
