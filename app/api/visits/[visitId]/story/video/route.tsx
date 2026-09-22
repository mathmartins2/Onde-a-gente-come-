import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { memberCardCanvasSize } from '@/lib/share/buildStoryVideoFilterGraph'
import { loadStoryFonts } from '@/lib/share/loadStoryFonts'
import { loadStoryImageDataUrl } from '@/lib/share/loadStoryImage'
import { MemberScoreCard } from '@/lib/share/MemberScoreCard'
import { renderStoryVideo } from '@/lib/share/renderStoryVideo'
import { storyColors, storySize } from '@/lib/share/storyTheme'
import { VisitStory, type VisitStoryData } from '@/lib/share/VisitStory'
import { listFirstDishPhotoKeyByMember } from '@/lib/services/dishPhotoService'
import { loadVisitStory, loadVisitStoryVideoPhotos } from '@/lib/services/visitStoryService'

export const runtime = 'nodejs'
export const maxDuration = 120

const cardTiltDegrees = [-5, 4, -3, 5, -4, 3]

const renderPng = async (element: React.ReactElement, size: { width: number; height: number }) => {
  const image = new ImageResponse(element, { ...size, fonts: await loadStoryFonts() })
  return Buffer.from(await image.arrayBuffer())
}

const renderMemberCards = async (visitId: string, ratings: VisitStoryData['ratings']) => {
  const firstPhotoKeyByMember = await listFirstDishPhotoKeyByMember(visitId)
  return Promise.all(
    ratings.map(async (rating, ratingIndex) =>
      renderPng(
        <MemberScoreCard
          card={{
            displayName: rating.displayName,
            score: rating.score,
            comment: rating.comment,
            avatarDataUrl: rating.avatarDataUrl,
            dishPhotoDataUrl: await loadStoryImageDataUrl(firstPhotoKeyByMember.get(rating.memberId) ?? null, 'storyCardPhoto'),
            tiltDegrees: cardTiltDegrees[ratingIndex % cardTiltDegrees.length],
          }}
        />,
        memberCardCanvasSize,
      ),
    ),
  )
}

export const GET = async (_request: Request, context: RouteContext<'/api/visits/[visitId]/story/video'>) =>
  withMember(async () => {
    const { visitId } = await context.params
    const outcome = await loadVisitStory(visitId)
    if (outcome.status === 'missing') return NextResponse.json({ error: 'Visita não encontrada' }, { status: 404 })
    if (outcome.status === 'hidden') {
      return NextResponse.json({ error: 'A nota ainda não foi revelada' }, { status: 409 })
    }

    const photoJpegs = await loadVisitStoryVideoPhotos(visitId)

    const [foregroundPng, outlinePng, cardPngs] = await Promise.all([
      renderPng(<VisitStory data={outcome.data} variant="videoForeground" />, storySize),
      renderPng(<VisitStory data={outcome.data} variant="scoreCardOutline" />, storySize),
      renderMemberCards(visitId, outcome.data.ratings),
    ])
    const video = await renderStoryVideo({
      foregroundPng,
      photoJpegs,
      cardPngs,
      borderLight: { outlinePng, colorHex: storyColors.accent },
    })

    return new Response(new Uint8Array(video), {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(video.byteLength),
        'Cache-Control': 'private, no-store',
      },
    })
  })
