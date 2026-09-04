import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import {
  loadStatistics,
  loadVisitFrequency,
  loadVisitedRestaurantsForMap,
} from '@/lib/services/analyticsService'

export const GET = async () =>
  withMember(async () => {
    const [statistics, mapPoints, frequency] = await Promise.all([
      loadStatistics(),
      loadVisitedRestaurantsForMap(),
      loadVisitFrequency(),
    ])

    return NextResponse.json({ ...statistics, mapPoints, frequency })
  })
