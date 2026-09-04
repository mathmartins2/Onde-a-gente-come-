import { apiClient } from './apiClient'

export type MemberChance = {
  memberId: string
  displayName: string
  roundsSinceLastWin: number
  isEligible: boolean
  qualityMultiplier: number
  weight: number
  chance: number
}

export type BoardNomination = {
  id: string
  memberId: string
  memberName: string
  restaurantId: string
  restaurantName: string
  neighborhood: string | null
  cuisines: string[]
  vetoedBy: string | null
}

export type BoardState = {
  roundNumber: number
  memberChances: MemberChance[]
  nominations: BoardNomination[]
  history: Array<{
    id: string
    roundNumber: number
    drawnAt: string
    winnerName: string
    restaurantName: string
    weightSnapshot: Array<{ memberId: string; weight: number; chance: number }>
  }>
}

export const fetchBoardState = async () => {
  const response = await apiClient.get<BoardState>('/draws')
  return response.data
}

export type DrawResult = {
  drawId: string
  visitId: string
  roundNumber: number
  winnerMemberId: string
  restaurantId: string
  snapshot: Array<{ memberId: string; weight: number; chance: number }>
  previousVisits: { visitCount: number; lastVisitedAt: string | null; lastScore: number | null }
}

export const runDrawRequest = async () => {
  const response = await apiClient.post<DrawResult>('/draws')
  return response.data
}
