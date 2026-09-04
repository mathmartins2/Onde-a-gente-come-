import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { startBanRunoff } from '@/lib/services/sessionService'

const failureMessages: Record<string, string> = {
  NOT_FOUND: 'Sorteio não encontrado',
  NO_TIE: 'Não há empate para desempatar',
}

export const POST = async (_request: Request, context: { params: Promise<{ sessionId: string }> }) =>
  withMember(async () => {
    const { sessionId } = await context.params
    const result = await startBanRunoff(sessionId)

    if (result.ok) return NextResponse.json({ banRound: result.banRound })

    return NextResponse.json(
      { error: failureMessages[result.reason] ?? 'Não foi possível iniciar o desempate' },
      { status: 409 },
    )
  })
