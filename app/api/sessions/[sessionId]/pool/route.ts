import { NextResponse } from 'next/server'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { sessionPoolSchema } from '@/lib/validation/schemas'
import { addRestaurantToPool, joinSession } from '@/lib/services/sessionService'

export const POST = async (request: Request, context: { params: Promise<{ sessionId: string }> }) =>
  withMember(async (member) => {
    const { sessionId } = await context.params
    const body = await request.json().catch(() => null)
    const parsed = sessionPoolSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Dados inválidos')
    }

    await joinSession(sessionId, member.id)
    await addRestaurantToPool(sessionId, parsed.data.restaurantId, member.id)
    return NextResponse.json({ ok: true })
  })
