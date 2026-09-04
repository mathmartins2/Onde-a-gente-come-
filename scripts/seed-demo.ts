import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })

type CriterionScores = {
  flavor: number
  price: number
  service: number
  ambience: number
  menu: number
}

const averageOf = (scores: CriterionScores) =>
  (scores.flavor + scores.price + scores.service + scores.ambience + scores.menu) / 5

const run = async () => {
  const { database, schema } = await import('@/lib/database/client')
  const { eq } = await import('drizzle-orm')
  const { resolveRatingWeight } = await import('@/lib/scoring/calculateVisitScore')
  const { calculateVisitScore } = await import('@/lib/scoring/calculateVisitScore')

  const members = await database.select().from(schema.members)
  const restaurants = await database.select().from(schema.restaurants)
  if (members.length === 0 || restaurants.length === 0) {
    console.log('rode `pnpm database:seed` antes')
    process.exit(1)
  }

  const memberByUsername = new Map(members.map((member) => [member.username, member]))
  const restaurantByName = new Map(restaurants.map((restaurant) => [restaurant.name, restaurant]))

  const rounds = [
    {
      restaurantName: 'Yokocho Izakaya e Sushi Bar',
      recommendedBy: 'math',
      monthsAgo: 3,
      ratings: {
        math: { flavor: 5, price: 4, service: 5, ambience: 5, menu: 5 },
        alucard: { flavor: 4, price: 3, service: 4, ambience: 4, menu: 4 },
        romario: { flavor: 5, price: 3, service: 4, ambience: 5, menu: 5 },
        vini: { flavor: 4, price: 3, service: 4, ambience: 4, menu: 4 },
      },
      prices: [{ by: 'math', amount: '234.40' }],
    },
    {
      restaurantName: 'Entre Amigos',
      recommendedBy: 'romario',
      monthsAgo: 1,
      ratings: {
        math: { flavor: 3, price: 2, service: 3, ambience: 4, menu: 4 },
        alucard: { flavor: 3, price: 2, service: 2, ambience: 3, menu: 3 },
        romario: { flavor: 5, price: 4, service: 5, ambience: 5, menu: 5 },
        vini: { flavor: 3, price: 2, service: 3, ambience: 3, menu: 3 },
      },
      prices: [{ by: 'romario', amount: '240.00' }],
    },
  ]

  const existingDraws = await database.select({ roundNumber: schema.draws.roundNumber }).from(schema.draws)
  let roundNumber = existingDraws.reduce((highest, draw) => Math.max(highest, draw.roundNumber), 0)

  for (const round of rounds) {
    const restaurant = restaurantByName.get(round.restaurantName)
    const recommender = memberByUsername.get(round.recommendedBy)
    if (!restaurant || !recommender) continue

    roundNumber += 1
    const drawnAt = new Date()
    drawnAt.setMonth(drawnAt.getMonth() - round.monthsAgo)

    const contenders = restaurants.slice(0, 4).map((entry, index) => ({
      restaurantId: entry.id,
      name: entry.name,
      addedByName: memberByUsername.get('math')?.displayName ?? '',
      chance: [0.45, 0.3, 0.15, 0.1][index] ?? 0.1,
      bordaPoints: [0.5, 0.33, 0.17, 0.1][index] ?? 0.1,
      ownerWeight: 1,
      revisitWeight: 1,
      supporters: 4 - index,
      topChoiceCount: index === 0 ? 3 : 0,
      weight: 1,
    }))

    const [draw] = await database
      .insert(schema.draws)
      .values({
        roundNumber,
        winnerMemberId: recommender.id,
        restaurantId: restaurant.id,
        weightSnapshot: {
          participants: members.map((member) => ({
            memberId: member.id,
            displayName: member.displayName,
            isReady: true,
            rankedCount: 3,
          })),
          contenders,
        },
        drawnAt,
      })
      .returning()

    const [visit] = await database
      .insert(schema.visits)
      .values({
        restaurantId: restaurant.id,
        drawId: draw.id,
        recommendedByMemberId: recommender.id,
        visitedAt: drawnAt,
        revealedAt: drawnAt,
      })
      .returning()

    const ratingValues = Object.entries(round.ratings).flatMap(([username, scores]) => {
      const member = memberByUsername.get(username)
      if (!member) return []
      return [
        {
          visitId: visit.id,
          memberId: member.id,
          score: String(averageOf(scores)),
          flavorScore: String(scores.flavor),
          priceScore: String(scores.price),
          serviceScore: String(scores.service),
          ambienceScore: String(scores.ambience),
          menuScore: String(scores.menu),
          appliedWeight: String(resolveRatingWeight(member.id, recommender.id)),
          createdAt: drawnAt,
        },
      ]
    })

    await database.insert(schema.ratings).values(ratingValues).onConflictDoNothing()

    const priceValues = round.prices.flatMap((price) => {
      const member = memberByUsername.get(price.by)
      if (!member) return []
      return [
        {
          visitId: visit.id,
          addedByMemberId: member.id,
          amount: price.amount,
          createdAt: drawnAt,
        },
      ]
    })
    await database.insert(schema.visitPriceEntries).values(priceValues)

    const finalScore = calculateVisitScore(
      ratingValues.map((rating) => ({ memberId: rating.memberId, score: Number(rating.score) })),
      recommender.id,
    )
    const plainAverage =
      ratingValues.reduce((sum, rating) => sum + Number(rating.score), 0) / ratingValues.length

    console.log(`rodada ${roundNumber}: ${restaurant.name} (indicado por ${recommender.displayName})`)
    ratingValues.forEach((rating) => {
      const member = members.find((entry) => entry.id === rating.memberId)
      const weight = Number(rating.appliedWeight)
      console.log(
        `   ${member?.displayName.padEnd(8)} ${Number(rating.score).toFixed(2)}  peso ${weight.toFixed(2)}${weight === 1 ? ' (indicou)' : ''}`,
      )
    })
    console.log(`   media simples   ${plainAverage.toFixed(4)}`)
    console.log(`   nota ponderada  ${finalScore?.toFixed(4)}`)
    console.log('')
  }

  await database
    .update(schema.members)
    .set({ roundsSinceLastWin: 2 })
    .where(eq(schema.members.username, 'vini'))
  await database
    .update(schema.members)
    .set({ roundsSinceLastWin: 3 })
    .where(eq(schema.members.username, 'alucard'))

  const pendingRestaurant = restaurantByName.get('Zen')
  const pendingRecommender = memberByUsername.get('math')
  if (pendingRestaurant && pendingRecommender) {
    roundNumber += 1
    const [pendingDraw] = await database
      .insert(schema.draws)
      .values({
        roundNumber,
        winnerMemberId: pendingRecommender.id,
        restaurantId: pendingRestaurant.id,
        weightSnapshot: {
          participants: members.map((member) => ({
            memberId: member.id,
            displayName: member.displayName,
            isReady: true,
            rankedCount: 2,
          })),
          contenders: [
            {
              restaurantId: pendingRestaurant.id,
              name: pendingRestaurant.name,
              addedByName: pendingRecommender.displayName,
              chance: 0.62,
              bordaPoints: 0.5,
              ownerWeight: 1,
              revisitWeight: 1,
              supporters: 4,
              topChoiceCount: 3,
              weight: 1,
            },
          ],
        },
      })
      .returning()

    const [pendingVisit] = await database
      .insert(schema.visits)
      .values({
        restaurantId: pendingRestaurant.id,
        drawId: pendingDraw.id,
        recommendedByMemberId: pendingRecommender.id,
      })
      .returning()

    await database.insert(schema.ratingSessionParticipants).values(
      members.map((member) => ({ visitId: pendingVisit.id, memberId: member.id })),
    )

    console.log('')
    console.log('ESPERANDO NOTA: ' + pendingRestaurant.name + ' (indicado por math)')
    console.log('  abra http://localhost:3000 e clique em "Esperando nota"')
    console.log('  ninguem avaliou ainda, entao da pra testar a tela inteira')
  }

  console.log('')
  console.log('pity timer: alucard 3 rodadas sem ganhar, vini 2')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
