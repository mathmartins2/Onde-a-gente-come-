export const selectWeightedIndex = (
  weights: ReadonlyArray<number>,
  randomValueBetweenZeroAndOne: number,
) => {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  if (totalWeight <= 0) return -1

  const target = randomValueBetweenZeroAndOne * totalWeight
  const cumulative = weights.reduce<{ runningTotal: number; selectedIndex: number }>(
    (accumulator, weight, index) => {
      if (accumulator.selectedIndex >= 0) return accumulator

      const runningTotal = accumulator.runningTotal + weight
      if (runningTotal > target) return { runningTotal, selectedIndex: index }

      return { runningTotal, selectedIndex: -1 }
    },
    { runningTotal: 0, selectedIndex: -1 },
  )

  if (cumulative.selectedIndex >= 0) return cumulative.selectedIndex
  return weights.length - 1
}
