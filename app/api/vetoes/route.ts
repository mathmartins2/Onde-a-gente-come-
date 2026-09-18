import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { banDecisionSchema } from '@/lib/validation/schemas'
import { collectingStatus, findOpenSession } from '@/lib/services/sessionService'
import { publishSessionChanged } from '@/lib/realtime/sessionChannel'

export const PUT = async (request: Request) =>
  withMember(async (member) => {
    const body = await request.json().catch(() => null)
    const parsed = banDecisionSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Dados inválidos')
    }

    const session = await findOpenSession()
    if (!session) return validationErrorResponse('Não há sorteio aberto')
    if (session.status !== collectingStatus) {
      return validationErrorResponse('A votação dessa rodada já fechou')
    }

    const restaurantId = parsed.data.restaurantId
    if (restaurantId !== null) {
      const poolRows = await database
        .select({
          restaurantId: schema.sessionPoolEntries.restaurantId,
          putInRoundByMemberId: schema.sessionPoolEntries.addedByMemberId,
          ownerMemberId: schema.restaurants.createdBy,
        })
        .from(schema.sessionPoolEntries)
        .innerJoin(
          schema.restaurants,
          eq(schema.restaurants.id, schema.sessionPoolEntries.restaurantId),
        )
        .where(
          and(
            eq(schema.sessionPoolEntries.sessionId, session.id),
            eq(schema.sessionPoolEntries.restaurantId, restaurantId),
          ),
        )
        .limit(1)

      const poolEntry = poolRows.at(0)
      if (!poolEntry) return validationErrorResponse('Esse lugar não está na rodada')

      const effectiveOwnerMemberId = poolEntry.ownerMemberId ?? poolEntry.putInRoundByMemberId
      if (effectiveOwnerMemberId === member.id) {
        return validationErrorResponse('Você não pode banir um lugar que você indicou')
      }
    }

    const [decision] = await database
      .insert(schema.vetoes)
      .values({
        memberId: member.id,
        restaurantId,
        roundNumber: session.roundNumber,
        banRound: session.banRound,
      })
      .onConflictDoUpdate({
        target: [schema.vetoes.memberId, schema.vetoes.roundNumber, schema.vetoes.banRound],
        set: { restaurantId, createdAt: new Date() },
      })
      .returning()

    await publishSessionChanged(session.id)

    return NextResponse.json({ decision })
  })

export const DELETE = async () =>
  withMember(async (member) => {
    const session = await findOpenSession()
    if (!session) return validationErrorResponse('Não há sorteio aberto')
    if (session.status !== collectingStatus) {
      return validationErrorResponse('A votação dessa rodada já fechou')
    }

    await database
      .delete(schema.vetoes)
      .where(
        and(
          eq(schema.vetoes.memberId, member.id),
          eq(schema.vetoes.roundNumber, session.roundNumber),
          eq(schema.vetoes.banRound, session.banRound),
        ),
      )

    await publishSessionChanged(session.id)

    return NextResponse.json({ ok: true })
  })
