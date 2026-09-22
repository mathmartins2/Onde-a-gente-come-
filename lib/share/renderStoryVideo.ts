import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import {
  borderLightSpotSize,
  borderMaskBlurSigma,
  buildStoryVideoFilterGraph,
  planBorderLightRegion,
  planStoryVideoTimeline,
  storyVideoFramesPerSecond,
} from './buildStoryVideoFilterGraph'
import { findOpaqueBounds, type OpaqueBounds } from './findOpaqueBounds'
import { resolveFfmpegPath } from './resolveFfmpegPath'

const runFfmpeg = (argumentsList: string[]) =>
  new Promise<void>((resolve, reject) => {
    const ffmpegPath = resolveFfmpegPath()
    if (!ffmpegPath) return reject(new Error('ffmpeg binary is not available'))
    const ffmpegProcess = spawn(ffmpegPath, argumentsList, { stdio: ['ignore', 'ignore', 'pipe'] })
    const errorOutput: string[] = []
    ffmpegProcess.stderr.on('data', (chunk: Buffer) => errorOutput.push(chunk.toString()))
    ffmpegProcess.on('error', reject)
    ffmpegProcess.on('close', (exitCode) =>
      exitCode === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${exitCode}: ${errorOutput.join('').slice(-800)}`)),
    )
  })

const buildBorderLightSpot = (colorHex: string) => {
  const center = borderLightSpotSize / 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${borderLightSpotSize}" height="${borderLightSpotSize}">
    <defs><radialGradient id="spot"><stop offset="0" stop-color="${colorHex}" stop-opacity="1"/><stop offset="1" stop-color="${colorHex}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="${center}" cy="${center}" r="${center}" fill="url(#spot)"/>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

const buildBlurredBorderMask = (outlinePng: Buffer, bounds: OpaqueBounds) => {
  const region = planBorderLightRegion(bounds)
  return sharp(outlinePng)
    .ensureAlpha()
    .extractChannel('alpha')
    .blur(borderMaskBlurSigma)
    .extract({ left: region.x, top: region.y, width: region.width, height: region.height })
    .png()
    .toBuffer()
}

const measureOutline = async (outlinePng: Buffer) => {
  const { data, info } = await sharp(outlinePng).ensureAlpha().extractChannel('alpha').raw().toBuffer({ resolveWithObject: true })
  return findOpaqueBounds(new Uint8Array(data), info.width)
}

export const renderStoryVideo = async (input: {
  foregroundPng: Buffer
  photoJpegs: Buffer[]
  cardPngs: Buffer[]
  borderLight: { outlinePng: Buffer; colorHex: string } | null
  headerOutlinePng: Buffer | null
}) => {
  const workingDirectory = await mkdtemp(join(tmpdir(), 'story-video-'))
  try {
    const photoPaths = input.photoJpegs.map((_, photoIndex) => join(workingDirectory, `photo-${photoIndex}.jpg`))
    const foregroundPath = join(workingDirectory, 'foreground.png')
    const cardPaths = input.cardPngs.map((_, cardIndex) => join(workingDirectory, `card-${cardIndex}.png`))
    const outlinePath = join(workingDirectory, 'outline.png')
    const spotPath = join(workingDirectory, 'spot.png')
    const borderLightBounds = input.borderLight ? await measureOutline(input.borderLight.outlinePng) : null
    const headerBounds = input.headerOutlinePng ? await measureOutline(input.headerOutlinePng) : null
    const borderLightFiles =
      input.borderLight && borderLightBounds
        ? [
            buildBlurredBorderMask(input.borderLight.outlinePng, borderLightBounds).then((mask) => writeFile(outlinePath, mask)),
            buildBorderLightSpot(input.borderLight.colorHex).then((spot) => writeFile(spotPath, spot)),
          ]
        : []
    const outputPath = join(workingDirectory, 'story.mp4')
    await Promise.all([
      ...input.photoJpegs.map((photo, photoIndex) => writeFile(photoPaths[photoIndex], photo)),
      writeFile(foregroundPath, input.foregroundPng),
      ...input.cardPngs.map((card, cardIndex) => writeFile(cardPaths[cardIndex], card)),
      ...borderLightFiles,
    ])

    const durationSeconds = planStoryVideoTimeline(input.photoJpegs.length, input.cardPngs.length).totalSeconds.toFixed(3)
    const loopedStill = (path: string) => ['-loop', '1', '-t', durationSeconds, '-i', path]
    await runFfmpeg([
      '-y',
      ...photoPaths.flatMap((photoPath) => ['-i', photoPath]),
      ...loopedStill(foregroundPath),
      ...cardPaths.flatMap(loopedStill),
      ...(borderLightBounds ? [...loopedStill(outlinePath), ...loopedStill(spotPath)] : []),
      '-filter_complex', buildStoryVideoFilterGraph(input.photoJpegs.length, input.cardPngs.length, borderLightBounds, headerBounds),
      '-map', '[story]',
      '-t', durationSeconds,
      '-r', String(storyVideoFramesPerSecond),
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outputPath,
    ])
    return await readFile(outputPath)
  } finally {
    await rm(workingDirectory, { recursive: true, force: true })
  }
}
