import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { loadYearInReview, toClientYearInReview } from '@/lib/services/yearInReviewService'
import { resolveYearInAppTimeZone } from '@/lib/utilities/appTimeZone'

export const runtime = 'nodejs'

export const GET = async () =>
  withMember(async (member) => {
    const yearInReview = await loadYearInReview(resolveYearInAppTimeZone(new Date()), member.id)
    return NextResponse.json(toClientYearInReview(yearInReview))
  })
