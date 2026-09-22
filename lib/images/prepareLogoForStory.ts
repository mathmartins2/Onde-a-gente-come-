import sharp from 'sharp'

const logoCanvasSize = 360
const logoContentRatio = 0.8
const trimThreshold = 18
const enlargementSharpenSigma = 0.8

type RgbColor = { r: number; g: number; b: number }

const readCornerColor = async (image: Buffer): Promise<RgbColor> => {
  const { data } = await sharp(image).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true })
  return { r: data[0], g: data[1], b: data[2] }
}

const trimUniformBorder = async (image: Buffer, background: RgbColor) => {
  try {
    return await sharp(image).trim({ background, threshold: trimThreshold }).toBuffer({ resolveWithObject: true })
  } catch {
    return sharp(image).toBuffer({ resolveWithObject: true })
  }
}

export const prepareLogoForStory = async (bytes: Buffer) => {
  const flattened = await sharp(bytes, { animated: false }).rotate().flatten({ background: '#ffffff' }).toBuffer()
  const background = await readCornerColor(flattened)
  const trimmed = await trimUniformBorder(flattened, background)

  const contentSize = Math.round(logoCanvasSize * logoContentRatio)
  const isEnlarging = Math.max(trimmed.info.width, trimmed.info.height) < contentSize
  const resized = sharp(trimmed.data).resize({
    width: contentSize,
    height: contentSize,
    fit: 'contain',
    background,
    kernel: 'lanczos3',
  })
  const content = await (isEnlarging ? resized.sharpen({ sigma: enlargementSharpenSigma }) : resized).toBuffer()

  const margin = (logoCanvasSize - contentSize) / 2
  return sharp(content)
    .extend({ top: Math.floor(margin), bottom: Math.ceil(margin), left: Math.floor(margin), right: Math.ceil(margin), background })
    .png()
    .toBuffer()
}
