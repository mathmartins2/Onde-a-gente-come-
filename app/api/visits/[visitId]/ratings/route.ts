import { NextResponse } from 'next/server'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { ratingSchema } from '@/lib/validation/schemas'
import { submitRating } from '@/lib/services/ratingService'

const failureMessages: Record<string, string> = {
  NO_PIN: 'Esse membro ainda não cadastrou o PIN',
  INVALID_PIN: 'PIN incorreto',
  VISIT_NOT_FOUND: 'Visita não encontrada',
  ALREADY_REVEALED: 'As notas já foram reveladas',
  ALREADY_RATED: 'Esse membro já deu a nota',
}

export const POST = async (request: Request, context: { params: Promise<{ visitId: string }> }) =>
  withMember(async () => {
    const { visitId } = await context.params
    const body = await request.json().catch(() => null)
    const parsed = ratingSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Dados inválidos')
    }

    const result = await submitRating({
      visitId,
      memberId: parsed.data.memberId,
      pin: parsed.data.pin,
      scores: {
        flavor: parsed.data.flavor,
        price: parsed.data.price,
        service: parsed.data.service,
        ambience: parsed.data.ambience,
      },
      comment: parsed.data.comment ? parsed.data.comment : null,
    })

    if (result.ok) return NextResponse.json({ ok: true })

    if (result.reason === 'LOCKED') {
      return NextResponse.json(
        { error: `PIN bloqueado. Tente de novo em ${result.retryAfterSeconds}s` },
        { status: 429 },
      )
    }

    return NextResponse.json(
      { error: failureMessages[result.reason] ?? 'Não foi possível salvar a nota' },
      { status: 400 },
    )
  })
