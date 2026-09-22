import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validationErrorResponse, withMember } from '@/lib/http/routeHelpers'
import { buildPublicRestaurantPath, ensureVisitRestaurantShareToken } from '@/lib/services/publicRestaurantService'

export const POST = async (_request: Request, context: RouteContext<'/api/visits/[visitId]/public-link'>) =>
  withMember(async () => {
    const { visitId } = await context.params
    if (!z.uuid().safeParse(visitId).success) return validationErrorResponse('Rodada inválida')

    const shareToken = await ensureVisitRestaurantShareToken(visitId)
    if (!shareToken) return NextResponse.json({ error: 'Rodada não encontrada' }, { status: 404 })

    return NextResponse.json({ path: buildPublicRestaurantPath(shareToken) })
  })
