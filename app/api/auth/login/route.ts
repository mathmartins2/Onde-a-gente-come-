import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { verifyAgainstDecoySecret, verifySecret } from '@/lib/auth/password'
import { startSession } from '@/lib/auth/session'
import { assertNotLocked, clearFailures, registerFailure } from '@/lib/auth/rateLimit'
import { loginSchema } from '@/lib/validation/schemas'
import { securityConfiguration } from '@/lib/scoring/configuration'

const loginPolicy = {
  maximumFailures: securityConfiguration.maximumLoginAttemptsPerUsername,
  lockoutInSeconds: securityConfiguration.loginLockoutInSeconds,
}

const invalidCredentialsResponse = () =>
  NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 })

export const POST = async (request: Request) => {
  const body = await request.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const username = parsed.data.username.toLowerCase()
  const lockState = await assertNotLocked('login', username)
  if (lockState.locked) {
    return NextResponse.json(
      { error: `Muitas tentativas. Tente de novo em ${lockState.retryAfterSeconds}s` },
      { status: 429 },
    )
  }

  const rows = await database
    .select()
    .from(schema.members)
    .where(eq(schema.members.username, username))
    .limit(1)

  const member = rows.at(0)
  if (!member) {
    await verifyAgainstDecoySecret(parsed.data.password)
    await registerFailure('login', username, loginPolicy)
    return invalidCredentialsResponse()
  }

  const passwordMatches = await verifySecret(member.passwordHash, parsed.data.password)
  if (!passwordMatches) {
    await registerFailure('login', username, loginPolicy)
    return invalidCredentialsResponse()
  }

  await clearFailures('login', username)
  await startSession({
    memberId: member.id,
    username: member.username,
    passwordHash: member.passwordHash,
  })

  return NextResponse.json({
    member: {
      id: member.id,
      username: member.username,
      displayName: member.displayName,
      mustChangePassword: member.mustChangePassword,
      hasRatingPin: Boolean(member.ratingPinHash),
    },
  })
}
