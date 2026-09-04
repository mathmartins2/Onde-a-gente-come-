import { apiClient } from './apiClient'

export type HistoryContender = {
  restaurantId: string
  restaurantName: string
  nominatedByName: string
  chance: number
  supporters: number
  topChoiceCount: number
  revisitWeight: number
}

export type HistoryParticipant = {
  memberId: string
  displayName: string
  rankedCount: number
}

export type HistoryRating = {
  memberId: string
  displayName: string
  score: number
  comment: string | null
  isRecommender: boolean
}

export type HistoryRound = {
  drawId: string
  roundNumber: number
  drawnAt: string
  winnerRestaurantId: string
  winnerRestaurantName: string
  winnerNominatedByName: string
  contenders: HistoryContender[]
  participants: HistoryParticipant[]
  visitId: string | null
  finalScore: number | null
  isRevealed: boolean
  ratings: HistoryRating[]
}

export const fetchHistory = async () => {
  const response = await apiClient.get<{ rounds: HistoryRound[] }>('/history')
  return response.data.rounds
}
