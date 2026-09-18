import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { closeReveal } from '@/lib/services/sessionService'
import { publishSessionChanged } from '@/lib/realtime/sessionChannel'

const failureMessages: Record<string, string> = {
  NOT_FOUND: 'Sorteio não encontrado',
  NOT_REVEALING: 'Esse sorteio já foi encerrado',
  NOT_ALLOWED: 'Só quem sorteou encerra a revelação',
}

const failureStatuses: Record<string, number> = {
  NOT_FOUND: 404,
  NOT_REVEALING: 409,
  NOT_ALLOWED: 403,
}

export const POST = async (_request: Request, context: { params: Promise<{ sessionId: string }> }) =>
  withMember(async (member) => {
    const { sessionId } = await context.params
    const result = await closeReveal(sessionId, member.id, member.isAdmin)

    if (result.ok) {
      await publishSessionChanged(sessionId)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json(
      { error: failureMessages[result.reason] ?? 'Não foi possível encerrar' },
      { status: failureStatuses[result.reason] ?? 409 },
    )
  })
