import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import {
  loadStatistics,
  loadSpending,
  loadVisitFrequency,
  loadVisitedRestaurantsForMap,
} from '@/lib/services/analyticsService'

export const GET = async () =>
  withMember(async () => {
    const [statistics, mapPoints, frequency, spending] = await Promise.all([
      loadStatistics(),
      loadVisitedRestaurantsForMap(),
      loadVisitFrequency(),
      loadSpending(),
    ])

    return NextResponse.json({ ...statistics, mapPoints, frequency, spending })
  })
