import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { hashSecret, verifySecret } from '@/lib/auth/password'
import { startSession } from '@/lib/auth/session'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { changePasswordSchema } from '@/lib/validation/schemas'

export const POST = async (request: Request) =>
  withMember(async (member) => {
    const body = await request.json().catch(() => null)
    const parsed = changePasswordSchema.safeParse(body)
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

    const currentMatches = await verifySecret(stored.passwordHash, parsed.data.currentPassword)
    if (!currentMatches) return validationErrorResponse('Senha atual incorreta')

    const newPasswordHash = await hashSecret(parsed.data.newPassword)

    await database
      .update(schema.members)
      .set({ passwordHash: newPasswordHash, mustChangePassword: false })
      .where(eq(schema.members.id, member.id))

    await startSession({
      memberId: member.id,
      username: member.username,
      passwordHash: newPasswordHash,
    })

    return NextResponse.json({ ok: true })
  })
