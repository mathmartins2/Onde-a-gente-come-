import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { sessionPoolSchema } from '@/lib/validation/schemas'
import { findOpenSession } from '@/lib/services/sessionService'

export const POST = async (request: Request) =>
  withMember(async (member) => {
    const body = await request.json().catch(() => null)
    const parsed = sessionPoolSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Dados inválidos')
    }

    const session = await findOpenSession()
    if (!session) return validationErrorResponse('Não há sorteio aberto')

    const poolRows = await database
      .select({ addedByMemberId: schema.sessionPoolEntries.addedByMemberId })
      .from(schema.sessionPoolEntries)
      .where(
        and(
          eq(schema.sessionPoolEntries.sessionId, session.id),
          eq(schema.sessionPoolEntries.restaurantId, parsed.data.restaurantId),
        ),
      )
      .limit(1)

    const poolEntry = poolRows.at(0)
    if (!poolEntry) return validationErrorResponse('Esse lugar não está na rodada')
    const [veto] = await database
      .insert(schema.vetoes)
      .values({
        memberId: member.id,
        restaurantId: parsed.data.restaurantId,
        roundNumber: session.roundNumber,
      })
      .onConflictDoUpdate({
        target: [schema.vetoes.memberId, schema.vetoes.roundNumber],
        set: { restaurantId: parsed.data.restaurantId, createdAt: new Date() },
      })
      .returning()

    return NextResponse.json({ veto })
  })
