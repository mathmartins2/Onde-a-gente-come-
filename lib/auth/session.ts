import { createHmac } from 'node:crypto'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { securityConfiguration } from '@/lib/scoring/configuration'

const sessionCookieName = 'restaurant_draw_session'

const getSigningKey = () => {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be defined with at least 32 characters')
  }
  return new TextEncoder().encode(secret)
}

export const buildCredentialFingerprint = (passwordHash: string) =>
  createHmac('sha256', getSigningKey())
    .update(passwordHash)
    .digest('hex')
    .slice(0, securityConfiguration.credentialFingerprintLength)

export type SessionSubject = {
  memberId: string
  username: string
  passwordHash: string
}

export type SessionClaims = {
  memberId: string
  username: string
  credentialFingerprint: string
}

export const createSessionToken = (subject: SessionSubject) =>
  new SignJWT({
    username: subject.username,
    credentialFingerprint: buildCredentialFingerprint(subject.passwordHash),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(subject.memberId)
    .setIssuedAt()
    .setExpirationTime(`${securityConfiguration.sessionDurationInSeconds}s`)
    .sign(getSigningKey())

export const readSessionToken = async (token: string): Promise<SessionClaims | null> => {
  try {
    const { payload } = await jwtVerify(token, getSigningKey(), { algorithms: ['HS256'] })
    const credentialFingerprint = payload.credentialFingerprint
    if (!payload.sub) return null
    if (typeof credentialFingerprint !== 'string') return null
    if (credentialFingerprint.length !== securityConfiguration.credentialFingerprintLength) {
      return null
    }
    return {
      memberId: payload.sub,
      username: String(payload.username ?? ''),
      credentialFingerprint,
    }
  } catch {
    return null
  }
}

export const startSession = async (subject: SessionSubject) => {
  const token = await createSessionToken(subject)
  const cookieStore = await cookies()

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: securityConfiguration.sessionDurationInSeconds,
  })
}

export const endSession = async () => {
  const cookieStore = await cookies()
  cookieStore.delete(sessionCookieName)
}

export const getCurrentSession = async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionCookieName)?.value
  if (!token) return null
  return readSessionToken(token)
}
