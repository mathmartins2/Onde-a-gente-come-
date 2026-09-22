import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import {
  missingImageResponse,
  readUploadedImage,
  respondToImageReplacement,
} from '@/lib/http/imageUploadResponses'
import { replaceRestaurantPhoto } from '@/lib/services/imageService'

export const runtime = 'nodejs'

type RestaurantPhotoContext = { params: Promise<{ restaurantId: string }> }

const restaurantNotFoundResponse = () =>
  NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })

export const PUT = async (request: Request, context: RestaurantPhotoContext) =>
  withMember(async () => {
    const { restaurantId } = await context.params
    const uploadedImage = await readUploadedImage(request)
    if (!uploadedImage) return missingImageResponse()

    return respondToImageReplacement(async () => {
      const outcome = await replaceRestaurantPhoto(restaurantId, uploadedImage)
      if (!outcome.found) return restaurantNotFoundResponse()
      return NextResponse.json({ photoUrl: outcome.photoUrl })
    })
  })

export const DELETE = async (_request: Request, context: RestaurantPhotoContext) =>
  withMember(async () => {
    const { restaurantId } = await context.params
    const outcome = await replaceRestaurantPhoto(restaurantId, null)
    if (!outcome.found) return restaurantNotFoundResponse()
    return NextResponse.json({ photoUrl: null })
  })
