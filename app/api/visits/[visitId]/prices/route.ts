import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { priceEntrySchema } from '@/lib/validation/schemas'

export const GET = async (_request: Request, context: { params: Promise<{ visitId: string }> }) =>
  withMember(async () => {
    const { visitId } = await context.params

    const rows = await database
      .select({
        id: schema.visitPriceEntries.id,
        amount: schema.visitPriceEntries.amount,
        createdAt: schema.visitPriceEntries.createdAt,
        addedByMemberId: schema.visitPriceEntries.addedByMemberId,
        addedByName: schema.members.displayName,
      })
      .from(schema.visitPriceEntries)
      .innerJoin(schema.members, eq(schema.members.id, schema.visitPriceEntries.addedByMemberId))
      .where(eq(schema.visitPriceEntries.visitId, visitId))
      .orderBy(asc(schema.visitPriceEntries.createdAt))

    return NextResponse.json({ entries: rows })
  })

export const POST = async (request: Request, context: { params: Promise<{ visitId: string }> }) =>
  withMember(async (member) => {
    const { visitId } = await context.params
    const body = await request.json().catch(() => null)
    const parsed = priceEntrySchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Dados inválidos')
    }

    const visitRows = await database
      .select({ id: schema.visits.id })
      .from(schema.visits)
      .where(eq(schema.visits.id, visitId))
      .limit(1)

    if (visitRows.length === 0) {
      return NextResponse.json({ error: 'Visita não encontrada' }, { status: 404 })
    }

    const [entry] = await database
      .insert(schema.visitPriceEntries)
      .values({
        visitId,
        addedByMemberId: member.id,
        amount: String(parsed.data.amount),
      })
      .onConflictDoUpdate({
        target: schema.visitPriceEntries.visitId,
        set: { amount: String(parsed.data.amount), addedByMemberId: member.id },
      })
      .returning()

    return NextResponse.json({ entry })
  })
