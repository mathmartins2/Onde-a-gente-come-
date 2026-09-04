import { describe, expect, it } from 'vitest'
import {
  calculateRestaurantRanking,
  type RestaurantRatingSummary,
} from '@/lib/scoring/calculateRestaurantRanking'

const buildSummary = (
  restaurantId: string,
  name: string,
  visitCount: number,
  averageScore: number,
  ratingCount: number,
): RestaurantRatingSummary => ({
  restaurantId,
  name,
  visitCount,
  weightedScoreSum: averageScore * ratingCount,
  weightTotal: ratingCount,
})

describe('restaurant ranking', () => {
  it('puts a consistently good and often visited place above a lucky single visit', () => {
    const ranking = calculateRestaurantRanking([
      buildSummary('a', 'Ruffo', 3, 4.8, 15),
      buildSummary('b', 'Rock n Ribs', 1, 5, 5),
      buildSummary('c', 'Yokocho', 1, 4.9, 4),
    ])

    expect(ranking[0].name).toBe('Ruffo')
  })

  it('pulls a place with very few ratings toward the group average', () => {
    const ranking = calculateRestaurantRanking([
      buildSummary('a', 'Muito avaliado', 4, 4.5, 20),
      buildSummary('b', 'Uma nota so', 1, 5, 1),
    ])

    const singleRating = ranking.find((entry) => entry.name === 'Uma nota so')
    expect(singleRating?.averageScore).toBe(5)
    expect(singleRating?.bayesianScore).toBeLessThan(5)
  })

  it('never lets the bayesian score exceed the raw average of a perfect place', () => {
    const ranking = calculateRestaurantRanking([buildSummary('a', 'Perfeito', 2, 5, 10)])
    expect(ranking[0].bayesianScore).toBeLessThanOrEqual(ranking[0].averageScore ?? 0)
  })

  it('breaks a tie in favour of the more visited restaurant', () => {
    const ranking = calculateRestaurantRanking([
      buildSummary('a', 'Pouco visitado', 1, 4.5, 10),
      buildSummary('b', 'Muito visitado', 5, 4.5, 10),
    ])

    expect(ranking[0].name).toBe('Muito visitado')
  })

  it('falls back to the neutral prior when there is no rating at all', () => {
    const ranking = calculateRestaurantRanking([buildSummary('a', 'Sem nota', 1, 0, 0)])
    expect(ranking[0].bayesianScore).toBeCloseTo(3, 6)
  })

  it('reports no average at all for a restaurant that was never rated', () => {
    const ranking = calculateRestaurantRanking([buildSummary('a', 'Sem nota', 1, 0, 0)])
    expect(ranking[0].averageScore).toBeNull()
  })

  it('ranks the group history exactly as agreed', () => {
    const ranking = calculateRestaurantRanking([
      buildSummary('a', 'Ruffo', 3, 4.8, 15),
      buildSummary('b', 'Rock n Ribs', 1, 5, 5),
      buildSummary('c', 'Yokocho', 1, 4.9, 4),
    ])

    expect(ranking.map((entry) => entry.name)).toEqual(['Ruffo', 'Rock n Ribs', 'Yokocho'])
    expect(ranking[0].bayesianScore).toBeCloseTo(4.35, 2)
    expect(ranking[1].bayesianScore).toBeCloseTo(4.0, 2)
    expect(ranking[2].bayesianScore).toBeCloseTo(3.84, 2)
  })

  it('lets a place with many good ratings beat a place with one perfect rating', () => {
    const ranking = calculateRestaurantRanking([
      buildSummary('a', 'Provado varias vezes', 4, 4.5, 20),
      buildSummary('b', 'Uma nota perfeita', 1, 5, 4),
    ])

    expect(ranking[0].name).toBe('Provado varias vezes')
  })

  it('returns an empty ranking for an empty input', () => {
    expect(calculateRestaurantRanking([])).toEqual([])
  })
})
