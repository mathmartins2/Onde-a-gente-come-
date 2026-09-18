import { getCurrentMember } from '@/lib/auth/currentMember'
import { findOpenSession, loadSessionState, revealingStatus } from './sessionService'

type Member = NonNullable<Awaited<ReturnType<typeof getCurrentMember>>>

export const buildSessionPayload = async (member: Member) => {
  const session = await findOpenSession()
  if (!session) return { session: null, isAdmin: member.isAdmin }

  const state = await loadSessionState(session.id)
  if (!state) return { session: null, isAdmin: member.isAdmin }

  const myPreferences = state.myPreferences.get(member.id) ?? []

  return {
    isAdmin: member.isAdmin,
    currentMemberId: member.id,
    session: {
      id: state.session.id,
      roundNumber: state.session.roundNumber,
      status: state.session.status,
      openedByMemberId: state.session.openedByMemberId,
    },
    reveal:
      state.session.status === revealingStatus
        ? {
            drawId: state.session.drawId,
            visitId: state.visitId,
            restaurantId: state.winnerRestaurantId,
            fallbackRestaurantId: state.fallbackRestaurantId,
            bannedRestaurantName: state.bannedRestaurantName,
            banTiebreak: state.banTiebreak,
            contenders: state.revealContenders,
            canClose: member.isAdmin || state.session.drawnByMemberId === member.id,
          }
        : null,
    participants: state.participants,
    pool: state.pool.map((item) => {
      const { effectiveOwnerMemberId, ...visible } = item
      return { ...visible, isMine: effectiveOwnerMemberId === member.id }
    }),
    contenders: state.contenders,
    quorum: state.quorum,
    banOutcome: state.banOutcome,
    myBanVote: state.banVotesByMember.get(member.id) ?? null,
    hasDecidedBan: state.banDecidedMemberIds.includes(member.id),
    everyoneReady: state.everyoneReady,
    hasJoined: state.participants.some((participant) => participant.memberId === member.id),
    myRankedRestaurantIds: [...myPreferences]
      .sort((first, second) => first.position - second.position)
      .map((entry) => entry.restaurantId),
  }
}
