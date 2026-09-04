import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })

const run = async () => {
  const { database, schema } = await import('@/lib/database/client')
  const { hashSecret } = await import('@/lib/auth/password')

  const provisionalPassword = process.env.SEED_PASSWORD ?? 'trocar-esta-senha'
  const provisionalPasswordHash = await hashSecret(provisionalPassword)

  const memberSeeds = [
    { username: 'math', displayName: 'math', provisionalPin: '1111', isAdmin: true },
    { username: 'alucard', displayName: 'alucard', provisionalPin: '2222' },
    { username: 'romario', displayName: 'romario', provisionalPin: '3333' },
    { username: 'vini', displayName: 'vini', provisionalPin: '4444' },
  ]

  const memberValues = await Promise.all(
    memberSeeds.map(async (member) => ({
      username: member.username,
      displayName: member.displayName,
      passwordHash: provisionalPasswordHash,
      ratingPinHash: await hashSecret(member.provisionalPin),
      mustChangePassword: true,
      isAdmin: member.isAdmin ?? false,
    })),
  )

  const insertedMembers = await database
    .insert(schema.members)
    .values(memberValues)
    .onConflictDoNothing()
    .returning()

  const allMembers = insertedMembers.length > 0 ? insertedMembers : await database.select().from(schema.members)
  const memberByUsername = new Map(allMembers.map((member) => [member.username, member]))

  const restaurantSeeds = [
    {
      name: 'Outback',
      suggestedBy: 'vini',
      address: 'Avenida República do Líbano, 256',
      neighborhood: 'Pina',
      city: 'Recife',
      postalCode: '51110-160',
      latitude: '-8.0856588',
      longitude: '-34.8939144',
      phone: '+55 81 3035-0930',
      cuisines: ['Steak'],
    },
    {
      name: 'Rock n Ribs',
      suggestedBy: 'romario',
      address: 'Avenida Alfredo Lisboa',
      neighborhood: 'Bairro do Recife',
      city: 'Recife',
      postalCode: '50030-150',
      latitude: '-8.0640970',
      longitude: '-34.8714463',
      cuisines: ['Steak'],
    },
    {
      name: 'Ruffo Recife',
      suggestedBy: 'math',
      neighborhood: 'Ilha do Leite',
      city: 'Recife',
      cuisines: ['Varied'],
    },
    {
      name: 'Yokocho Izakaya e Sushi Bar',
      suggestedBy: 'math',
      address: 'Rua Padre Anchieta',
      neighborhood: 'Madalena',
      city: 'Recife',
      postalCode: '50710-165',
      latitude: '-8.0471783',
      longitude: '-34.9060935',
      cuisines: ['Japanese'],
    },
    { name: 'Forneria1121', suggestedBy: 'vini', city: 'Recife', cuisines: ['Pizza'] },
    {
      name: 'Entre Amigos',
      suggestedBy: 'romario',
      address: 'Rua da Hora',
      neighborhood: 'Espinheiro',
      city: 'Recife',
      postalCode: '52020-015',
      latitude: '-8.0472201',
      longitude: '-34.8946941',
      cuisines: ['Steak', 'Japanese'],
    },
    { name: 'Zen', suggestedBy: 'math', city: 'Recife', cuisines: ['Japanese'] },
  ]

  const insertedRestaurants = await database
    .insert(schema.restaurants)
    .values(
      restaurantSeeds.map((restaurant) => ({
        name: restaurant.name,
        address: restaurant.address ?? null,
        neighborhood: restaurant.neighborhood ?? null,
        city: restaurant.city ?? null,
        postalCode: restaurant.postalCode ?? null,
        latitude: restaurant.latitude ?? null,
        longitude: restaurant.longitude ?? null,
        phone: restaurant.phone ?? null,
        placeSource: restaurant.latitude ? 'nominatim' : null,
        cuisines: restaurant.cuisines ?? [],
        createdBy: memberByUsername.get(restaurant.suggestedBy)?.id ?? null,
      })),
    )
    .onConflictDoNothing()
    .returning()

  const allRestaurants =
    insertedRestaurants.length > 0 ? insertedRestaurants : await database.select().from(schema.restaurants)
  const restaurantByName = new Map(allRestaurants.map((restaurant) => [restaurant.name, restaurant]))

  const visitSeeds = [
    { restaurantName: 'Outback', suggestedBy: 'vini', legacyScore: null, legacyComment: null },
    { restaurantName: 'Rock n Ribs', suggestedBy: 'romario', legacyScore: '4.3', legacyComment: 'Clássico' },
    { restaurantName: 'Ruffo Recife', suggestedBy: 'math', legacyScore: '5.0', legacyComment: 'Restaurante completo.' },
    { restaurantName: 'Yokocho Izakaya e Sushi Bar', suggestedBy: 'math', legacyScore: '4.3', legacyComment: null },
  ]

  await database
    .insert(schema.visits)
    .values(
      visitSeeds.flatMap((visit) => {
        const restaurant = restaurantByName.get(visit.restaurantName)
        if (!restaurant) return []
        return [
          {
            restaurantId: restaurant.id,
            recommendedByMemberId: memberByUsername.get(visit.suggestedBy)?.id ?? null,
            legacyScore: visit.legacyScore,
            legacyComment: visit.legacyComment,
            revealedAt: new Date(),
          },
        ]
      }),
    )
    .onConflictDoNothing()

  const nominationSeeds = [
    { username: 'vini', restaurantName: 'Forneria1121' },
    { username: 'romario', restaurantName: 'Entre Amigos' },
    { username: 'math', restaurantName: 'Zen' },
  ]

  await database
    .insert(schema.nominations)
    .values(
      nominationSeeds.flatMap((nomination) => {
        const member = memberByUsername.get(nomination.username)
        const restaurant = restaurantByName.get(nomination.restaurantName)
        if (!member || !restaurant) return []
        return [{ memberId: member.id, restaurantId: restaurant.id }]
      }),
    )
    .onConflictDoNothing()

  const counts = {
    members: (await database.select().from(schema.members)).length,
    restaurants: (await database.select().from(schema.restaurants)).length,
    visits: (await database.select().from(schema.visits)).length,
    nominations: (await database.select().from(schema.nominations)).length,
  }

  console.log('seed concluido:', counts)
  console.log('senha provisoria de todos:', provisionalPassword)
  memberSeeds.forEach((member) => {
    console.log(`  ${member.username} -> PIN provisorio ${member.provisionalPin}`)
  })
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
