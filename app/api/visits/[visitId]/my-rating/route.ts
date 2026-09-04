import { NextResponse } from 'next/server'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { selfRatingSchema } from '@/lib/validation/schemas'
import { submitOwnRating } from '@/lib/services/ratingService'

const failureMessages: Record<string, string> = {
  VISIT_NOT_FOUND: 'Visita não encontrada',
  ALREADY_REVEALED: 'As notas já foram reveladas',
}

export const POST = async (request: Request, context: { params: Promise<{ visitId: string }> }) =>
  withMember(async (member) => {
    const { visitId } = await context.params
    const body = await request.json().catch(() => null)
    const parsed = selfRatingSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Dados inválidos')
    }

    const result = await submitOwnRating({
      visitId,
      memberId: member.id,
      scores: {
        flavor: parsed.data.flavor,
        price: parsed.data.price,
        service: parsed.data.service,
        ambience: parsed.data.ambience,
      },
      comment: parsed.data.comment ? parsed.data.comment : null,
    })

    if (result.ok) return NextResponse.json({ ok: true })

    return NextResponse.json(
      { error: failureMessages[result.reason] ?? 'Não foi possível salvar a nota' },
      { status: 400 },
    )
  })
