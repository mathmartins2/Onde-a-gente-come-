import { randomInt } from 'node:crypto'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { database, schema } from '@/lib/database/client'
import { calculateNominationWeight } from '@/lib/draw/calculateNominationWeight'
import { calculateQualityMultiplier } from '@/lib/draw/calculateQualityMultiplier'
import {
  applySessionOutcome,
  buildSessionContenders,
  selectSessionWinner,
  type SessionParticipant,
  type SessionPoolRestaurant,
} from '@/lib/draw/selectSessionWinner'
import { checkQuorum } from '@/lib/draw/checkQuorum'
import { resolveBannedRestaurant, type BanOutcome } from '@/lib/draw/resolveBannedRestaurant'
import { loadNominatorQuality } from './drawService'
import { publishSessionChanged } from '@/lib/realtime/sessionChannel'

const randomFraction = () => randomInt(0, 1_000_000) / 1_000_000

export const collectingStatus = 'collecting'
export const revealingStatus = 'revealing'
export const drawnStatus = 'drawn'

const abandonedRevealInMilliseconds = 30 * 60 * 1000

const selectLatestOpenSession = async () => {
  const rows = await database
    .select()
    .from(schema.drawSessions)
    .where(inArray(schema.drawSessions.status, [collectingStatus, revealingStatus]))
    .orderBy(desc(schema.drawSessions.roundNumber))
    .limit(1)

  return rows.at(0) ?? null
}

const closeAbandonedReveal = async (sessionId: string) =>
  database
    .update(schema.drawSessions)
    .set({ status: drawnStatus })
    .where(
      and(eq(schema.drawSessions.id, sessionId), eq(schema.drawSessions.status, revealingStatus)),
    )

export const findOpenSession = async () => {
  const session = await selectLatestOpenSession()
  if (!session) return null
  if (session.status !== revealingStatus) return session

  const revealAge = Date.now() - (session.drawnAt?.getTime() ?? 0)
  if (revealAge < abandonedRevealInMilliseconds) return session

  await closeAbandonedReveal(session.id)
  await publishSessionChanged(session.id)
  return selectLatestOpenSession()
}

export const openSession = async (memberId: string) => {
  const existing = await findOpenSession()
  if (existing) return { ok: false as const, reason: 'ALREADY_OPEN' as const }

  const lastSessionRows = await database
    .select({ roundNumber: schema.drawSessions.roundNumber })
    .from(schema.drawSessions)
    .orderBy(desc(schema.drawSessions.roundNumber))
    .limit(1)

  const lastDrawRows = await database
    .select({ roundNumber: schema.draws.roundNumber })
    .from(schema.draws)
    .orderBy(desc(schema.draws.roundNumber))
    .limit(1)

  const highestRoundNumber = Math.max(
    lastSessionRows.at(0)?.roundNumber ?? 0,
    lastDrawRows.at(0)?.roundNumber ?? 0,
  )
  const roundNumber = highestRoundNumber + 1

  const [session] = await database
    .insert(schema.drawSessions)
    .values({ roundNumber, openedByMemberId: memberId, status: collectingStatus })
    .returning()

  await database
    .insert(schema.sessionParticipants)
    .values({ sessionId: session.id, memberId })
    .onConflictDoNothing()

  return { ok: true as const, session }
}

export const joinSession = async (sessionId: string, memberId: string) => {
  await database
    .insert(schema.sessionParticipants)
    .values({ sessionId, memberId })
    .onConflictDoNothing()
}

