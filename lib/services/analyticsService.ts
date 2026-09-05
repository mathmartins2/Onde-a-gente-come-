import { and, eq, exists, sql } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { onlyRevealedVisits } from '@/lib/database/visitFilters'
import {
  calculateRestaurantRanking,
  type RestaurantRatingSummary,
} from '@/lib/scoring/calculateRestaurantRanking'
import { rankingConfiguration } from '@/lib/scoring/configuration'

const loadVisitScoreRows = async () => {
  const ratingRows = await database
    .select({
      visitId: schema.ratings.visitId,
      restaurantId: schema.visits.restaurantId,
      memberId: schema.ratings.memberId,
      score: schema.ratings.score,
      appliedWeight: schema.ratings.appliedWeight,
    })
    .from(schema.ratings)
    .innerJoin(schema.visits, eq(schema.visits.id, schema.ratings.visitId))
    .where(onlyRevealedVisits)

  const legacyRows = await database
    .select({
      visitId: schema.visits.id,
      restaurantId: schema.visits.restaurantId,
      legacyScore: schema.visits.legacyScore,
    })
    .from(schema.visits)
    .where(sql`${schema.visits.legacyScore} is not null`)

  return { ratingRows, legacyRows }
}

export const loadRestaurantRanking = async () => {
  const restaurants = await database.select().from(schema.restaurants)
  const visitRows = await database
    .select({
      restaurantId: schema.visits.restaurantId,
      visitCount: sql<number>`count(*)::int`,
      lastVisitedAt: sql<Date | null>`max(${schema.visits.visitedAt})`,
    })
    .from(schema.visits)
    .groupBy(schema.visits.restaurantId)

  const visitCountByRestaurant = new Map(
    visitRows.map((row) => [row.restaurantId, row.visitCount]),
  )
  const lastVisitByRestaurant = new Map(
    visitRows.map((row) => [row.restaurantId, row.lastVisitedAt]),
  )

  const { ratingRows, legacyRows } = await loadVisitScoreRows()

  const accumulator = new Map<string, { weightedScoreSum: number; weightTotal: number }>()

  ratingRows.forEach((rating) => {
    const current = accumulator.get(rating.restaurantId) ?? { weightedScoreSum: 0, weightTotal: 0 }
    const weight = Number(rating.appliedWeight)
    accumulator.set(rating.restaurantId, {
      weightedScoreSum: current.weightedScoreSum + Number(rating.score) * weight,
      weightTotal: current.weightTotal + weight,
    })
  })

  legacyRows.forEach((legacy) => {
    const current = accumulator.get(legacy.restaurantId) ?? { weightedScoreSum: 0, weightTotal: 0 }
    const weight = rankingConfiguration.legacyVisitWeight
    accumulator.set(legacy.restaurantId, {
      weightedScoreSum: current.weightedScoreSum + Number(legacy.legacyScore) * weight,
      weightTotal: current.weightTotal + weight,
    })
  })

  const summaries: RestaurantRatingSummary[] = restaurants
    .filter((restaurant) => visitCountByRestaurant.has(restaurant.id))
    .map((restaurant) => {
      const totals = accumulator.get(restaurant.id) ?? { weightedScoreSum: 0, weightTotal: 0 }
      return {
        restaurantId: restaurant.id,
        name: restaurant.name,
        visitCount: visitCountByRestaurant.get(restaurant.id) ?? 0,
        weightedScoreSum: totals.weightedScoreSum,
        weightTotal: totals.weightTotal,
      }
    })

  const ranked = calculateRestaurantRanking(summaries)
  const restaurantById = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]))

  return ranked.map((entry) => ({
    ...entry,
    lastVisitedAt: lastVisitByRestaurant.get(entry.restaurantId) ?? null,
    neighborhood: restaurantById.get(entry.restaurantId)?.neighborhood ?? null,
    cuisines: restaurantById.get(entry.restaurantId)?.cuisines ?? [],
    ratingCount: summaries.find((summary) => summary.restaurantId === entry.restaurantId)?.weightTotal ?? 0,
  }))
}

