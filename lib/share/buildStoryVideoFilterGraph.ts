import type { OpaqueBounds } from './findOpaqueBounds'
import { storyColors, storyPhotoAreaHeight, storySize } from './storyTheme'

export const storyVideoFramesPerSecond = 30
export const memberCardCanvasSize = { width: 560, height: 540 } as const

const minimumVideoSeconds = 4.5
const crossfadeSeconds = 0.6
const maximumZoom = 1.12
const zoomStepPerFrame = 0.0009
const oversampledPhotoSize = 1296

const cardLeadInSeconds = 0.3
const cardVisibleSeconds = 2.4
const cardOverlapSeconds = 0.35
const cardEnterSeconds = 0.5
const cardExitSeconds = 0.45
const cardTailSeconds = 0.3
const cardRestX = Math.round((storySize.width - memberCardCanvasSize.width) / 2)
const cardDriftPixels = 40
const cardExitX = -memberCardCanvasSize.width
const cardGapAboveScoreCard = -44
const fallbackCardBaseY = 760
const cardBobPixels = 10
const cardBobPeriodSeconds = 1.8

const canvasColor = `0x${storyColors.canvas.slice(1)}`

export const borderLightSpotSize = 300
const borderLightLoopSeconds = 4
const borderMaskBlurSigma = 3
const borderLightGainCeiling = 0.35

export type StoryVideoCardWindow = { startSeconds: number; endSeconds: number }

export const planStoryVideoTimeline = (photoCount: number, cardCount: number) => {
  const cardWindows: StoryVideoCardWindow[] = Array.from({ length: cardCount }, (_, cardIndex) => {
    const startSeconds = cardLeadInSeconds + cardIndex * (cardVisibleSeconds - cardOverlapSeconds)
    return { startSeconds, endSeconds: startSeconds + cardVisibleSeconds }
  })
  const lastCardEnd = cardWindows.at(-1)?.endSeconds ?? 0
  const totalSeconds = Math.max(minimumVideoSeconds, lastCardEnd + cardTailSeconds)
  const clipSeconds = photoCount <= 1 ? totalSeconds : (totalSeconds + (photoCount - 1) * crossfadeSeconds) / photoCount

  return { totalSeconds, clipSeconds, cardWindows }
}

const formatSeconds = (seconds: number) => seconds.toFixed(3)

export const buildCardHorizontalExpression = ({ startSeconds, endSeconds }: StoryVideoCardWindow) => {
  const localTime = `(t-${formatSeconds(startSeconds)})`
  const visibleSeconds = endSeconds - startSeconds
  const driftSeconds = visibleSeconds - cardEnterSeconds - cardExitSeconds
  const enterProgress = `(${localTime}/${cardEnterSeconds})`
  const exitProgress = `((${localTime}-${formatSeconds(visibleSeconds - cardExitSeconds)})/${cardExitSeconds})`
  const driftEndX = cardRestX - cardDriftPixels

  const entering = `${storySize.width}-${storySize.width - cardRestX}*(1-pow(1-${enterProgress},3))`
  const drifting = `${cardRestX}-${cardDriftPixels}*(${localTime}-${cardEnterSeconds})/${formatSeconds(driftSeconds)}`
  const exiting = `${driftEndX}-${driftEndX - cardExitX}*pow(${exitProgress},2)`

  return `if(lt(${localTime},${cardEnterSeconds}),${entering},if(lt(${localTime},${formatSeconds(visibleSeconds - cardExitSeconds)}),${drifting},${exiting}))`
}

export const resolveCardBaseY = (scoreCardBounds: OpaqueBounds | null) =>
  scoreCardBounds ? scoreCardBounds.y - memberCardCanvasSize.height - cardGapAboveScoreCard : fallbackCardBaseY

export const buildCardVerticalExpression = ({ startSeconds }: StoryVideoCardWindow, cardBaseY: number) =>
  `${cardBaseY}+${cardBobPixels}*sin(2*PI*(t-${formatSeconds(startSeconds)})/${cardBobPeriodSeconds})`

const buildPhotoClip = (photoIndex: number, clipSeconds: number) => {
  const frameCount = Math.round(clipSeconds * storyVideoFramesPerSecond)
  const zoomExpression = `min(zoom+${zoomStepPerFrame},${maximumZoom})`
  return (
    `[${photoIndex}:v]scale=${oversampledPhotoSize}:${oversampledPhotoSize}:force_original_aspect_ratio=increase,` +
    `crop=${oversampledPhotoSize}:${oversampledPhotoSize},` +
    `zoompan=z='${zoomExpression}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frameCount}:` +
    `s=${storySize.width}x${storyPhotoAreaHeight}:fps=${storyVideoFramesPerSecond},setsar=1,format=yuv420p[clip${photoIndex}]`
  )
}

const buildCrossfadeChain = (photoCount: number, clipSeconds: number) =>
  Array.from({ length: photoCount - 1 }, (_, transitionIndex) => {
    const inputLabel = transitionIndex === 0 ? '[clip0]' : `[fade${transitionIndex - 1}]`
    const offsetSeconds = formatSeconds((transitionIndex + 1) * (clipSeconds - crossfadeSeconds))
    return `${inputLabel}[clip${transitionIndex + 1}]xfade=transition=fade:duration=${crossfadeSeconds}:offset=${offsetSeconds}[fade${transitionIndex}]`
  })

