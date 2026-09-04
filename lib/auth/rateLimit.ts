import { and, eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'

type RateLimitPolicy = {
  maximumFailures: number
  lockoutInSeconds: number
}

const findAttempt = async (scope: string, identifier: string) => {
  const rows = await database
    .select()
    .from(schema.authenticationAttempts)
    .where(
      and(
        eq(schema.authenticationAttempts.scope, scope),
        eq(schema.authenticationAttempts.identifier, identifier),
      ),
    )
    .limit(1)

  return rows.at(0) ?? null
}

export const assertNotLocked = async (scope: string, identifier: string) => {
  const attempt = await findAttempt(scope, identifier)
  if (!attempt?.lockedUntil) return { locked: false as const }
  if (attempt.lockedUntil.getTime() <= Date.now()) return { locked: false as const }

  const retryAfterSeconds = Math.ceil((attempt.lockedUntil.getTime() - Date.now()) / 1000)
  return { locked: true as const, retryAfterSeconds }
}

export const registerFailure = async (
  scope: string,
  identifier: string,
  policy: RateLimitPolicy,
) => {
  const attempt = await findAttempt(scope, identifier)
  const failureCount = (attempt?.failureCount ?? 0) + 1
  const shouldLock = failureCount >= policy.maximumFailures
  const lockedUntil = shouldLock ? new Date(Date.now() + policy.lockoutInSeconds * 1000) : null

  await database
    .insert(schema.authenticationAttempts)
    .values({ scope, identifier, failureCount, lockedUntil, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [schema.authenticationAttempts.scope, schema.authenticationAttempts.identifier],
      set: { failureCount: shouldLock ? 0 : failureCount, lockedUntil, updatedAt: new Date() },
    })

  return { locked: shouldLock, lockoutInSeconds: policy.lockoutInSeconds }
}

export const clearFailures = async (scope: string, identifier: string) => {
  await database
    .delete(schema.authenticationAttempts)
    .where(
      and(
        eq(schema.authenticationAttempts.scope, scope),
        eq(schema.authenticationAttempts.identifier, identifier),
      ),
    )
}
