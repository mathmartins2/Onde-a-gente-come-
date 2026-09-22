import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })

type MemberUsername = 'math' | 'romario' | 'vini' | 'alucard'

type DemoRound = {
  restaurantName: string
  recommendedBy: MemberUsername
  visitedAtIso: string
  scores: Record<MemberUsername, number>
  comments: Partial<Record<MemberUsername, string>>
  billAmount: string | null
}

const criterionOffsets = [0.5, -0.5, 0, 0.5, 0, -0.5] as const

const clampToScale = (value: number) => Math.min(5, Math.max(0, value))

const roundToHalf = (value: number) => Math.round(value * 2) / 2

const buildCriterionScores = (overallScore: number) => {
  const [flavor, price, service, ambience, menu, waitTime] = criterionOffsets.map((offset) =>
    roundToHalf(clampToScale(overallScore + offset)),
  )
  return { flavor, price, service, ambience, menu, waitTime }
}

const averageOfCriteria = (criteria: ReturnType<typeof buildCriterionScores>) =>
  Object.values(criteria).reduce((sum, value) => sum + value, 0) / criterionOffsets.length

const demoRounds: DemoRound[] = [
  {
    restaurantName: 'Rock n Ribs',
    recommendedBy: 'alucard',
    visitedAtIso: '2025-12-31T23:30:00-03:00',
    scores: { math: 3.5, romario: 4, vini: 3, alucard: 4.5 },
    comments: { vini: 'Costela boa, mas saí com cheiro de fumaça até o ano novo' },
    billAmount: '312.00',
  },
  {
    restaurantName: 'Outback',
    recommendedBy: 'vini',
    visitedAtIso: '2026-01-01T13:00:00-03:00',
    scores: { math: 4, romario: 4.5, vini: 5, alucard: 3.5 },
    comments: { alucard: 'Bloomin onion carregou a nota sozinha' },
    billAmount: '287.50',
  },
  {
    restaurantName: 'Yokocho Izakaya e Sushi Bar',
    recommendedBy: 'math',
    visitedAtIso: '2026-02-06T20:30:00-03:00',
    scores: { math: 5, romario: 4.5, vini: 4.5, alucard: 4 },
    comments: { romario: 'Melhor salmão maçaricado de Recife, sem discussão' },
    billAmount: '356.80',
  },
  {
    restaurantName: 'Forneria1121',
    recommendedBy: 'romario',
    visitedAtIso: '2026-03-13T20:30:00-03:00',
    scores: { math: 3, romario: 4, vini: 3.5, alucard: 2.5 },
    comments: { alucard: 'Massa murcha e demorou quase uma hora' },
    billAmount: '198.40',
  },
  {
    restaurantName: 'Zen',
    recommendedBy: 'alucard',
    visitedAtIso: '2026-04-10T20:30:00-03:00',
    scores: { math: 2.5, romario: 3, vini: 2, alucard: 3.5 },
    comments: { vini: 'O temaki veio mais arroz que peixe', math: 'Não volto' },
    billAmount: '176.00',
  },
  {
    restaurantName: 'Ruffo Recife',
    recommendedBy: 'vini',
    visitedAtIso: '2026-05-22T20:30:00-03:00',
    scores: { math: 4.5, romario: 5, vini: 5, alucard: 4.5 },
    comments: { math: 'Atendimento impecável, virou referência da mesa' },
    billAmount: '421.90',
  },
  {
    restaurantName: 'Entre Amigos',
    recommendedBy: 'math',
    visitedAtIso: '2026-07-03T20:30:00-03:00',
    scores: { math: 4, romario: 3.5, vini: 3.5, alucard: 3 },
    comments: { romario: 'Picanha no ponto, mas o preço assustou' },
    billAmount: '268.00',
  },
  {
    restaurantName: 'Rock n Ribs',
    recommendedBy: 'romario',
    visitedAtIso: '2026-07-31T20:30:00-03:00',
    scores: { math: 4, romario: 4.5, vini: 3.5, alucard: 3.5 },
    comments: {},
    billAmount: null,
  },
  {
    restaurantName: 'Outback',
    recommendedBy: 'vini',
    visitedAtIso: '2026-08-28T20:30:00-03:00',
    scores: { math: 3.5, romario: 4, vini: 4.5, alucard: 3 },
    comments: { alucard: 'Mesma coisa de sempre, o que não é ruim' },
    billAmount: '301.20',
  },
  {
    restaurantName: 'Yokocho Izakaya e Sushi Bar',
    recommendedBy: 'vini',
    visitedAtIso: '2026-09-11T20:30:00-03:00',
    scores: { math: 4.5, romario: 4.5, vini: 5, alucard: 4 },
    comments: { vini: 'Voltou a ser o melhor rolê do ano' },
    billAmount: '389.00',
  },
]

