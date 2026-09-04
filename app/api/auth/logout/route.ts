import { NextResponse } from 'next/server'
import { endSession } from '@/lib/auth/session'

export const POST = async () => {
  await endSession()
  return NextResponse.json({ ok: true })
}
