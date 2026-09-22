import { NextResponse } from 'next/server'
import { z } from 'zod'
import { missingImageResponse, readUploadedImage, respondToImageReplacement } from '@/lib/http/imageUploadResponses'
import { validationErrorResponse, withMember } from '@/lib/http/routeHelpers'
import { publishVisitChanged } from '@/lib/realtime/sessionChannel'
import { addVisitDishPhoto, listVisitDishPhotos, maximumDishPhotosPerMember } from '@/lib/services/dishPhotoService'

export const runtime = 'nodejs'

const invalidVisitResponse = () => validationErrorResponse('Rodada inválida')

export const GET = async (_request: Request, context: RouteContext<'/api/visits/[visitId]/dish-photos'>) =>
  withMember(async () => {
    const { visitId } = await context.params
    if (!z.uuid().safeParse(visitId).success) return invalidVisitResponse()

    return NextResponse.json({ photos: await listVisitDishPhotos(visitId), maximumPerMember: maximumDishPhotosPerMember })
  })

export const POST = async (request: Request, context: RouteContext<'/api/visits/[visitId]/dish-photos'>) =>
  withMember(async (member) => {
    const { visitId } = await context.params
    if (!z.uuid().safeParse(visitId).success) return invalidVisitResponse()

    const uploadedImage = await readUploadedImage(request)
    if (!uploadedImage) return missingImageResponse()

    return respondToImageReplacement(async () => {
      const outcome = await addVisitDishPhoto({ visitId, memberId: member.id, bytes: uploadedImage })
      if (outcome.status === 'missing') return NextResponse.json({ error: 'Rodada não encontrada' }, { status: 404 })
      if (outcome.status === 'limit') {
        return validationErrorResponse(`Cada um pode mandar até ${maximumDishPhotosPerMember} fotos por rodada`)
      }
      await publishVisitChanged(visitId)
      return NextResponse.json({ photos: await listVisitDishPhotos(visitId) }, { status: 201 })
    })
  })
