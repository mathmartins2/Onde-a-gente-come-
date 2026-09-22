import { yearInReviewConfiguration } from './configuration'
import { formatScore, pluralize } from './formatters'
import { rankMembersByStrictness } from './rankMembersByStrictness'
import { buildSlideEntry } from './slideEntry'
import type { YearMember, YearSlide, YearVisit } from './types'

const describePosition = (index: number, lastIndex: number) => {
  if (index === 0) return 'o mais exigente'
  if (index === lastIndex) return 'o mais bonzinho'
  return null
}

export const buildStrictnessSlide = (visits: YearVisit[], members: YearMember[]): YearSlide | null => {
  const ranking = rankMembersByStrictness(visits, members)
  if (ranking.length < yearInReviewConfiguration.minimumMembersForStrictness) return null

  const strictest = ranking[0]
  const mostGenerous = ranking[ranking.length - 1]

  return {
    key: 'strictness',
    eyebrow: 'quem é carrasco',
    title: `${strictest.member.displayName} é o carrasco da mesa`,
    heroValue: formatScore(strictest.averageScore),
    heroCaption: `média das notas de ${strictest.member.displayName}`,
    heroScore: strictest.averageScore,
    entries: ranking.map((profile, index) =>
      buildSlideEntry({
        label: profile.member.displayName,
        value: formatScore(profile.averageScore),
        detail: describePosition(index, ranking.length - 1) ?? pluralize(profile.ratingCount, 'nota', 'notas'),
        valueScore: profile.averageScore,
        avatar: { name: profile.member.displayName, imageKey: profile.member.avatarImageKey },
      }),
    ),
    quote: {
      text: `${mostGenerous.member.displayName} deu em média ${formatScore(mostGenerous.averageScore)}. Coração mole.`,
      author: 'a mesa',
    },
    photoImageKey: null,
    avatar: { name: strictest.member.displayName, imageKey: strictest.member.avatarImageKey },
  }
}