export const loadNominatorRanking = async () => {
  const rows = await database
    .select({
      memberId: schema.members.id,
      displayName: schema.members.displayName,
      restaurantId: schema.visits.restaurantId,
      score: schema.ratings.score,
      appliedWeight: schema.ratings.appliedWeight,
    })
    .from(schema.visits)
    .innerJoin(schema.members, eq(schema.members.id, schema.visits.recommendedByMemberId))
    .innerJoin(schema.ratings, eq(schema.ratings.visitId, schema.visits.id))
    .where(onlyRevealedVisits)

  const accumulator = new Map<
    string,
    { displayName: string; scoreSum: number; ratingCount: number; restaurantIds: Set<string> }
  >()

  rows.forEach((row) => {
    const current = accumulator.get(row.memberId) ?? {
      displayName: row.displayName,
      scoreSum: 0,
      ratingCount: 0,
      restaurantIds: new Set<string>(),
    }
    current.scoreSum += Number(row.score)
    current.ratingCount += 1
    current.restaurantIds.add(row.restaurantId)
    accumulator.set(row.memberId, current)
  })

  return [...accumulator.entries()]
    .map(([memberId, value]) => ({
      memberId,
      displayName: value.displayName,
      averageScore: value.ratingCount === 0 ? null : value.scoreSum / value.ratingCount,
      restaurantCount: value.restaurantIds.size,
    }))
    .sort((first, second) => (second.averageScore ?? 0) - (first.averageScore ?? 0))
}

export const loadStrictnessProfile = async () => {
  const rows = await database
    .select({
      memberId: schema.members.id,
      displayName: schema.members.displayName,
      averageScore: sql<string | null>`avg(${schema.ratings.score})`,
      ratingCount: sql<number>`count(${schema.ratings.id})::int`,
    })
    .from(schema.members)
    .leftJoin(
      schema.ratings,
      and(
        eq(schema.ratings.memberId, schema.members.id),
        exists(
          database
            .select({ existing: sql`1` })
            .from(schema.visits)
            .where(
              and(eq(schema.visits.id, schema.ratings.visitId), onlyRevealedVisits),
            ),
        ),
      ),
    )
    .groupBy(schema.members.id, schema.members.displayName)

  return rows
    .map((row) => ({
      memberId: row.memberId,
      displayName: row.displayName,
      averageScore: row.averageScore === null ? null : Number(row.averageScore),
      ratingCount: row.ratingCount,
    }))
    .sort((first, second) => (first.averageScore ?? 99) - (second.averageScore ?? 99))
}

export const loadStatistics = async () => {
  const cuisineRows = await database
    .select({
      cuisine: sql<string>`unnest(${schema.restaurants.cuisines})`,
      visitCount: sql<number>`count(*)::int`,
    })
    .from(schema.visits)
    .innerJoin(schema.restaurants, eq(schema.restaurants.id, schema.visits.restaurantId))
    .groupBy(sql`unnest(${schema.restaurants.cuisines})`)
    .orderBy(sql`count(*) desc`)

  const neighborhoodRows = await database
    .select({
      neighborhood: schema.restaurants.neighborhood,
      visitCount: sql<number>`count(*)::int`,
    })
    .from(schema.visits)
    .innerJoin(schema.restaurants, eq(schema.restaurants.id, schema.visits.restaurantId))
    .where(sql`${schema.restaurants.neighborhood} is not null`)
    .groupBy(schema.restaurants.neighborhood)
    .orderBy(sql`count(*) desc`)

  const totalVisitRows = await database
    .select({ total: sql<number>`count(*)::int` })
    .from(schema.visits)

  const ranking = await loadRestaurantRanking()

  return {
    totalVisits: totalVisitRows.at(0)?.total ?? 0,
    cuisines: cuisineRows,
    neighborhoods: neighborhoodRows,
    bestRestaurant: ranking.at(0) ?? null,
    worstRestaurant: ranking.length > 1 ? ranking.at(-1) : null,
  }
}



