import { randomInt } from 'node:crypto'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { onlyRevealedVisits } from '@/lib/database/visitFilters'
import { calculateNominationWeight } from '@/lib/draw/calculateNominationWeight'
import { calculateQualityMultiplier } from '@/lib/draw/calculateQualityMultiplier'
import { selectWinner, type DrawCandidateMember } from '@/lib/draw/selectWinner'
import { securityConfiguration } from '@/lib/scoring/configuration'

const randomFraction = () => randomInt(0, 1_000_000) / 1_000_000

export const findDrawCooldown = async () => {
  const rows = await database
    .select({ drawnAt: schema.draws.drawnAt })
    .from(schema.draws)
    .orderBy(desc(schema.draws.drawnAt))
    .limit(1)

  const lastDrawnAt = rows.at(0)?.drawnAt
  if (!lastDrawnAt) return null

  const elapsedInSeconds = (Date.now() - lastDrawnAt.getTime()) / 1000
  const remainingInSeconds = securityConfiguration.drawCooldownInSeconds - elapsedInSeconds
  if (remainingInSeconds <= 0) return null

  return { retryAfterSeconds: Math.ceil(remainingInSeconds) }
}

export const getCurrentRoundNumber = async () => {
  const rows = await database
    .select({ roundNumber: schema.draws.roundNumber })
    .from(schema.draws)
    .orderBy(desc(schema.draws.roundNumber))
    .limit(1)

  return (rows.at(0)?.roundNumber ?? 0) + 1
}

const loadVisitHistory = async () => {
  const rows = await database
    .select({
      restaurantId: schema.visits.restaurantId,
      visitCount: sql<number>`count(*)::int`,
      lastVisitedAt: sql<Date | null>`max(${schema.visits.visitedAt})`,
    })
    .from(schema.visits)
    .groupBy(schema.visits.restaurantId)

  return new Map(rows.map((row) => [row.restaurantId, row]))
}

export const loadNominatorQuality = async () => {
  const rows = await database
    .select({
      memberId: schema.visits.recommendedByMemberId,
      score: schema.ratings.score,
    })
    .from(schema.visits)
    .innerJoin(schema.ratings, eq(schema.ratings.visitId, schema.visits.id))
    .where(
      and(sql`${schema.visits.recommendedByMemberId} is not null`, onlyRevealedVisits),
    )

  const totals = new Map<string, { scoreSum: number; ratingCount: number }>()
  let groupScoreSum = 0
  let groupRatingCount = 0

  rows.forEach((row) => {
    if (!row.memberId) return
    const current = totals.get(row.memberId) ?? { scoreSum: 0, ratingCount: 0 }
    const score = Number(row.score)
    totals.set(row.memberId, {
      scoreSum: current.scoreSum + score,
      ratingCount: current.ratingCount + 1,
    })
    groupScoreSum += score
    groupRatingCount += 1
  })

  const groupAverage = groupRatingCount === 0 ? null : groupScoreSum / groupRatingCount

  const averageByMember = new Map(
    [...totals.entries()].map(([memberId, value]) => [
      memberId,
      value.ratingCount === 0 ? null : value.scoreSum / value.ratingCount,
    ]),
  )

  return { groupAverage, averageByMember }
}

export const buildDrawCandidates = async (): Promise<DrawCandidateMember[]> => {
  const roundNumber = await getCurrentRoundNumber()
  const visitHistory = await loadVisitHistory()
  const nominatorQuality = await loadNominatorQuality()

  const vetoedRows = await database
    .select({ nominationId: schema.vetoes.nominationId })
    .from(schema.vetoes)
    .where(eq(schema.vetoes.roundNumber, roundNumber))
  const vetoedNominationIds = new Set(vetoedRows.map((row) => row.nominationId))

  const rows = await database
    .select({
      memberId: schema.members.id,
      roundsSinceLastWin: schema.members.roundsSinceLastWin,
      nominationId: schema.nominations.id,
      restaurantId: schema.nominations.restaurantId,
    })
    .from(schema.members)
    .leftJoin(
      schema.nominations,
      and(
        eq(schema.nominations.memberId, schema.members.id),
        isNull(schema.nominations.consumedAt),
      ),
    )

  const grouped = new Map<string, DrawCandidateMember>()

  rows.forEach((row) => {
    const existing = grouped.get(row.memberId) ?? {
      memberId: row.memberId,
      roundsSinceLastWin: row.roundsSinceLastWin,
      qualityMultiplier: calculateQualityMultiplier(
        nominatorQuality.averageByMember.get(row.memberId) ?? null,
        nominatorQuality.groupAverage,
      ),
      nominations: [] as DrawCandidateMember['nominations'],
    }

    if (!row.nominationId || !row.restaurantId) {
      grouped.set(row.memberId, existing)
      return
    }
    if (vetoedNominationIds.has(row.nominationId)) {
      grouped.set(row.memberId, existing)
      return
    }

    const history = visitHistory.get(row.restaurantId)
    const weight = calculateNominationWeight({
      visitCount: history?.visitCount ?? 0,
      lastVisitedAt: history?.lastVisitedAt ? new Date(history.lastVisitedAt) : null,
    })

    grouped.set(row.memberId, {
      ...existing,
      nominations: [
        ...existing.nominations,
        { nominationId: row.nominationId, restaurantId: row.restaurantId, weight },
      ],
    })
  })

  return [...grouped.values()]
}

export const runDraw = async () => {
  const candidates = await buildDrawCandidates()
  const selection = selectWinner(candidates, randomFraction(), randomFraction())
  if (!selection) return null

  const roundNumber = await getCurrentRoundNumber()

  return database.transaction(async (transaction) => {
    const [draw] = await transaction
      .insert(schema.draws)
      .values({
        roundNumber,
        winnerMemberId: selection.memberId,
        restaurantId: selection.restaurantId,
        nominationId: selection.nominationId,
        weightSnapshot: selection.snapshot,
      })
      .returning()

    await transaction
      .update(schema.nominations)
      .set({ consumedAt: new Date(), consumedByDrawId: draw.id })
      .where(eq(schema.nominations.id, selection.nominationId))

    const [visit] = await transaction
      .insert(schema.visits)
      .values({
        restaurantId: selection.restaurantId,
        drawId: draw.id,
        recommendedByMemberId: selection.memberId,
      })
      .returning()

    const eligibleMemberIds = candidates
      .filter((candidate) => candidate.nominations.length > 0)
      .map((candidate) => candidate.memberId)

    await transaction
      .update(schema.members)
      .set({ roundsSinceLastWin: 0 })
      .where(eq(schema.members.id, selection.memberId))

    await Promise.all(
      eligibleMemberIds
        .filter((memberId) => memberId !== selection.memberId)
        .map((memberId) =>
          transaction
            .update(schema.members)
            .set({ roundsSinceLastWin: sql`${schema.members.roundsSinceLastWin} + 1` })
            .where(eq(schema.members.id, memberId)),
        ),
    )

    return { draw, visit, selection }
  })
}
