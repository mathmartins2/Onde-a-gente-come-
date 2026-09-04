import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { database, schema } from '@/lib/database/client'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'

const fallbackSchema = z.object({ usedFallback: z.boolean() })

export const PUT = async (request: Request, context: { params: Promise<{ visitId: string }> }) =>
  withMember(async () => {
    const { visitId } = await context.params
    const body = await request.json().catch(() => null)
    const parsed = fallbackSchema.safeParse(body)
    if (!parsed.success) return validationErrorResponse('Dados inválidos')

    const visitRows = await database
      .select({
        id: schema.visits.id,
        drawId: schema.visits.drawId,
        revealedAt: schema.visits.revealedAt,
      })
      .from(schema.visits)
      .where(eq(schema.visits.id, visitId))
      .limit(1)

    const visit = visitRows.at(0)
    if (!visit) return NextResponse.json({ error: 'Visita não encontrada' }, { status: 404 })
    if (visit.revealedAt) return validationErrorResponse('As notas já foram reveladas')
    if (!visit.drawId) return validationErrorResponse('Essa visita não veio de um sorteio')

    const drawRows = await database
      .select({
        restaurantId: schema.draws.restaurantId,
        fallbackRestaurantId: schema.draws.fallbackRestaurantId,
        winnerMemberId: schema.draws.winnerMemberId,
        fallbackMemberId: schema.draws.fallbackMemberId,
      })
      .from(schema.draws)
      .where(eq(schema.draws.id, visit.drawId))
      .limit(1)

    const draw = drawRows.at(0)
    if (!draw) return validationErrorResponse('Sorteio não encontrado')
    if (parsed.data.usedFallback && !draw.fallbackRestaurantId) {
      return validationErrorResponse('Esse sorteio não teve segundo lugar')
    }

    const [updated] = await database
      .update(schema.visits)
      .set({
        usedFallback: parsed.data.usedFallback,
        restaurantId: parsed.data.usedFallback
          ? (draw.fallbackRestaurantId ?? draw.restaurantId)
          : draw.restaurantId,
        recommendedByMemberId: parsed.data.usedFallback
          ? (draw.fallbackMemberId ?? draw.winnerMemberId)
          : draw.winnerMemberId,
      })
      .where(eq(schema.visits.id, visitId))
      .returning()

    return NextResponse.json({ visit: updated })
  })
