import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { resolveImageStorage } from '@/lib/images/resolveImageStorage'

export const runtime = 'nodejs'

export const GET = async (_request: Request, context: { params: Promise<{ imageKey: string }> }) =>
  withMember(async () => {
    const { imageKey } = await context.params
    const image = await resolveImageStorage().readImage(imageKey)
    if (!image) return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })

    return new Response(new Uint8Array(image.bytes), {
      headers: {
        'Content-Type': image.contentType,
        'Content-Length': String(image.bytes.byteLength),
        'Cache-Control': 'private, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  })
