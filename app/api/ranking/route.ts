import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import {
  loadNominatorRanking,
  loadRestaurantRanking,
  loadStrictnessProfile,
} from '@/lib/services/analyticsService'

export const GET = async () =>
  withMember(async () => {
    const [restaurants, nominators, strictness] = await Promise.all([
      loadRestaurantRanking(),
      loadNominatorRanking(),
      loadStrictnessProfile(),
    ])

    return NextResponse.json({ restaurants, nominators, strictness })
  })
