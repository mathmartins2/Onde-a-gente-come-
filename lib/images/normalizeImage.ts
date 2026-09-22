import sharp, { type Sharp } from 'sharp'
import type { StoredImageInput } from './imageStorage'

export const maximumUploadByteSize = 8 * 1024 * 1024

export const imagePresets = {
  restaurantPhoto: { width: 1280, height: 1280, fit: 'inside', quality: 78, format: 'webp' },
  dishPhoto: { width: 1280, height: 1280, fit: 'inside', quality: 78, format: 'webp' },
  memberAvatar: { width: 320, height: 320, fit: 'cover', quality: 80, format: 'webp' },
  publicDishPhoto: { width: 720, height: 720, fit: 'inside', quality: 76, format: 'webp' },
  storyBackground: { width: 1080, height: 1080, fit: 'cover', quality: 70, format: 'jpeg' },
  storyAvatar: { width: 128, height: 128, fit: 'cover', quality: 75, format: 'jpeg' },
  storyPolaroid: { width: 360, height: 360, fit: 'cover', quality: 78, format: 'jpeg' },
  storyCardPhoto: { width: 800, height: 600, fit: 'cover', quality: 78, format: 'jpeg' },
} as const

type OutputFormat = (typeof imagePresets)[keyof typeof imagePresets]['format']

const contentTypeByFormat: Record<OutputFormat, string> = { jpeg: 'image/jpeg', webp: 'image/webp' }

const encodeByFormat: Record<OutputFormat, (pipeline: Sharp, quality: number) => Sharp> = {
  jpeg: (pipeline, quality) => pipeline.jpeg({ quality, mozjpeg: true }),
  webp: (pipeline, quality) => pipeline.webp({ quality, effort: 5, smartSubsample: true }),
}

export type ImagePresetName = keyof typeof imagePresets

export class UnsupportedImageError extends Error {}

const startsWithBytes = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((value, index) => bytes[offset + index] === value)

const readAscii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.subarray(start, end))

export const detectImageFormat = (bytes: Uint8Array) => {
  if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) return 'jpeg'
  if (startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  if (readAscii(bytes, 0, 4) === 'RIFF' && readAscii(bytes, 8, 12) === 'WEBP') return 'webp'
  if (readAscii(bytes, 0, 6) === 'GIF87a' || readAscii(bytes, 0, 6) === 'GIF89a') return 'gif'
  if (readAscii(bytes, 4, 8) === 'ftyp') return 'heif'
  return null
}

const decodeAndResize = async (bytes: Buffer, presetName: ImagePresetName) => {
  const preset = imagePresets[presetName]
  try {
    const resizedPipeline = sharp(bytes, { animated: false })
      .rotate()
      .resize({
        width: preset.width,
        height: preset.height,
        fit: preset.fit,
        withoutEnlargement: preset.fit === 'inside',
      })
      .flatten({ background: '#0d0a09' })
    return await encodeByFormat[preset.format](resizedPipeline, preset.quality).toBuffer({ resolveWithObject: true })
  } catch {
    throw new UnsupportedImageError('Não consegui ler essa imagem. Tenta um JPG ou PNG.')
  }
}

export const normalizeImage = async (
  bytes: Buffer,
  presetName: ImagePresetName,
): Promise<StoredImageInput> => {
  if (bytes.byteLength === 0) throw new UnsupportedImageError('A imagem veio vazia')
  if (bytes.byteLength > maximumUploadByteSize) {
    throw new UnsupportedImageError('A imagem passa de 8MB')
  }
  if (!detectImageFormat(bytes)) throw new UnsupportedImageError('Esse arquivo não é uma imagem')

  const { data, info } = await decodeAndResize(bytes, presetName)

  return { bytes: data, contentType: contentTypeByFormat[imagePresets[presetName].format], width: info.width, height: info.height }
}
