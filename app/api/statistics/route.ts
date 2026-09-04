import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { loadStatistics, loadVisitedRestaurantsForMap } from '@/lib/services/analyticsService'

export const GET = async () =>
  withMember(async () => {
    const [statistics, mapPoints] = await Promise.all([
      loadStatistics(),
      loadVisitedRestaurantsForMap(),
    ])

    return NextResponse.json({ ...statistics, mapPoints })
  })
