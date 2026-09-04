import { NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { withMember } from '@/lib/http/routeHelpers'

export const DELETE = async (
  _request: Request,
  context: { params: Promise<{ nominationId: string }> },
) =>
  withMember(async (member) => {
    const { nominationId } = await context.params

    const deleted = await database
      .delete(schema.nominations)
      .where(
        and(
          eq(schema.nominations.id, nominationId),
          eq(schema.nominations.memberId, member.id),
          isNull(schema.nominations.consumedAt),
        ),
      )
      .returning({ id: schema.nominations.id })

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Indicação não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  })
