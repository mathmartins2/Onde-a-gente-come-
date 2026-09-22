import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { importRestaurantPhotoFromWebsite } from '@/lib/services/imageService'

export const runtime = 'nodejs'

export const POST = async (_request: Request, context: { params: Promise<{ restaurantId: string }> }) =>
  withMember(async () => {
    const { restaurantId } = await context.params
    const outcome = await importRestaurantPhotoFromWebsite(restaurantId)
    if (!outcome.found) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }
    if (!outcome.photoUrl) {
      return NextResponse.json(
        { error: 'Não achei uma foto no site. Manda uma do seu celular.' },
        { status: 422 },
      )
    }
    return NextResponse.json({ photoUrl: outcome.photoUrl })
  })
