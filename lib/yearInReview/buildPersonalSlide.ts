import { formatScore, pluralize, roundScore } from './formatters'
import { rankMembersByStrictness } from './rankMembersByStrictness'
import { buildSlideEntry } from './slideEntry'
import type { YearDraw, YearMember, YearSlide, YearVisit } from './types'

export const buildPersonalSlide = (
  year: number,
  memberId: string,
  visits: YearVisit[],
  draws: YearDraw[],
  members: YearMember[],
): YearSlide | null => {
  const member = members.find((candidate) => candidate.memberId === memberId)
  if (!member) return null

  const ownRatings = visits.flatMap((visit) =>
    visit.ratings.filter((rating) => rating.memberId === memberId).map((rating) => ({ visit, score: rating.score })),
  )
  if (ownRatings.length === 0) return null

  const averageScore = ownRatings.reduce((sum, rating) => sum + rating.score, 0) / ownRatings.length
  const favorite = [...ownRatings].sort(
    (first, second) => second.score - first.score || second.visit.visitedAt.getTime() - first.visit.visitedAt.getTime(),
  )[0]
  const strictnessRanking = rankMembersByStrictness(visits, members)
  const strictnessPosition = strictnessRanking.findIndex((profile) => profile.member.memberId === memberId)
  const drawWinCount = draws.filter((draw) => draw.winnerMemberId === memberId).length

  return {
    key: 'personal',
    eyebrow: `e você, ${member.displayName}`,
    title: `Você deu ${pluralize(ownRatings.length, 'nota', 'notas')} em ${year}`,
    heroValue: formatScore(averageScore),
    heroCaption: 'sua média',
    heroScore: roundScore(averageScore),
    entries: [
      ...(strictnessPosition >= 0
        ? [
            buildSlideEntry({
              label: 'no ranking de carrasco',
              value: `${strictnessPosition + 1}º de ${strictnessRanking.length}`,
              detail: strictnessPosition === 0 ? 'o mais exigente' : null,
            }),
          ]
        : []),
      buildSlideEntry({
        label: 'seu lugar favorito',
        value: formatScore(favorite.score),
        detail: favorite.visit.restaurantName,
        valueScore: roundScore(favorite.score),
      }),
      buildSlideEntry({ label: 'sorteios que você ganhou', value: String(drawWinCount) }),
    ],
    quote: null,
    photoImageKey: favorite.visit.photoImageKey,
    avatar: { name: member.displayName, imageKey: member.avatarImageKey },
    restaurantId: favorite.visit.restaurantId,
    galleryImageKeys: [],
  }
}
