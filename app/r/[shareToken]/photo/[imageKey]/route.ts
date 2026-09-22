import { NextResponse } from 'next/server'
import { loadPublicRestaurantPhoto } from '@/lib/services/publicRestaurantService'

export const runtime = 'nodejs'

export const GET = async (_request: Request, context: RouteContext<'/r/[shareToken]/photo/[imageKey]'>) => {
  const { shareToken, imageKey } = await context.params
  const photo = await loadPublicRestaurantPhoto(shareToken, imageKey)
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
