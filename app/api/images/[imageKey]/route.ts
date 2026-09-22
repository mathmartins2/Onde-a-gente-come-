import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { resizeToResponsiveWidth } from '@/lib/images/resizeToResponsiveWidth'
import { resolveImageStorage } from '@/lib/images/resolveImageStorage'
import { parseResponsiveWidth } from '@/lib/images/responsiveImageWidths'

export const runtime = 'nodejs'

export const GET = async (request: Request, context: { params: Promise<{ imageKey: string }> }) =>
  withMember(async () => {
    const { imageKey } = await context.params
    const storedImage = await resolveImageStorage().readImage(imageKey)
    if (!storedImage) return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })
    const requestedWidth = parseResponsiveWidth(new URL(request.url).searchParams.get('w'))
    const image = await resizeToResponsiveWidth(storedImage, requestedWidth)

    return new Response(new Uint8Array(image.bytes), {
      headers: {
        'Content-Type': image.contentType,
        'Content-Length': String(image.bytes.byteLength),
        'Cache-Control': 'private, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  })
