import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { buildSessionPayload } from '@/lib/services/sessionPayload'
import { openSession } from '@/lib/services/sessionService'
import { publishSessionChanged } from '@/lib/realtime/sessionChannel'

export const GET = async () =>
  withMember(async (member) => NextResponse.json(await buildSessionPayload(member)))

export const POST = async () =>
  withMember(async (member) => {
    if (!member.isAdmin) {
      return NextResponse.json({ error: 'Só o admin abre um sorteio' }, { status: 403 })
    }

    const result = await openSession(member.id)
    if (!result.ok) {
      return NextResponse.json({ error: 'Já existe um sorteio aberto' }, { status: 409 })
    }

    await publishSessionChanged(result.session.id)

    return NextResponse.json({ session: result.session })
  })
