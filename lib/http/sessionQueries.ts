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
  isVetoed: boolean
  vetoedByName: string | null
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
  everyoneReady: boolean
  hasJoined: boolean
  myRankedRestaurantIds: string[]
}

export const fetchSessionState = async () => {
  const response = await apiClient.get<SessionState>('/sessions')
  return response.data
}
