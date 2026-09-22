import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { loadStoryFonts } from '@/lib/share/loadStoryFonts'
import { loadStoryImageDataUrl } from '@/lib/share/loadStoryImage'
import { storySize } from '@/lib/share/storyTheme'
import { YearSlideStory } from '@/lib/share/YearSlideStory'
import { loadYearInReview } from '@/lib/services/yearInReviewService'
import { resolveYearInAppTimeZone } from '@/lib/utilities/appTimeZone'

export const runtime = 'nodejs'

export const GET = async (_request: Request, context: { params: Promise<{ slideKey: string }> }) =>
  withMember(async (member) => {
    const { slideKey } = await context.params
    const yearInReview = await loadYearInReview(resolveYearInAppTimeZone(new Date()), member.id)
    const slide = yearInReview.slides.find((candidate) => candidate.key === slideKey)
    if (!slide) return NextResponse.json({ error: 'Tela não encontrada' }, { status: 404 })

    const [photoDataUrl, avatarDataUrl, entryAvatarDataUrls, galleryDataUrls] = await Promise.all([
      loadStoryImageDataUrl(slide.photoImageKey, 'storyBackground'),
      loadStoryImageDataUrl(slide.avatar?.imageKey ?? null, 'storyAvatar'),
      Promise.all(slide.entries.map((entry) => loadStoryImageDataUrl(entry.avatar?.imageKey ?? null, 'storyAvatar'))),
      Promise.all(slide.galleryImageKeys.map((imageKey) => loadStoryImageDataUrl(imageKey, 'storyPolaroid'))),
    ])

    return new ImageResponse(
      <YearSlideStory
        year={yearInReview.year}
        slide={slide}
        images={{
          photoDataUrl,
          avatarDataUrl,
          entryAvatarDataUrls,
          galleryDataUrls: galleryDataUrls.flatMap((dataUrl) => (dataUrl ? [dataUrl] : [])),
        }}
      />,
      { ...storySize, fonts: await loadStoryFonts(), headers: { 'Cache-Control': 'private, no-store' } },
    )
  })
