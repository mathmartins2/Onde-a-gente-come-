import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { findOpenSession, loadSessionState, openSession } from '@/lib/services/sessionService'

export const GET = async () =>
  withMember(async (member) => {
    const session = await findOpenSession()
    if (!session) return NextResponse.json({ session: null, isAdmin: member.isAdmin })

    const state = await loadSessionState(session.id)
    if (!state) return NextResponse.json({ session: null, isAdmin: member.isAdmin })

    const myPreferences = state.myPreferences.get(member.id) ?? []

    return NextResponse.json({
      isAdmin: member.isAdmin,
      currentMemberId: member.id,
      session: {
        id: state.session.id,
        roundNumber: state.session.roundNumber,
        status: state.session.status,
        openedByMemberId: state.session.openedByMemberId,
      },
      participants: state.participants,
      pool: state.pool.map((item) => {
        const { effectiveOwnerMemberId, ...visible } = item
        return { ...visible, isMine: effectiveOwnerMemberId === member.id }
      }),
      contenders: state.contenders,
      quorum: state.quorum,
      needsBanRunoff: state.needsBanRunoff,
      banRunoff: state.banRunoff,
      banOutcome: state.banOutcome,
      myBanVote: state.banVotesByMember.get(member.id) ?? null,
      everyoneReady: state.everyoneReady,
      hasJoined: state.participants.some((participant) => participant.memberId === member.id),
      myRankedRestaurantIds: [...myPreferences]
        .sort((first, second) => first.position - second.position)
        .map((entry) => entry.restaurantId),
    })
  })

export const POST = async () =>
  withMember(async (member) => {
    if (!member.isAdmin) {
      return NextResponse.json({ error: 'Só o admin abre um sorteio' }, { status: 403 })
    }

    const result = await openSession(member.id)
    if (!result.ok) {
      return NextResponse.json({ error: 'Já existe um sorteio aberto' }, { status: 409 })
    }

    return NextResponse.json({ session: result.session })
  })
