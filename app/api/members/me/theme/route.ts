import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { themePreferenceSchema } from '@/lib/validation/schemas'

export const PUT = async (request: Request) =>
  withMember(async (member) => {
    const body = await request.json().catch(() => null)
    const parsed = themePreferenceSchema.safeParse(body)
    if (!parsed.success) return validationErrorResponse('Tema inválido')

    await database
      .update(schema.members)
      .set({ themePreference: parsed.data.themePreference })
      .where(eq(schema.members.id, member.id))

    return NextResponse.json({ themePreference: parsed.data.themePreference })
  })
