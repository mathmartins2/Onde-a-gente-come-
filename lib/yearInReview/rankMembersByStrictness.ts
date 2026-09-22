import { yearInReviewConfiguration } from './configuration'
import type { YearMember, YearVisit } from './types'

export const rankMembersByStrictness = (visits: YearVisit[], members: YearMember[]) =>
  members
    .map((member) => {
      const memberScores = visits.flatMap((visit) =>
        visit.ratings.filter((rating) => rating.memberId === member.memberId).map((rating) => rating.score),
      )
      return {
        member,
        ratingCount: memberScores.length,
        averageScore:
          memberScores.length === 0
            ? null
            : memberScores.reduce((sum, score) => sum + score, 0) / memberScores.length,
      }
    })
    .filter(
      (profile): profile is typeof profile & { averageScore: number } =>
        profile.averageScore !== null &&
        profile.ratingCount >= yearInReviewConfiguration.minimumRatingsForStrictness,
    )
    .sort((first, second) => first.averageScore - second.averageScore)
