import { randomUUID } from 'node:crypto'
import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { loadStoryFonts } from '@/lib/share/loadStoryFonts'
import { storySize } from '@/lib/share/storyTheme'
import { VisitStory } from '@/lib/share/VisitStory'
import { renderStoryOnce } from '@/lib/services/storyRenderService'
import { loadVisitStory, loadVisitStoryFingerprint } from '@/lib/services/visitStoryService'

export const runtime = 'nodejs'

const renderRevision = process.env.VERCEL_GIT_COMMIT_SHA ?? randomUUID()

export const GET = async (_request: Request, context: { params: Promise<{ visitId: string }> }) =>
  withMember(async () => {
    const { visitId } = await context.params
    const outcome = await loadVisitStory(visitId)
    if (outcome.status === 'missing') {
      return NextResponse.json({ error: 'Visita não encontrada' }, { status: 404 })
    }
    if (outcome.status === 'hidden') {
      return NextResponse.json({ error: 'A nota ainda não foi revelada' }, { status: 409 })
    }

    const story = await renderStoryOnce({
      visitId,
      kind: 'image',
      fingerprint: await loadVisitStoryFingerprint(visitId, renderRevision),
      render: async () => {
        const image = new ImageResponse(<VisitStory data={outcome.data} />, { ...storySize, fonts: await loadStoryFonts() })
        return { bytes: Buffer.from(await image.arrayBuffer()), contentType: 'image/png' }
      },
    })

    return new Response(new Uint8Array(story.bytes), {
      headers: {
        'Content-Type': story.contentType,
        'Content-Length': String(story.bytes.byteLength),
        'Cache-Control': 'private, no-store',
      },
    })
  })
