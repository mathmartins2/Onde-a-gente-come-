import sharp from 'sharp'
import type { StoredImage } from './imageStorage'
import type { ResponsiveImageWidth } from './responsiveImageWidths'

const responsiveQuality = 84

export const resizeToResponsiveWidth = async (image: StoredImage, width: ResponsiveImageWidth | null): Promise<StoredImage> => {
  if (!width) return image
  const bytes = await sharp(image.bytes)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: responsiveQuality, effort: 4 })
    .toBuffer()
  return { bytes, contentType: 'image/webp' }
}
