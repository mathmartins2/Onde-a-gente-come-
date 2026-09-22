import { formatCurrency, pluralize } from './formatters'
import { buildSlideEntry } from './slideEntry'
import type { YearDraw, YearMember, YearSlide, YearVisit } from './types'

const maximumWinnerEntries = 2

export const findLongestDroughtByMember = (draws: YearDraw[], members: YearMember[]) => {
  const orderedDraws = [...draws].sort((first, second) => first.roundNumber - second.roundNumber)

  return members.map((member) => {
    const streaks = orderedDraws.reduce(
      (state, draw) => {
        const current = draw.winnerMemberId === member.memberId ? 0 : state.current + 1
        return { current, longest: Math.max(state.longest, current) }
      },
      { current: 0, longest: 0 },
    )
    return { member, longestDrought: streaks.longest }
  })
}

const summarizeSpending = (visits: YearVisit[]) => {
  const billedVisits = visits.filter((visit): visit is YearVisit & { billAmount: number } => visit.billAmount !== null)
  if (billedVisits.length === 0) return null

  const totalSpent = billedVisits.reduce((sum, visit) => sum + visit.billAmount, 0)
  const priciest = [...billedVisits].sort((first, second) => second.billAmount - first.billAmount)[0]

  return {
    totalSpent,
    billedVisitCount: billedVisits.length,
    averagePerOuting: totalSpent / billedVisits.length,
    priciest,
  }
}

const summarizeDraws = (draws: YearDraw[], members: YearMember[]) => {
  if (draws.length === 0) return null

  const winRanking = members
    .map((member) => ({
      member,
      winCount: draws.filter((draw) => draw.winnerMemberId === member.memberId).length,
    }))
    .sort((first, second) => second.winCount - first.winCount || first.member.displayName.localeCompare(second.member.displayName))

  const longestDrought = findLongestDroughtByMember(draws, members).sort(
    (first, second) => second.longestDrought - first.longestDrought,
  )[0]

  return { winRanking, longestDrought }
}

export const buildMoneyAndDrawsSlide = (
  visits: YearVisit[],
  draws: YearDraw[],
  members: YearMember[],
): YearSlide | null => {
  const spending = summarizeSpending(visits)
  const drawSummary = summarizeDraws(draws, members)
  if (!spending && !drawSummary) return null

  const luckiest = drawSummary?.winRanking[0] ?? null

  const spendingEntries = spending
    ? [
        buildSlideEntry({ label: 'por saída, em média', value: formatCurrency(spending.averagePerOuting) }),
        buildSlideEntry({
          label: 'a conta mais salgada',
          value: formatCurrency(spending.priciest.billAmount),
          detail: spending.priciest.restaurantName,
        }),
      ]
    : []

  const drawEntries = drawSummary
    ? [
        ...drawSummary.winRanking
          .filter((profile) => profile.winCount > 0)
          .slice(0, maximumWinnerEntries)
          .map((profile) =>
            buildSlideEntry({
              label: profile.member.displayName,
              value: pluralize(profile.winCount, 'sorteio', 'sorteios'),
              avatar: { name: profile.member.displayName, imageKey: profile.member.avatarImageKey },
            }),
          ),
        ...(drawSummary.longestDrought.longestDrought > 1
          ? [
              buildSlideEntry({
                label: 'maior seca',
                value: pluralize(drawSummary.longestDrought.longestDrought, 'rodada', 'rodadas'),
                detail: `${drawSummary.longestDrought.member.displayName} sem ganhar`,
              }),
            ]
          : []),
      ]
    : []

  return {
    key: 'moneyAndDraws',
    eyebrow: 'dinheiro e sorteio',
    title: spending
      ? 'Quanto custou comer fora'
      : `${luckiest?.member.displayName} foi quem mais ganhou o sorteio`,
    heroValue: spending ? formatCurrency(spending.totalSpent) : String(luckiest?.winCount ?? 0),
    heroCaption: spending
      ? `em ${pluralize(spending.billedVisitCount, 'conta registrada', 'contas registradas')}`
      : `sorteios ganhos por ${luckiest?.member.displayName}`,
    heroScore: null,
    entries: [...spendingEntries, ...drawEntries],
    quote: null,
    photoImageKey: null,
    avatar: null,
    restaurantId: null,
    galleryImageKeys: [],
  }
}
