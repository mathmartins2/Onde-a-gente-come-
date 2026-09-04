export type MemberPreference = {
  memberId: string
  rankedRestaurantIds: ReadonlyArray<string>
}

export type BordaEntry = {
  restaurantId: string
  points: number
  supporters: number
  topChoiceCount: number
}

export const calculateMemberPointBudget = (listLength: number) => {
  if (listLength <= 0) return 0
  return (listLength * (listLength + 1)) / 2
}

export const calculatePreferencePoints = (position: number, listLength: number) => {
  if (listLength <= 0) return 0
  if (position < 1 || position > listLength) return 0

  const rawPoints = listLength - position + 1
  return rawPoints / calculateMemberPointBudget(listLength)
}

export const calculateBordaScores = (
  preferences: ReadonlyArray<MemberPreference>,
): BordaEntry[] => {
  const accumulator = new Map<string, BordaEntry>()

  preferences.forEach((preference) => {
    const listLength = preference.rankedRestaurantIds.length

    preference.rankedRestaurantIds.forEach((restaurantId, index) => {
      const position = index + 1
      const points = calculatePreferencePoints(position, listLength)
      const existing = accumulator.get(restaurantId) ?? {
        restaurantId,
        points: 0,
        supporters: 0,
        topChoiceCount: 0,
      }

      accumulator.set(restaurantId, {
        restaurantId,
        points: existing.points + points,
        supporters: existing.supporters + 1,
        topChoiceCount: existing.topChoiceCount + (position === 1 ? 1 : 0),
      })
    })
  })

  return [...accumulator.values()].sort((first, second) => second.points - first.points)
}
