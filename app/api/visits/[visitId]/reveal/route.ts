import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { revealVisit } from '@/lib/services/ratingService'

export const POST = async (_request: Request, context: { params: Promise<{ visitId: string }> }) =>
  withMember(async () => {
    const { visitId } = await context.params
    const result = await revealVisit(visitId)
    if (!result) return NextResponse.json({ error: 'Visita não encontrada' }, { status: 404 })

    if (!result.revealed) {
      return NextResponse.json(
        { error: `Ainda faltam ${result.missing} pessoa(s) avaliar`, missing: result.missing },
        { status: 409 },
      )
    }

    return NextResponse.json(result)
  })