const run = async () => {
  const { database, schema } = await import('@/lib/database/client')
  const { calculateVisitScore, resolveRatingWeight } = await import(
    '@/lib/scoring/calculateVisitScore'
  )

  const members = await database.select().from(schema.members)
  const restaurants = await database.select().from(schema.restaurants)
  if (members.length === 0 || restaurants.length === 0) {
    console.log('run `pnpm database:seed` first')
    process.exit(1)
  }

  const memberByUsername = new Map(members.map((member) => [member.username, member]))
  const restaurantByName = new Map(restaurants.map((restaurant) => [restaurant.name, restaurant]))

  const existingDraws = await database
    .select({ roundNumber: schema.draws.roundNumber })
    .from(schema.draws)
  const highestRoundNumber = existingDraws.reduce(
    (highest, draw) => Math.max(highest, draw.roundNumber),
    0,
  )

  for (const [roundIndex, round] of demoRounds.entries()) {
    const restaurant = restaurantByName.get(round.restaurantName)
    const recommender = memberByUsername.get(round.recommendedBy)
    if (!restaurant || !recommender) continue

    const visitedAt = new Date(round.visitedAtIso)

    const [draw] = await database
      .insert(schema.draws)
      .values({
        roundNumber: highestRoundNumber + roundIndex + 1,
        winnerMemberId: recommender.id,
        restaurantId: restaurant.id,
        weightSnapshot: {
          participants: members.map((member) => ({
            memberId: member.id,
            displayName: member.displayName,
            isReady: true,
            rankedCount: 3,
          })),
          contenders: [],
        },
        drawnAt: visitedAt,
      })
      .returning()

    const [visit] = await database
      .insert(schema.visits)
      .values({
        restaurantId: restaurant.id,
        drawId: draw.id,
        recommendedByMemberId: recommender.id,
        visitedAt,
        visitDateConfirmedAt: visitedAt,
        revealedAt: visitedAt,
      })
      .returning()

    const ratingValues = Object.entries(round.scores).flatMap(([username, overallScore]) => {
      const member = memberByUsername.get(username)
      if (!member) return []
      const criteria = buildCriterionScores(overallScore)
      return [
        {
          visitId: visit.id,
          memberId: member.id,
          score: averageOfCriteria(criteria).toFixed(2),
          flavorScore: String(criteria.flavor),
          priceScore: String(criteria.price),
          serviceScore: String(criteria.service),
          ambienceScore: String(criteria.ambience),
          menuScore: String(criteria.menu),
          waitTimeScore: String(criteria.waitTime),
          comment: round.comments[username as MemberUsername] ?? null,
          appliedWeight: String(resolveRatingWeight(member.id, recommender.id)),
          createdAt: visitedAt,
        },
      ]
    })

    await database.insert(schema.ratings).values(ratingValues)

    if (round.billAmount) {
      await database.insert(schema.visitPriceEntries).values({
        visitId: visit.id,
        addedByMemberId: recommender.id,
        amount: round.billAmount,
        createdAt: visitedAt,
      })
    }

    const finalScore = calculateVisitScore(
      ratingValues.map((rating) => ({ memberId: rating.memberId, score: Number(rating.score) })),
      recommender.id,
    )

    console.log(
      `${round.visitedAtIso.slice(0, 10)}  ${restaurant.name.padEnd(28)} ${finalScore?.toFixed(2)}  won by ${recommender.displayName}`,
    )
  }

  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
