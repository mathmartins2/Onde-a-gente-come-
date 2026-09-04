import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { loadRatingSession } from '@/lib/services/ratingService'

export const GET = async (_request: Request, context: { params: Promise<{ visitId: string }> }) =>
  withMember(async () => {
    const { visitId } = await context.params
    const session = await loadRatingSession(visitId)
    if (!session) return NextResponse.json({ error: 'Visita não encontrada' }, { status: 404 })

    return NextResponse.json(session)
  })
