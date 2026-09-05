import { NextResponse } from 'next/server'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { ratingDraftSchema } from '@/lib/validation/schemas'
import { loadOwnRating, loadRatingDraft, saveRatingDraft } from '@/lib/services/ratingService'

export const GET = async (_request: Request, context: { params: Promise<{ visitId: string }> }) =>
  withMember(async (member) => {
    const { visitId } = await context.params
    const draft = await loadRatingDraft(visitId, member.id)
    if (draft) return NextResponse.json({ draft })

    const submitted = await loadOwnRating(visitId, member.id)
    return NextResponse.json({ draft: submitted })
  })

export const PUT = async (request: Request, context: { params: Promise<{ visitId: string }> }) =>
  withMember(async (member) => {
    const { visitId } = await context.params
    const body = await request.json().catch(() => null)
    const parsed = ratingDraftSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Dados inválidos')
    }

    await saveRatingDraft({
      visitId,
      memberId: member.id,
      flavor: parsed.data.flavor,
      price: parsed.data.price,
      service: parsed.data.service,
      ambience: parsed.data.ambience,
      menu: parsed.data.menu,
      waitTime: parsed.data.waitTime,
      comment: parsed.data.comment ? parsed.data.comment : null,
    })

    return NextResponse.json({ ok: true })
  })
