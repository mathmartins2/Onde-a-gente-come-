import { NextResponse } from 'next/server'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { readySchema } from '@/lib/validation/schemas'
import { setParticipantReady } from '@/lib/services/sessionService'
import { publishSessionChanged } from '@/lib/realtime/sessionChannel'

export const POST = async (request: Request, context: { params: Promise<{ sessionId: string }> }) =>
  withMember(async (member) => {
    const { sessionId } = await context.params
    const body = await request.json().catch(() => null)
    const parsed = readySchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Dados inválidos')
    }

    await setParticipantReady(sessionId, member.id, parsed.data.isReady)
    await publishSessionChanged(sessionId)

    return NextResponse.json({ ok: true })
  })
