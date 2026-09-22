import { NextResponse } from 'next/server'
import { parseResponsiveWidth } from '@/lib/images/responsiveImageWidths'
import { loadPublicDishPhoto } from '@/lib/services/publicRestaurantService'

export const runtime = 'nodejs'

export const GET = async (request: Request, context: RouteContext<'/r/[shareToken]/dish/[imageKey]'>) => {
  const { shareToken, imageKey } = await context.params
  const photo = await loadPublicDishPhoto(shareToken, imageKey, parseResponsiveWidth(new URL(request.url).searchParams.get('w')))
  if (!photo) return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })

  return new Response(new Uint8Array(photo.bytes), {
    headers: {
      'Content-Type': photo.contentType,
      'Content-Length': String(photo.bytes.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
