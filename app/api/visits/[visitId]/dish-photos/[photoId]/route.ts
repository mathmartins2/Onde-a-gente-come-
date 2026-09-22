import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validationErrorResponse, withMember } from '@/lib/http/routeHelpers'
import { publishVisitChanged } from '@/lib/realtime/sessionChannel'
import { removeVisitDishPhoto } from '@/lib/services/dishPhotoService'

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
