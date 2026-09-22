import { maximumUploadByteSize, UnsupportedImageError } from '@/lib/images/normalizeImage'
import { validationErrorResponse } from './routeHelpers'

export const imageUploadFieldName = 'image'

export const readUploadedImage = async (request: Request) => {
  const formData = await request.formData().catch(() => null)
  const uploadedFile = formData?.get(imageUploadFieldName)
  if (!(uploadedFile instanceof File)) return null
  if (uploadedFile.size > maximumUploadByteSize) return null
  return Buffer.from(await uploadedFile.arrayBuffer())
}

export const respondToImageReplacement = async (replace: () => Promise<Response>) => {
  try {
    return await replace()
  } catch (error) {
    if (error instanceof UnsupportedImageError) return validationErrorResponse(error.message)
    throw error
  }
}

export const missingImageResponse = () => validationErrorResponse('Envie uma imagem de até 8MB')
