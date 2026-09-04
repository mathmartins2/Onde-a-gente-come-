import { NextResponse } from 'next/server'
import { getCurrentMember } from '@/lib/auth/currentMember'

export const unauthorizedResponse = () =>
  NextResponse.json({ error: 'Faça login para continuar' }, { status: 401 })

export const validationErrorResponse = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 })

export const withMember = async <T>(
  handler: (member: NonNullable<Awaited<ReturnType<typeof getCurrentMember>>>) => Promise<T>,
) => {
  const member = await getCurrentMember()
  if (!member) return unauthorizedResponse()
  return handler(member)
}
