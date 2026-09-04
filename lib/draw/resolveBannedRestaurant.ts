export type BanVote = {
  memberId: string
  restaurantId: string
}

export type BanTallyEntry = {
  restaurantId: string
  votes: number
}

export type BanOutcome = {
  tally: BanTallyEntry[]
  bannedRestaurantId: string | null
  isTied: boolean
}

export const resolveBannedRestaurant = (votes: ReadonlyArray<BanVote>): BanOutcome => {
  const counts = new Map<string, number>()
  votes.forEach((vote) => {
    counts.set(vote.restaurantId, (counts.get(vote.restaurantId) ?? 0) + 1)
  })

  const tally = [...counts.entries()]
    .map(([restaurantId, count]) => ({ restaurantId, votes: count }))
    .sort((first, second) => second.votes - first.votes)

  if (tally.length === 0) return { tally, bannedRestaurantId: null, isTied: false }

  const highestVoteCount = tally[0].votes
  const leaders = tally.filter((entry) => entry.votes === highestVoteCount)
  if (leaders.length > 1) return { tally, bannedRestaurantId: null, isTied: true }

  return { tally, bannedRestaurantId: tally[0].restaurantId, isTied: false }
}
