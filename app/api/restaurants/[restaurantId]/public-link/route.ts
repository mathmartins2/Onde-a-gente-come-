import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validationErrorResponse, withMember } from '@/lib/http/routeHelpers'
import { buildPublicRestaurantPath, ensureRestaurantShareToken } from '@/lib/services/publicRestaurantService'

export const POST = async (_request: Request, context: RouteContext<'/api/restaurants/[restaurantId]/public-link'>) =>
  withMember(async () => {
    const { restaurantId } = await context.params
    if (!z.uuid().safeParse(restaurantId).success) return validationErrorResponse('Restaurante inválido')

    const shareToken = await ensureRestaurantShareToken(restaurantId)
    if (!shareToken) return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })

    return NextResponse.json({ path: buildPublicRestaurantPath(shareToken) })
  })
