import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { buildCredentialFingerprint, getCurrentSession } from './session'

export const getCurrentMember = cache(async () => {
  const claims = await getCurrentSession()
  if (!claims) return null

  const rows = await database
    .select({
      id: schema.members.id,
      username: schema.members.username,
      displayName: schema.members.displayName,
      mustChangePassword: schema.members.mustChangePassword,
      isAdmin: schema.members.isAdmin,
      passwordHash: schema.members.passwordHash,
      ratingPinHash: schema.members.ratingPinHash,
    })
    .from(schema.members)
    .where(eq(schema.members.id, claims.memberId))
    .limit(1)

  const member = rows.at(0)
  if (!member) return null
  if (claims.credentialFingerprint !== buildCredentialFingerprint(member.passwordHash)) return null

  return {
    id: member.id,
    username: member.username,
    displayName: member.displayName,
    mustChangePassword: member.mustChangePassword,
    isAdmin: member.isAdmin,
    hasRatingPin: Boolean(member.ratingPinHash),
  }
})

export const requireCurrentMember = async () => {
  const member = await getCurrentMember()
  if (!member) throw new Error('UNAUTHENTICATED')
  return member
}