const buildCardOverlays = (cardWindows: StoryVideoCardWindow[], firstCardInputIndex: number, cardBaseY: number) =>
  cardWindows.map((cardWindow, cardIndex) => {
    const inputLabel = cardIndex === 0 ? '[layered]' : `[card${cardIndex - 1}]`
    const outputLabel = cardIndex === cardWindows.length - 1 ? '[withCards]' : `[card${cardIndex}]`
    const enableWindow = `between(t,${formatSeconds(cardWindow.startSeconds)},${formatSeconds(cardWindow.endSeconds)})`
    return (
      `${inputLabel}[${firstCardInputIndex + cardIndex}:v]overlay=` +
      `x='${buildCardHorizontalExpression(cardWindow)}':y='${buildCardVerticalExpression(cardWindow, cardBaseY)}':` +
      `enable='${enableWindow}':format=auto${outputLabel}`
    )
  })

export const buildBorderLightPath = (bounds: OpaqueBounds) => {
  const perimeter = 2 * (bounds.width + bounds.height)
  const pixelsPerSecond = (perimeter / borderLightLoopSeconds).toFixed(3)
  const distance = `mod(t*${pixelsPerSecond},${perimeter})`
  const halfSpot = borderLightSpotSize / 2
  const left = bounds.x - halfSpot
  const right = bounds.x + bounds.width - halfSpot
  const top = bounds.y - halfSpot
  const bottom = bounds.y + bounds.height - halfSpot
  const topEnd = bounds.width
  const rightEnd = bounds.width + bounds.height
  const bottomEnd = 2 * bounds.width + bounds.height

  return {
    x: `if(lt(${distance},${topEnd}),${left}+${distance},if(lt(${distance},${rightEnd}),${right},if(lt(${distance},${bottomEnd}),${right}-(${distance}-${rightEnd}),${left})))`,
    y: `if(lt(${distance},${topEnd}),${top},if(lt(${distance},${rightEnd}),${top}+(${distance}-${topEnd}),if(lt(${distance},${bottomEnd}),${bottom},${bottom}-(${distance}-${bottomEnd}))))`,
  }
}

const buildBorderLightFilters = (input: {
  baseLabel: string
  maskInputIndex: number
  spotInputIndex: number
  bounds: OpaqueBounds
  totalSeconds: number
}) => {
  const path = buildBorderLightPath(input.bounds)
  return [
    `[${input.maskInputIndex}:v]alphaextract,format=gray,gblur=sigma=${borderMaskBlurSigma},format=gbrp[borderMask]`,
    `color=c=black:s=${storySize.width}x${storySize.height}:r=${storyVideoFramesPerSecond}:d=${formatSeconds(input.totalSeconds)},format=gbrp[lightCanvas]`,
    `[lightCanvas][${input.spotInputIndex}:v]overlay=x='${path.x}':y='${path.y}':format=auto,format=gbrp[spotField]`,
    `[spotField][borderMask]blend=all_mode=multiply,colorlevels=rimax=${borderLightGainCeiling}:gimax=${borderLightGainCeiling}:bimax=${borderLightGainCeiling}[borderLight]`,
    `${input.baseLabel}format=gbrp[baseRgb]`,
    `[baseRgb][borderLight]blend=all_mode=screen[litStory]`,
  ]
}

export const buildStoryVideoFilterGraph = (
  photoCount: number,
  cardCount: number,
  borderLightBounds: OpaqueBounds | null = null,
) => {
  const { clipSeconds, cardWindows, totalSeconds } = planStoryVideoTimeline(photoCount, cardCount)
  const photoClips = Array.from({ length: photoCount }, (_, photoIndex) => buildPhotoClip(photoIndex, clipSeconds))
  const slideshowLabel = photoCount <= 1 ? '[clip0]' : `[fade${photoCount - 2}]`
  const foregroundInputIndex = photoCount
  const composedLabel = cardCount > 0 ? '[withCards]' : '[layered]'
  const firstExtraInputIndex = foregroundInputIndex + 1 + cardCount
  const borderLightFilters = borderLightBounds
    ? buildBorderLightFilters({
        baseLabel: composedLabel,
        maskInputIndex: firstExtraInputIndex,
        spotInputIndex: firstExtraInputIndex + 1,
        bounds: borderLightBounds,
        totalSeconds,
      })
    : []
  const finalLabel = borderLightBounds ? '[litStory]' : composedLabel

  return [
    ...photoClips,
    ...buildCrossfadeChain(photoCount, clipSeconds),
    `${slideshowLabel}pad=${storySize.width}:${storySize.height}:0:0:color=${canvasColor}[background]`,
    `[background][${foregroundInputIndex}:v]overlay=0:0:format=auto[layered]`,
    ...buildCardOverlays(cardWindows, foregroundInputIndex + 1, resolveCardBaseY(borderLightBounds)),
    ...borderLightFilters,
    `${finalLabel}format=yuv420p[story]`,
  ].join(';')
}
