import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validationErrorResponse, withMember } from '@/lib/http/routeHelpers'
import { publishVisitChanged } from '@/lib/realtime/sessionChannel'
import { missingImageResponse, readUploadedImage, respondToImageReplacement } from '@/lib/http/imageUploadResponses'
import { removeVisitDishPhoto, replaceVisitDishPhoto } from '@/lib/services/dishPhotoService'

export const runtime = 'nodejs'

const hasValidIdentifiers = (visitId: string, photoId: string) =>
  z.uuid().safeParse(visitId).success && z.uuid().safeParse(photoId).success

export const PUT = async (request: Request, context: RouteContext<'/api/visits/[visitId]/dish-photos/[photoId]'>) =>
  withMember(async (member) => {
    const { visitId, photoId } = await context.params
    if (!hasValidIdentifiers(visitId, photoId)) return validationErrorResponse('Foto inválida')

    const uploadedImage = await readUploadedImage(request)
    if (!uploadedImage) return missingImageResponse()

    return respondToImageReplacement(async () => {
      const wasReplaced = await replaceVisitDishPhoto({ visitId, photoId, memberId: member.id, bytes: uploadedImage })
      if (!wasReplaced) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })
      await publishVisitChanged(visitId)
      return new NextResponse(null, { status: 204 })
    })
  })

export const DELETE = async (_request: Request, context: RouteContext<'/api/visits/[visitId]/dish-photos/[photoId]'>) =>
  withMember(async (member) => {
    const { visitId, photoId } = await context.params
    if (!z.uuid().safeParse(visitId).success || !z.uuid().safeParse(photoId).success) {
      return validationErrorResponse('Foto inválida')
    }

    const wasRemoved = await removeVisitDishPhoto({ visitId, photoId, memberId: member.id })
    if (!wasRemoved) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })
    await publishVisitChanged(visitId)
    return new NextResponse(null, { status: 204 })
  })
