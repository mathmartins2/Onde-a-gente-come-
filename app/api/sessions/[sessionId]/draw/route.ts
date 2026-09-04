import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { runSessionDraw } from '@/lib/services/sessionService'

const failureMessages: Record<string, string> = {
  NOT_FOUND: 'Sorteio não encontrado',
  ALREADY_DRAWN: 'Esse sorteio já foi feito',
  NO_CANDIDATES: 'Ninguém ranqueou nenhum restaurante',
}

export const POST = async (_request: Request, context: { params: Promise<{ sessionId: string }> }) =>
  withMember(async () => {
    const { sessionId } = await context.params
    const result = await runSessionDraw(sessionId)

    if (result.ok) {
      return NextResponse.json({
        drawId: result.draw.id,
        visitId: result.visit.id,
        restaurantId: result.selection.restaurantId,
        addedByMemberId: result.selection.addedByMemberId,
        contenders: result.contenders,
      })
    }

    if (result.reason === 'NO_QUORUM') {
      return NextResponse.json(
        {
          error: `Precisa de pelo menos ${result.quorum.requiredCount} de ${result.quorum.totalMemberCount} membros na sessão. Tem ${result.quorum.presentCount}.`,
        },
        { status: 409 },
      )
    }

    if (result.reason === 'NOT_READY') {
      const names = result.missing.map((participant) => participant.displayName).join(', ')
      return NextResponse.json({ error: `Faltam dar ready: ${names}` }, { status: 409 })
    }

    return NextResponse.json(
      { error: failureMessages[result.reason] ?? 'Não foi possível sortear' },
      { status: 409 },
    )
  })
