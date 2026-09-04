import { randomInt } from 'node:crypto'
import { and, desc, eq, sql } from 'drizzle-orm'
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
import { resolveBannedRestaurant } from '@/lib/draw/resolveBannedRestaurant'
import { loadNominatorQuality } from './drawService'

const randomFraction = () => randomInt(0, 1_000_000) / 1_000_000

export const collectingStatus = 'collecting'
export const drawnStatus = 'drawn'

export const findOpenSession = async () => {
  const rows = await database
    .select()
    .from(schema.drawSessions)
    .where(eq(schema.drawSessions.status, collectingStatus))
    .orderBy(desc(schema.drawSessions.roundNumber))
    .limit(1)

  return rows.at(0) ?? null
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

export const loadSessionState = async (sessionId: string) => {
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

  const decidedMemberIds = new Set(vetoRows.map((veto) => veto.memberId))
  const isAlreadyDrawn = session.status === drawnStatus
  const everyoneReadyNow =
    participantRows.length > 0 && participantRows.every((participant) => participant.isReady)

  const banOutcome = resolveBannedRestaurant(
    vetoRows.flatMap((veto) =>
      veto.restaurantId ? [{ memberId: veto.memberId, restaurantId: veto.restaurantId }] : [],
    ),
  )
  const bannedRestaurantId = banOutcome.bannedRestaurantId
  const visibleBannedRestaurantId = isAlreadyDrawn ? bannedRestaurantId : null
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
  const banVotesByRestaurant = new Map(
    banOutcome.tally.map((entry) => [entry.restaurantId, entry.votes]),
  )
  const myBanVote =
    vetoRows.find((veto) => veto.restaurantId !== null)?.restaurantId ?? null

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
    needsBanRunoff: !isAlreadyDrawn && everyoneReadyNow && banOutcome.isTied,
    banRunoff: {
      round: session.banRound,
      restaurantIds: (session.banRunoffRestaurantIds as string[] | null) ?? null,
      tiedRestaurantIds: banOutcome.isTied
        ? banOutcome.tally
            .filter((entry) => entry.votes === banOutcome.tally[0]?.votes)
            .map((entry) => entry.restaurantId)
        : [],
    },
    bannedRestaurantName:
      poolRows.find((row) => row.restaurantId === bannedRestaurantId)?.name ?? null,
    banOutcome: {
      bannedRestaurantId: visibleBannedRestaurantId,
      isTied: isAlreadyDrawn && banOutcome.isTied,
      isRevealed: isAlreadyDrawn,
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
    everyoneReady:
      participantRows.length > 0 && participantRows.every((participant) => participant.isReady),
    rawPool: pool,
    rawParticipants: participants,
    rawPreferences: preferences,
  }
}


export const startBanRunoff = async (sessionId: string) => {
  const state = await loadSessionState(sessionId)
  if (!state) return { ok: false as const, reason: 'NOT_FOUND' as const }
  if (!state.needsBanRunoff) return { ok: false as const, reason: 'NO_TIE' as const }

  const nextBanRound = state.session.banRound + 1

  await database
    .update(schema.drawSessions)
    .set({
      banRound: nextBanRound,
      banRunoffRestaurantIds: state.banRunoff.tiedRestaurantIds,
    })
    .where(eq(schema.drawSessions.id, sessionId))

  await database
    .update(schema.sessionParticipants)
    .set({ isReady: false, readyAt: null })
    .where(eq(schema.sessionParticipants.sessionId, sessionId))

  return { ok: true as const, banRound: nextBanRound }
}

export const runSessionDraw = async (sessionId: string) => {
  const state = await loadSessionState(sessionId)
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
  if (state.needsBanRunoff) {
    return {
      ok: false as const,
      reason: 'BAN_TIE' as const,
      tiedRestaurantIds: state.banRunoff.tiedRestaurantIds,
    }
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
          fallback: state.contenders.find(
            (contender) => contender.restaurantId === selection.fallbackRestaurantId,
          )
            ? {
                restaurantId: selection.fallbackRestaurantId,
                name: state.contenders.find(
                  (contender) => contender.restaurantId === selection.fallbackRestaurantId,
                )?.name,
                addedByName: state.contenders.find(
                  (contender) => contender.restaurantId === selection.fallbackRestaurantId,
                )?.addedByName,
              }
            : null,
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
      .set({ status: drawnStatus, drawId: draw.id, drawnAt: new Date() })
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
    }
  })
}
