import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { banDecisionSchema } from '@/lib/validation/schemas'
import { findOpenSession } from '@/lib/services/sessionService'

export const PUT = async (request: Request) =>
  withMember(async (member) => {
    const body = await request.json().catch(() => null)
    const parsed = banDecisionSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Dados inválidos')
    }

    const session = await findOpenSession()
    if (!session) return validationErrorResponse('Não há sorteio aberto')

    const restaurantId = parsed.data.restaurantId
    if (restaurantId !== null) {
      const poolRows = await database
        .select({ restaurantId: schema.sessionPoolEntries.restaurantId })
        .from(schema.sessionPoolEntries)
        .where(
          and(
            eq(schema.sessionPoolEntries.sessionId, session.id),
            eq(schema.sessionPoolEntries.restaurantId, restaurantId),
          ),
        )
        .limit(1)

      if (poolRows.length === 0) return validationErrorResponse('Esse lugar não está na rodada')
    }

    const [decision] = await database
      .insert(schema.vetoes)
      .values({ memberId: member.id, restaurantId, roundNumber: session.roundNumber })
      .onConflictDoUpdate({
        target: [schema.vetoes.memberId, schema.vetoes.roundNumber],
        set: { restaurantId, createdAt: new Date() },
      })
      .returning()

    return NextResponse.json({ decision })
  })

export const DELETE = async () =>
  withMember(async (member) => {
    const session = await findOpenSession()
    if (!session) return validationErrorResponse('Não há sorteio aberto')

    await database
      .delete(schema.vetoes)
      .where(
        and(
          eq(schema.vetoes.memberId, member.id),
          eq(schema.vetoes.roundNumber, session.roundNumber),
        ),
      )

    return NextResponse.json({ ok: true })
  })
