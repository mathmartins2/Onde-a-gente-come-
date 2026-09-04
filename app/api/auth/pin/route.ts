import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { hashSecret, verifySecret } from '@/lib/auth/password'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { setPinSchema } from '@/lib/validation/schemas'

export const POST = async (request: Request) =>
  withMember(async (member) => {
    const body = await request.json().catch(() => null)
    const parsed = setPinSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Dados inválidos')
    }

    const rows = await database
      .select({ passwordHash: schema.members.passwordHash })
      .from(schema.members)
      .where(eq(schema.members.id, member.id))
      .limit(1)

    const stored = rows.at(0)
    if (!stored) return validationErrorResponse('Membro não encontrado')

    const passwordMatches = await verifySecret(stored.passwordHash, parsed.data.password)
    if (!passwordMatches) return validationErrorResponse('Senha incorreta')

    await database
      .update(schema.members)
      .set({ ratingPinHash: await hashSecret(parsed.data.pin) })
      .where(eq(schema.members.id, member.id))

    return NextResponse.json({ ok: true })
  })
