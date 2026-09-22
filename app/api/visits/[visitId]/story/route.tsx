import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { loadStoryFonts } from '@/lib/share/loadStoryFonts'
import { storySize } from '@/lib/share/storyTheme'
import { VisitStory } from '@/lib/share/VisitStory'
import { loadVisitStory } from '@/lib/services/visitStoryService'

export const runtime = 'nodejs'

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

    return new ImageResponse(<VisitStory data={outcome.data} />, {
      ...storySize,
      fonts: await loadStoryFonts(),
      headers: { 'Cache-Control': 'private, no-store' },
    })
  })
