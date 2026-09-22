import { normalizeImage, type ImagePresetName } from '@/lib/images/normalizeImage'
import { resolveImageStorage } from '@/lib/images/resolveImageStorage'

export const loadStoryImageDataUrl = async (imageKey: string | null, presetName: ImagePresetName) => {
  if (!imageKey) return null
  try {
    const storedImage = await resolveImageStorage().readImage(imageKey)
    if (!storedImage) return null
    const resizedImage = await normalizeImage(storedImage.bytes, presetName)
    return `data:${resizedImage.contentType};base64,${resizedImage.bytes.toString('base64')}`
  } catch {
    return null
  }
}