const appendToMemberRanking = async (
  sessionId: string,
  memberId: string,
  restaurantId: string,
) => {
  const existing = await database
    .select({ restaurantId: schema.sessionPreferences.restaurantId })
    .from(schema.sessionPreferences)
    .where(
      and(
        eq(schema.sessionPreferences.sessionId, sessionId),
        eq(schema.sessionPreferences.memberId, memberId),
        eq(schema.sessionPreferences.restaurantId, restaurantId),
      ),
    )
    .limit(1)

  if (existing.length > 0) return

  const positionRows = await database
    .select({ highestPosition: sql<number | null>`max(${schema.sessionPreferences.position})` })
    .from(schema.sessionPreferences)
    .where(
      and(
        eq(schema.sessionPreferences.sessionId, sessionId),
        eq(schema.sessionPreferences.memberId, memberId),
      ),
    )

  const nextPosition = (positionRows.at(0)?.highestPosition ?? 0) + 1

  await database
    .insert(schema.sessionPreferences)
    .values({ sessionId, memberId, restaurantId, position: nextPosition })
    .onConflictDoNothing()
}

export const addRestaurantToPool = async (
  sessionId: string,
  restaurantId: string,
  memberId: string,
) => {
  const inserted = await database
    .insert(schema.sessionPoolEntries)
    .values({ sessionId, restaurantId, addedByMemberId: memberId })
    .onConflictDoNothing()
    .returning({ id: schema.sessionPoolEntries.id })

  await appendToMemberRanking(sessionId, memberId, restaurantId)

  if (inserted.length === 0) return

  await database
    .update(schema.sessionParticipants)
    .set({ isReady: false, readyAt: null })
    .where(eq(schema.sessionParticipants.sessionId, sessionId))
}

export const saveMemberPreferences = async (
  sessionId: string,
  memberId: string,
  rankedRestaurantIds: ReadonlyArray<string>,
) => {
  await database.transaction(async (transaction) => {
    await transaction
      .delete(schema.sessionPreferences)
      .where(
        and(
          eq(schema.sessionPreferences.sessionId, sessionId),
          eq(schema.sessionPreferences.memberId, memberId),
        ),
      )

    if (rankedRestaurantIds.length === 0) return

    await transaction.insert(schema.sessionPreferences).values(
      rankedRestaurantIds.map((restaurantId, index) => ({
        sessionId,
        memberId,
        restaurantId,
        position: index + 1,
      })),
    )
  })
}

export const setParticipantReady = async (
  sessionId: string,
  memberId: string,
  isReady: boolean,
) => {
  await database
    .update(schema.sessionParticipants)
    .set({ isReady, readyAt: isReady ? new Date() : null })
    .where(
      and(
        eq(schema.sessionParticipants.sessionId, sessionId),
        eq(schema.sessionParticipants.memberId, memberId),
      ),
    )
}

