import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { loadHistory } from '@/lib/services/historyService'

export const GET = async () =>
  withMember(async () => {
    const rounds = await loadHistory()
    return NextResponse.json({ rounds })
  })
