import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { database, schema } from '@/lib/database/client'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'

const visitDateSchema = z.object({
  visitedAt: z.iso.datetime({ offset: true }).or(z.iso.date()),
})

export const PUT = async (request: Request, context: { params: Promise<{ visitId: string }> }) =>
  withMember(async () => {
    const { visitId } = await context.params
    const body = await request.json().catch(() => null)
    const parsed = visitDateSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse('Data inválida')
    }

    const visitedAt = new Date(parsed.data.visitedAt)
    if (Number.isNaN(visitedAt.getTime())) return validationErrorResponse('Data inválida')
    if (visitedAt.getTime() > Date.now()) {
      return validationErrorResponse('A data não pode estar no futuro')
    }

    const [visit] = await database
      .update(schema.visits)
      .set({ visitedAt })
      .where(eq(schema.visits.id, visitId))
      .returning()

    if (!visit) return NextResponse.json({ error: 'Visita não encontrada' }, { status: 404 })

    return NextResponse.json({ visit })
  })
