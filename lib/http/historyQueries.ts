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
  criteria: Record<string, number | null>
  comment: string | null
  isRecommender: boolean
}

export type HistoryBallot = {
  memberId: string
  displayName: string
  ranking: Array<{ position: number; restaurantId: string; restaurantName: string }>
  banVote: { restaurantId: string | null; restaurantName: string | null } | null
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
  totalPaid: string | null
  paidPerPerson: number | null
  ballots: HistoryBallot[]
  bannedRestaurantName: string | null
  banRound: number
  fallback: { restaurantId: string | null; name?: string; addedByName?: string } | null
  usedFallback: boolean
  finalScore: number | null
  isRevealed: boolean
  ratings: HistoryRating[]
}

export const fetchHistory = async () => {
  const response = await apiClient.get<{ rounds: HistoryRound[] }>('/history')
  return response.data.rounds
}
