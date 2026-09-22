import { buildBestAndWorstSlide } from './buildBestAndWorstSlide'
import { buildMoneyAndDrawsSlide } from './buildMoneyAndDrawsSlide'
import { buildPersonalSlide } from './buildPersonalSlide'
import { buildStrictnessSlide } from './buildStrictnessSlide'
import { buildSummarySlide } from './buildSummarySlide'
import { yearInReviewConfiguration } from './configuration'
import type { YearInReviewInput, YearSlide } from './types'

export const buildYearInReview = ({ year, memberId, visits, draws, members }: YearInReviewInput) => {
  const isAvailable = visits.length >= yearInReviewConfiguration.minimumOutingCount
  const slides = isAvailable
    ? [
        buildSummarySlide(year, visits),
        buildBestAndWorstSlide(visits, members),
        buildStrictnessSlide(visits, members),
        buildMoneyAndDrawsSlide(visits, draws, members),
        buildPersonalSlide(year, memberId, visits, draws, members),
      ].filter((slide): slide is YearSlide => slide !== null)
    : []

  return {
    year,
    isAvailable,
    outingCount: visits.length,
    minimumOutingCount: yearInReviewConfiguration.minimumOutingCount,
    slides,
  }
}

export type YearInReview = ReturnType<typeof buildYearInReview>
