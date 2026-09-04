import { apiClient } from './apiClient'

export type SessionParticipantView = {
  memberId: string
  displayName: string
  isReady: boolean
  rankedCount: number
}

export type SessionPoolItem = {
  restaurantId: string
  name: string
  neighborhood: string | null
  cuisines: string[]
  addedByMemberId: string
  addedByName: string
  isBanned: boolean
  banVotes: number
}

export type SessionContenderView = {
  restaurantId: string
  name: string
  addedByName: string
  bordaPoints: number
  ownerWeight: number
  revisitWeight: number
  chance: number
  supporters: number
  topChoiceCount: number
}

export type SessionState = {
  isAdmin: boolean
  currentMemberId: string
  session: {
    id: string
    roundNumber: number
    status: string
    openedByMemberId: string
  } | null
  participants: SessionParticipantView[]
  pool: SessionPoolItem[]
  contenders: SessionContenderView[]
  quorum: {
    presentCount: number
    totalMemberCount: number
    requiredCount: number
    hasQuorum: boolean
  }
  banOutcome: {
    bannedRestaurantId: string | null
    isTied: boolean
    totalVotes: number
  }
  myBanVote: string | null
  everyoneReady: boolean
  hasJoined: boolean
  myRankedRestaurantIds: string[]
}

export const fetchSessionState = async () => {
  const response = await apiClient.get<SessionState>('/sessions')
  return response.data
}
