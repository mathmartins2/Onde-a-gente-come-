import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validationErrorResponse, withMember } from '@/lib/http/routeHelpers'
import { readStoryRenderProgress } from '@/lib/services/storyRenderService'

export const dynamic = 'force-dynamic'

export const GET = async (_request: Request, context: RouteContext<'/api/visits/[visitId]/story/video/status'>) =>
  withMember(async () => {
    const { visitId } = await context.params
    if (!z.uuid().safeParse(visitId).success) return validationErrorResponse('Rodada inválida')

    return NextResponse.json(await readStoryRenderProgress(visitId, 'video'), {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  })
