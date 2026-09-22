import sharp from 'sharp'
import { pickAccentColor } from './pickAccentColor'

const samplingSize = 48

export const extractImageAccentColor = async (bytes: Buffer) => {
  try {
    const pixels = await sharp(bytes, { animated: false })
      .resize({ width: samplingSize, height: samplingSize, fit: 'cover' })
      .flatten({ background: '#000000' })
      .removeAlpha()
      .raw()
      .toBuffer()
    return pickAccentColor(new Uint8Array(pixels))
  } catch {
    return null
  }
}