const loadVisitHistoryByRestaurant = async () => {
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

export type RevealedContender = {
  restaurantId: string
  name: string
  addedByName: string
  chance: number
}

export type SettledBanTiebreak = {
  bannedRestaurantId: string | null
  tiedRestaurantIds: string[]
  tiedRestaurantNames: string[]
  wasDecidedByTiebreak: boolean
}

const loadDrawSummary = async (drawId: string | null) => {
  if (!drawId) return null

  const drawRows = await database
    .select({
      restaurantId: schema.draws.restaurantId,
      fallbackRestaurantId: schema.draws.fallbackRestaurantId,
      weightSnapshot: schema.draws.weightSnapshot,
      visitId: schema.visits.id,
    })
    .from(schema.draws)
    .leftJoin(schema.visits, eq(schema.visits.drawId, schema.draws.id))
    .where(eq(schema.draws.id, drawId))
    .limit(1)

  const drawRow = drawRows.at(0)
  if (!drawRow) return null

  const snapshot = drawRow.weightSnapshot as {
    banTiebreak?: SettledBanTiebreak
    contenders?: RevealedContender[]
  } | null

  return {
    winnerRestaurantId: drawRow.restaurantId,
    fallbackRestaurantId: drawRow.fallbackRestaurantId,
    visitId: drawRow.visitId,
    banTiebreak: snapshot?.banTiebreak ?? null,
    contenders: snapshot?.contenders ?? [],
  }
}

const buildBanTiebreak = (
  settled: SettledBanTiebreak | null,
  outcome: BanOutcome,
  bannedRestaurantId: string | null,
  restaurantNameById: ReadonlyMap<string, string>,
): SettledBanTiebreak => {
  if (settled) return settled

  return {
    bannedRestaurantId,
    tiedRestaurantIds: outcome.tiedRestaurantIds,
    tiedRestaurantNames: outcome.tiedRestaurantIds.map(
      (restaurantId) => restaurantNameById.get(restaurantId) ?? 'Restaurante',
    ),
    wasDecidedByTiebreak: outcome.wasDecidedByTiebreak,
  }
}

export const loadSessionState = async (sessionId: string, banTiebreakFraction?: number) => {
  const sessionRows = await database
    .select()
    .from(schema.drawSessions)
    .where(eq(schema.drawSessions.id, sessionId))
    .limit(1)

  const session = sessionRows.at(0)
  if (!session) return null

  const participantRows = await database
    .select({
      memberId: schema.sessionParticipants.memberId,
      displayName: schema.members.displayName,
      isReady: schema.sessionParticipants.isReady,
      roundsSinceLastWin: schema.members.roundsSinceLastWin,
    })
    .from(schema.sessionParticipants)
    .innerJoin(schema.members, eq(schema.members.id, schema.sessionParticipants.memberId))
    .where(eq(schema.sessionParticipants.sessionId, sessionId))

  const addedByMember = alias(schema.members, 'added_by_member')
  const ownerMember = alias(schema.members, 'owner_member')

  const poolRows = await database
    .select({
      restaurantId: schema.sessionPoolEntries.restaurantId,
      putInRoundByMemberId: schema.sessionPoolEntries.addedByMemberId,
      putInRoundByName: addedByMember.displayName,
      ownerMemberId: schema.restaurants.createdBy,
      ownerName: ownerMember.displayName,
      name: schema.restaurants.name,
      neighborhood: schema.restaurants.neighborhood,
      cuisines: schema.restaurants.cuisines,
    })
    .from(schema.sessionPoolEntries)
    .innerJoin(
      schema.restaurants,
      eq(schema.restaurants.id, schema.sessionPoolEntries.restaurantId),
    )
    .innerJoin(addedByMember, eq(addedByMember.id, schema.sessionPoolEntries.addedByMemberId))
    .leftJoin(ownerMember, eq(ownerMember.id, schema.restaurants.createdBy))
    .where(eq(schema.sessionPoolEntries.sessionId, sessionId))

  const preferenceRows = await database
    .select({
      memberId: schema.sessionPreferences.memberId,
      restaurantId: schema.sessionPreferences.restaurantId,
      position: schema.sessionPreferences.position,
    })
    .from(schema.sessionPreferences)
    .where(eq(schema.sessionPreferences.sessionId, sessionId))

  const vetoRows = await database
    .select({
      restaurantId: schema.vetoes.restaurantId,
      memberId: schema.vetoes.memberId,
      memberName: schema.members.displayName,
    })
    .from(schema.vetoes)
    .innerJoin(schema.members, eq(schema.members.id, schema.vetoes.memberId))
    .where(
      and(
        eq(schema.vetoes.roundNumber, session.roundNumber),
        eq(schema.vetoes.banRound, session.banRound),
      ),
    )
    .orderBy(asc(schema.vetoes.createdAt), asc(schema.vetoes.id))

  const decidedMemberIds = new Set(vetoRows.map((veto) => veto.memberId))
  const isAlreadyDrawn = session.status !== collectingStatus
  const everyoneReadyNow =
    participantRows.length > 0 && participantRows.every((participant) => participant.isReady)

  const banOutcome = resolveBannedRestaurant(vetoRows, banTiebreakFraction)
  const drawSummary = isAlreadyDrawn ? await loadDrawSummary(session.drawId) : null
  const settledBanTiebreak = drawSummary?.banTiebreak ?? null
  const bannedRestaurantId = settledBanTiebreak
    ? settledBanTiebreak.bannedRestaurantId
    : banOutcome.bannedRestaurantId
  const visibleBannedRestaurantId = isAlreadyDrawn ? bannedRestaurantId : null
  const previousDrawRows = await database
    .select({ restaurantId: schema.draws.restaurantId })
    .from(schema.draws)
    .orderBy(desc(schema.draws.roundNumber))
    .limit(1)
  const previousWinnerRestaurantId = previousDrawRows.at(0)?.restaurantId ?? null

  const nominatorQuality = await loadNominatorQuality()
  const visitHistory = await loadVisitHistoryByRestaurant()

  const participants: SessionParticipant[] = participantRows.map((row) => ({
    memberId: row.memberId,
    roundsSinceLastWin: row.roundsSinceLastWin,
    qualityMultiplier: calculateQualityMultiplier(
      nominatorQuality.averageByMember.get(row.memberId) ?? null,
      nominatorQuality.groupAverage,
    ),
  }))

  const pool: SessionPoolRestaurant[] = poolRows.map((row) => {
    const history = visitHistory.get(row.restaurantId)
    return {
      restaurantId: row.restaurantId,
      addedByMemberId: row.ownerMemberId ?? row.putInRoundByMemberId,
      putInRoundByMemberId: row.putInRoundByMemberId,
      revisitWeight: calculateNominationWeight({
        visitCount: history?.visitCount ?? 0,
        lastVisitedAt: history?.lastVisitedAt ? new Date(history.lastVisitedAt) : null,
      }),
      isVetoed: row.restaurantId === bannedRestaurantId,
      isPreviousWinner: row.restaurantId === previousWinnerRestaurantId,
    }
  })

  const preferencesByMember = new Map<string, { restaurantId: string; position: number }[]>()
  preferenceRows.forEach((row) => {
    const existing = preferencesByMember.get(row.memberId) ?? []
    preferencesByMember.set(row.memberId, [
      ...existing,
      { restaurantId: row.restaurantId, position: row.position },
    ])
  })

  const preferences = [...preferencesByMember.entries()].map(([memberId, entries]) => ({
    memberId,
    rankedRestaurantIds: [...entries]
      .sort((first, second) => first.position - second.position)
      .map((entry) => entry.restaurantId),
  }))

  const totalMemberRows = await database.select({ id: schema.members.id }).from(schema.members)
  const quorum = checkQuorum(participantRows.length, totalMemberRows.length)

  const contenders = buildSessionContenders(pool, participants, preferences)
  const previewPool = pool.map((entry) => ({ ...entry, isVetoed: false }))
  const previewContenders = isAlreadyDrawn
    ? contenders
    : buildSessionContenders(previewPool, participants, preferences)
  const restaurantById = new Map(poolRows.map((row) => [row.restaurantId, row]))
  const restaurantNameById = new Map(poolRows.map((row) => [row.restaurantId, row.name]))
  const banVotesByRestaurant = new Map(
    banOutcome.tally.map((entry) => [entry.restaurantId, entry.votes]),
  )
  return {
    session,
    participants: participantRows.map((row) => ({
      memberId: row.memberId,
      displayName: row.displayName,
      isReady: row.isReady,
      rankedCount: preferencesByMember.get(row.memberId)?.length ?? 0,
    })),
    pool: poolRows.map((row) => ({
      restaurantId: row.restaurantId,
      name: row.name,
      neighborhood: row.neighborhood,
      cuisines: row.cuisines,
      addedByMemberId: isAlreadyDrawn ? (row.ownerMemberId ?? row.putInRoundByMemberId) : '',
      addedByName: isAlreadyDrawn ? (row.ownerName ?? row.putInRoundByName) : '',
      putInRoundByName: isAlreadyDrawn ? row.putInRoundByName : '',
      effectiveOwnerMemberId: row.ownerMemberId ?? row.putInRoundByMemberId,
      isPreviousWinner: row.restaurantId === previousWinnerRestaurantId,
      isBanned: row.restaurantId === visibleBannedRestaurantId,
      banVotes: isAlreadyDrawn ? (banVotesByRestaurant.get(row.restaurantId) ?? 0) : 0,
    })),
    myPreferences: preferencesByMember,
    revealedContenders: contenders.map((contender) => ({
      ...contender,
      name: restaurantById.get(contender.restaurantId)?.name ?? 'Restaurante',
      addedByName:
        restaurantById.get(contender.restaurantId)?.ownerName ??
        restaurantById.get(contender.restaurantId)?.putInRoundByName ??
        '',
    })),
    contenders: previewContenders.map((contender) => ({
      ...contender,
      addedByMemberId: isAlreadyDrawn ? contender.addedByMemberId : '',
      ownerWeight: isAlreadyDrawn ? contender.ownerWeight : 1,
      name: restaurantById.get(contender.restaurantId)?.name ?? 'Restaurante',
      addedByName: isAlreadyDrawn
        ? (restaurantById.get(contender.restaurantId)?.ownerName ??
          restaurantById.get(contender.restaurantId)?.putInRoundByName ??
          '')
        : '',
    })),
    quorum,
    winnerRestaurantId: drawSummary?.winnerRestaurantId ?? null,
    revealContenders: drawSummary?.contenders ?? [],
    fallbackRestaurantId: drawSummary?.fallbackRestaurantId ?? null,
    visitId: drawSummary?.visitId ?? null,
    bannedRestaurantName:
      poolRows.find((row) => row.restaurantId === bannedRestaurantId)?.name ?? null,
    banTiebreak: buildBanTiebreak(
      settledBanTiebreak,
      banOutcome,
      bannedRestaurantId,
      restaurantNameById,
    ),
    banOutcome: {
      bannedRestaurantId: visibleBannedRestaurantId,
      decidedCount: decidedMemberIds.size,
      participantCount: participantRows.length,
    },
    banDecidedMemberIds: [...decidedMemberIds],
    detailedBallots: participantRows.map((participant) => ({
      memberId: participant.memberId,
      displayName: participant.displayName,
      ranking: (preferencesByMember.get(participant.memberId) ?? [])
        .sort((first, second) => first.position - second.position)
        .map((entry) => ({
          position: entry.position,
          restaurantId: entry.restaurantId,
          restaurantName:
            poolRows.find((row) => row.restaurantId === entry.restaurantId)?.name ?? 'Restaurante',
        })),
      banVote: (() => {
        const vote = vetoRows.find((veto) => veto.memberId === participant.memberId)
        if (!vote) return null
        if (!vote.restaurantId) return { restaurantId: null, restaurantName: null }
        return {
          restaurantId: vote.restaurantId,
          restaurantName:
            poolRows.find((row) => row.restaurantId === vote.restaurantId)?.name ?? 'Restaurante',
        }
      })(),
    })),
    banVotesByMember: new Map(
      vetoRows.flatMap((veto) =>
        veto.restaurantId ? [[veto.memberId, veto.restaurantId] as const] : [],
      ),
    ),
    everyoneReady: everyoneReadyNow,
    rawPool: pool,
    rawParticipants: participants,
    rawPreferences: preferences,
  }
}


export const closeReveal = async (sessionId: string, memberId: string, isAdmin: boolean) => {
  const sessionRows = await database
    .select({
      id: schema.drawSessions.id,
      status: schema.drawSessions.status,
      drawnByMemberId: schema.drawSessions.drawnByMemberId,
    })
    .from(schema.drawSessions)
    .where(eq(schema.drawSessions.id, sessionId))
    .limit(1)

  const session = sessionRows.at(0)
  if (!session) return { ok: false as const, reason: 'NOT_FOUND' as const }
  if (session.status !== revealingStatus) {
    return { ok: false as const, reason: 'NOT_REVEALING' as const }
  }
  if (!isAdmin && session.drawnByMemberId !== memberId) {
    return { ok: false as const, reason: 'NOT_ALLOWED' as const }
  }

  await database
    .update(schema.drawSessions)
    .set({ status: drawnStatus })
    .where(
      and(eq(schema.drawSessions.id, sessionId), eq(schema.drawSessions.status, revealingStatus)),
    )

  return { ok: true as const }
}

export const runSessionDraw = async (sessionId: string, drawnByMemberId: string) => {
  const state = await loadSessionState(sessionId, randomFraction())
  if (!state) return { ok: false as const, reason: 'NOT_FOUND' as const }
  if (state.session.status !== collectingStatus) {
    return { ok: false as const, reason: 'ALREADY_DRAWN' as const }
  }
  if (!state.quorum.hasQuorum) {
    return { ok: false as const, reason: 'NO_QUORUM' as const, quorum: state.quorum }
  }
  if (!state.everyoneReady) {
    const missing = state.participants.filter((participant) => !participant.isReady)
    return { ok: false as const, reason: 'NOT_READY' as const, missing }
  }
  const selection = selectSessionWinner(
    state.rawPool,
    state.rawParticipants,
    state.rawPreferences,
    randomFraction(),
    randomFraction(),
  )
  if (!selection) return { ok: false as const, reason: 'NO_CANDIDATES' as const }

  return database.transaction(async (transaction) => {
    const [draw] = await transaction
      .insert(schema.draws)
      .values({
        roundNumber: state.session.roundNumber,
        winnerMemberId: selection.addedByMemberId,
        restaurantId: selection.restaurantId,
        fallbackRestaurantId: selection.fallbackRestaurantId,
        fallbackMemberId: selection.fallbackMemberId,
        weightSnapshot: {
          participants: state.participants,
          contenders: state.revealedContenders,
          ballots: state.detailedBallots,
          bannedRestaurantName: state.bannedRestaurantName,
          banRound: state.session.banRound,
          banTiebreak: state.banTiebreak,
          fallback: (() => {
            const fallbackContender = state.revealedContenders.find(
              (contender) => contender.restaurantId === selection.fallbackRestaurantId,
            )
            if (!fallbackContender) return null
            return {
              restaurantId: fallbackContender.restaurantId,
              name: fallbackContender.name,
              addedByName: fallbackContender.addedByName,
            }
          })(),
        },
      })
      .returning()

    const [visit] = await transaction
      .insert(schema.visits)
      .values({
        restaurantId: selection.restaurantId,
        drawId: draw.id,
        recommendedByMemberId: selection.addedByMemberId,
      })
      .returning()

    await transaction
      .update(schema.drawSessions)
      .set({ status: revealingStatus, drawId: draw.id, drawnByMemberId, drawnAt: new Date() })
      .where(eq(schema.drawSessions.id, sessionId))

    const updatedParticipants = applySessionOutcome(
      state.rawParticipants,
      selection.addedByMemberId,
    )

    await Promise.all(
      updatedParticipants.map((participant) =>
        transaction
          .update(schema.members)
          .set({ roundsSinceLastWin: participant.roundsSinceLastWin })
          .where(eq(schema.members.id, participant.memberId)),
      ),
    )

    await transaction.insert(schema.ratingSessionParticipants).values(
      state.participants.map((participant) => ({
        visitId: visit.id,
        memberId: participant.memberId,
      })),
    )

    return {
      ok: true as const,
      draw,
      visit,
      selection,
      contenders: state.revealedContenders,
      bannedRestaurantName: state.bannedRestaurantName,
      banTiebreak: state.banTiebreak,
    }
  })
}
