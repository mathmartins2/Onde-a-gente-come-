import { extractImageAccentColor } from '@/lib/images/extractImageAccentColor'
import { normalizeImage, type ImagePresetName } from '@/lib/images/normalizeImage'
import { resolveImageStorage } from '@/lib/images/resolveImageStorage'
import { storyColors } from './storyTheme'

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

export const loadStoryImageAccentColor = async (imageKey: string | null) => {
  if (!imageKey) return null
  const storedImage = await resolveImageStorage().readImage(imageKey).catch(() => null)
  if (!storedImage) return null
  const accentPick = await extractImageAccentColor(storedImage.bytes)
  if (!accentPick) return null
  return accentPick.kind === 'vibrant' ? accentPick.color : storyColors.ink
}
