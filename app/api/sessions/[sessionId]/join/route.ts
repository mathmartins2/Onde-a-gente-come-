import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { joinSession } from '@/lib/services/sessionService'

export const POST = async (_request: Request, context: { params: Promise<{ sessionId: string }> }) =>
  withMember(async (member) => {
    const { sessionId } = await context.params
    await joinSession(sessionId, member.id)
    return NextResponse.json({ ok: true })
  })