export const loadSpending = async () => {
  const rows = await database
    .select({
      visitId: schema.visits.id,
      restaurantId: schema.restaurants.id,
      restaurantName: schema.restaurants.name,
      visitedAt: schema.visits.visitedAt,
      amount: schema.visitPriceEntries.amount,
    })
    .from(schema.visitPriceEntries)
    .innerJoin(schema.visits, eq(schema.visits.id, schema.visitPriceEntries.visitId))
    .innerJoin(schema.restaurants, eq(schema.restaurants.id, schema.visits.restaurantId))
    .orderBy(schema.visits.visitedAt)

  if (rows.length === 0) {
    return {
      currentMonth: { period: new Date().toISOString().slice(0, 7), total: 0, visitCount: 0 },
      byVisit: [],
      byRestaurant: [],
      byMonth: [],
      totalSpent: 0,
      averagePerVisit: 0,
    }
  }

  const totalSpent = rows.reduce((sum, row) => sum + Number(row.amount), 0)

  const restaurantTotals = new Map<string, { name: string; total: number; visits: number }>()
  const monthTotals = new Map<string, number>()

  rows.forEach((row) => {
    const existing = restaurantTotals.get(row.restaurantId) ?? {
      name: row.restaurantName,
      total: 0,
      visits: 0,
    }
    restaurantTotals.set(row.restaurantId, {
      name: row.restaurantName,
      total: existing.total + Number(row.amount),
      visits: existing.visits + 1,
    })

    const period = new Date(row.visitedAt).toISOString().slice(0, 7)
    monthTotals.set(period, (monthTotals.get(period) ?? 0) + Number(row.amount))
  })

  const currentPeriod = new Date().toISOString().slice(0, 7)
  const currentMonthRows = rows.filter(
    (row) => new Date(row.visitedAt).toISOString().slice(0, 7) === currentPeriod,
  )
  const currentMonthTotal = currentMonthRows.reduce((sum, row) => sum + Number(row.amount), 0)

  return {
    currentMonth: {
      period: currentPeriod,
      total: currentMonthTotal,
      visitCount: currentMonthRows.length,
    },
    byVisit: rows.map((row) => ({
      visitId: row.visitId,
      restaurantName: row.restaurantName,
      visitedAt: row.visitedAt,
      amount: Number(row.amount),
    })),
    byRestaurant: [...restaurantTotals.entries()]
      .map(([restaurantId, value]) => ({
        restaurantId,
        name: value.name,
        total: value.total,
        visits: value.visits,
        averagePerVisit: value.total / value.visits,
      }))
      .sort((first, second) => second.total - first.total),
    byMonth: [...monthTotals.entries()]
      .map(([period, total]) => ({ period, total }))
      .sort((first, second) => first.period.localeCompare(second.period)),
    totalSpent,
    averagePerVisit: totalSpent / rows.length,
  }
}

export const loadVisitFrequency = async () => {
  const monthRows = await database
    .select({
      period: sql<string>`to_char(${schema.visits.visitedAt}, 'YYYY-MM')`,
      visitCount: sql<number>`count(*)::int`,
    })
    .from(schema.visits)
    .groupBy(sql`to_char(${schema.visits.visitedAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${schema.visits.visitedAt}, 'YYYY-MM')`)

  const yearRows = await database
    .select({
      period: sql<string>`to_char(${schema.visits.visitedAt}, 'YYYY')`,
      visitCount: sql<number>`count(*)::int`,
    })
    .from(schema.visits)
    .groupBy(sql`to_char(${schema.visits.visitedAt}, 'YYYY')`)
    .orderBy(sql`to_char(${schema.visits.visitedAt}, 'YYYY')`)

  const restaurantRows = await database
    .select({
      restaurantId: schema.restaurants.id,
      name: schema.restaurants.name,
      visitCount: sql<number>`count(*)::int`,
      lastVisitedAt: sql<Date | null>`max(${schema.visits.visitedAt})`,
      firstVisitedAt: sql<Date | null>`min(${schema.visits.visitedAt})`,
    })
    .from(schema.visits)
    .innerJoin(schema.restaurants, eq(schema.restaurants.id, schema.visits.restaurantId))
    .groupBy(schema.restaurants.id, schema.restaurants.name)
    .orderBy(sql`count(*) desc`)

  return { byMonth: monthRows, byYear: yearRows, byRestaurant: restaurantRows }
}

export const loadVisitedRestaurantsForMap = async () => {
  const ranking = await loadRestaurantRanking()
  const scoreByRestaurant = new Map(ranking.map((entry) => [entry.restaurantId, entry]))

  const rows = await database
    .selectDistinct({
      id: schema.restaurants.id,
      name: schema.restaurants.name,
      latitude: schema.restaurants.latitude,
      longitude: schema.restaurants.longitude,
      neighborhood: schema.restaurants.neighborhood,
      cuisines: schema.restaurants.cuisines,
    })
    .from(schema.visits)
    .innerJoin(schema.restaurants, eq(schema.restaurants.id, schema.visits.restaurantId))

  return rows
    .filter((row) => row.latitude !== null && row.longitude !== null)
    .map((row) => ({
      id: row.id,
      name: row.name,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      neighborhood: row.neighborhood,
      cuisines: row.cuisines,
      averageScore: scoreByRestaurant.get(row.id)?.averageScore ?? null,
      visitCount: scoreByRestaurant.get(row.id)?.visitCount ?? 0,
    }))
}
