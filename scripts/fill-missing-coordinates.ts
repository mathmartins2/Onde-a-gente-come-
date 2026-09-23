import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })

const delayBetweenLookupsInMilliseconds = 1100

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const run = async () => {
  const { fillMissingRestaurantCoordinates, listRestaurantsMissingCoordinates } = await import(
    '@/lib/services/restaurantLocationService'
  )
  const restaurants = await listRestaurantsMissingCoordinates()
  console.log(`restaurants without a location: ${restaurants.length}`)

  const outcomes = await restaurants.reduce<Promise<Array<{ name: string; wasFilled: boolean }>>>(
    async (previousOutcomes, restaurant) => {
      const collected = await previousOutcomes
      const wasFilled = await fillMissingRestaurantCoordinates(restaurant.id)
      await wait(delayBetweenLookupsInMilliseconds)
      return [...collected, { name: restaurant.name, wasFilled }]
    },
    Promise.resolve([]),
  )

  outcomes.forEach((outcome) => console.log(`${outcome.wasFilled ? 'filled' : 'not found'}: ${outcome.name}`))
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
