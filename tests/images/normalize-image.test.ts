import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { detectImageFormat, normalizeImage, UnsupportedImageError } from '@/lib/images/normalizeImage'

const buildImage = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#ff6b35' } })

describe('image normalization', () => {
  it('shrinks a large restaurant photo to fit 1280 pixels and stores it as webp', async () => {
    const original = await buildImage(4000, 3000).png().toBuffer()

    const normalized = await normalizeImage(original, 'restaurantPhoto')

    expect(normalized.contentType).toBe('image/webp')
    expect(normalized.width).toBe(1280)
    expect(normalized.height).toBe(960)
    expect(detectImageFormat(normalized.bytes)).toBe('webp')
  })

  it('stores dish photos as webp no larger than 1600 pixels', async () => {
    const original = await buildImage(3000, 4000).jpeg().toBuffer()

    const normalized = await normalizeImage(original, 'dishPhoto')

    expect(normalized.contentType).toBe('image/webp')
    expect([normalized.width, normalized.height]).toEqual([1200, 1600])
  })

  it('keeps story renders in jpeg so the story renderer can draw them', async () => {
    const original = await buildImage(2000, 1500).webp().toBuffer()

    const normalized = await normalizeImage(original, 'storyBackground')

    expect(normalized.contentType).toBe('image/jpeg')
    expect(detectImageFormat(normalized.bytes)).toBe('jpeg')
  })

  it('never enlarges a small restaurant photo', async () => {
    const original = await buildImage(600, 400).jpeg().toBuffer()

    const normalized = await normalizeImage(original, 'restaurantPhoto')

    expect([normalized.width, normalized.height]).toEqual([600, 400])
  })

  it('crops avatars to a 320 pixel square', async () => {
    const original = await buildImage(900, 500).webp().toBuffer()

    const normalized = await normalizeImage(original, 'memberAvatar')

    expect([normalized.width, normalized.height]).toEqual([320, 320])
  })

  it('applies the camera orientation and strips the metadata', async () => {
    const rotatedPortrait = await buildImage(800, 400).jpeg().withMetadata({ orientation: 6 }).toBuffer()

    const normalized = await normalizeImage(rotatedPortrait, 'restaurantPhoto')
    const outputMetadata = await sharp(normalized.bytes).metadata()

    expect([normalized.width, normalized.height]).toEqual([400, 800])
    expect(outputMetadata.orientation).toBeUndefined()
    expect(outputMetadata.exif).toBeUndefined()
  })

  it('rejects bytes that are not an image', async () => {
    await expect(normalizeImage(Buffer.from('<html>not an image</html>'), 'memberAvatar')).rejects.toBeInstanceOf(
      UnsupportedImageError,
    )
  })

  it('rejects a file that claims to be an image but cannot be decoded', async () => {
    const truncatedJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])

    await expect(normalizeImage(truncatedJpeg, 'memberAvatar')).rejects.toBeInstanceOf(UnsupportedImageError)
  })

  it('rejects uploads larger than 8MB before decoding', async () => {
    const oversized = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(8 * 1024 * 1024)])

    await expect(normalizeImage(oversized, 'restaurantPhoto')).rejects.toThrow('8MB')
  })
})
