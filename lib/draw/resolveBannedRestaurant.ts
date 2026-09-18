export type BanVote = {
  memberId: string
  restaurantId: string | null
}

export type BanTallyEntry = {
  restaurantId: string
  votes: number
}

export type BanOutcome = {
  tally: BanTallyEntry[]
  bannedRestaurantId: string | null
  tiedRestaurantIds: string[]
  wasDecidedByTiebreak: boolean
}

const emptyOutcome: BanOutcome = {
  tally: [],
  bannedRestaurantId: null,
  tiedRestaurantIds: [],
  wasDecidedByTiebreak: false,
}

export const resolveBannedRestaurant = (
  votes: ReadonlyArray<BanVote>,
  tiebreakFraction?: number,
): BanOutcome => {
  const counts = votes.reduce((accumulated, vote) => {
    if (!vote.restaurantId) return accumulated
    return accumulated.set(vote.restaurantId, (accumulated.get(vote.restaurantId) ?? 0) + 1)
  }, new Map<string, number>())

  const tally = [...counts.entries()]
    .map(([restaurantId, count]) => ({ restaurantId, votes: count }))
    .sort(
      (first, second) =>
        second.votes - first.votes || first.restaurantId.localeCompare(second.restaurantId),
    )

  if (tally.length === 0) return emptyOutcome

  const highestVoteCount = tally[0].votes
  const leaderRestaurantIds = tally
    .filter((entry) => entry.votes === highestVoteCount)
    .map((entry) => entry.restaurantId)
    .sort((first, second) => first.localeCompare(second))

  if (leaderRestaurantIds.length === 1) {
    return {
      tally,
      bannedRestaurantId: leaderRestaurantIds[0],
      tiedRestaurantIds: [],
      wasDecidedByTiebreak: false,
    }
  }

  if (tiebreakFraction === undefined) {
    return {
      tally,
      bannedRestaurantId: null,
      tiedRestaurantIds: leaderRestaurantIds,
      wasDecidedByTiebreak: false,
    }
  }

  const boundedFraction = Math.min(Math.max(tiebreakFraction, 0), 0.999999)
  const drawnIndex = Math.floor(boundedFraction * leaderRestaurantIds.length)

  return {
    tally,
    bannedRestaurantId: leaderRestaurantIds[drawnIndex],
    tiedRestaurantIds: leaderRestaurantIds,
    wasDecidedByTiebreak: true,
  }
}
