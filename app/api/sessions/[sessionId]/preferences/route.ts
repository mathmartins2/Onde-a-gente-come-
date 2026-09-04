import { NextResponse } from 'next/server'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { sessionPreferencesSchema } from '@/lib/validation/schemas'
import { joinSession, saveMemberPreferences } from '@/lib/services/sessionService'

export const PUT = async (request: Request, context: { params: Promise<{ sessionId: string }> }) =>
  withMember(async (member) => {
    const { sessionId } = await context.params
    const body = await request.json().catch(() => null)
    const parsed = sessionPreferencesSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Dados inválidos')
    }

    await joinSession(sessionId, member.id)
    await saveMemberPreferences(sessionId, member.id, parsed.data.rankedRestaurantIds)
    return NextResponse.json({ ok: true })
  })
