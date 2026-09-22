import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { prepareLogoForStory } from '@/lib/images/prepareLogoForStory'

const buildPaddedLogo = async () => {
  const mark = await sharp({ create: { width: 40, height: 20, channels: 3, background: '#d62828' } }).png().toBuffer()
  return sharp({ create: { width: 300, height: 120, channels: 3, background: '#ffffff' } })
    .composite([{ input: mark, left: 130, top: 50 }])
    .png()
    .toBuffer()
}

const measureColoredBounds = async (image: Buffer) => {
  const { data, info } = await sharp(image).raw().toBuffer({ resolveWithObject: true })
  const coloredColumns = Array.from({ length: info.width * info.height }, (_, pixelIndex) => pixelIndex)
    .filter((pixelIndex) => data[pixelIndex * info.channels + 1] < 128)
    .map((pixelIndex) => pixelIndex % info.width)
  return { imageWidth: info.width, imageHeight: info.height, markWidth: Math.max(...coloredColumns) - Math.min(...coloredColumns) + 1 }
}

describe('story logo preparation', () => {
  it('returns a square tile with the logo trimmed and enlarged to fill it', async () => {
    const prepared = await prepareLogoForStory(await buildPaddedLogo())
    const bounds = await measureColoredBounds(prepared)

    expect(bounds.imageWidth).toBe(bounds.imageHeight)
    expect(bounds.markWidth / bounds.imageWidth).toBeGreaterThan(0.7)
  })

  it('pads with the logo background colour instead of white or black bars', async () => {
    const darkLogo = await sharp({ create: { width: 200, height: 80, channels: 3, background: '#0b0b0d' } }).png().toBuffer()
    const prepared = await prepareLogoForStory(darkLogo)
    const { data } = await sharp(prepared).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true })

    expect([data[0], data[1], data[2]]).toEqual([11, 11, 13])
  })
})
