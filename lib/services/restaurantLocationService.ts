import { and, eq, isNull, or } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { lookupPostalCode } from '@/lib/places/lookupPostalCode'
import { isCompletePostalCode } from '@/lib/places/postalCode'
import { searchNominatim } from '@/lib/places/searchPlaces'

type Coordinates = { latitude: number; longitude: number }

type RestaurantLocation = {
  address: string | null
  neighborhood: string | null
  city: string | null
  postalCode: string | null
}

const buildAddressQuery = (location: RestaurantLocation) =>
  [location.address, location.neighborhood, location.city].filter(Boolean).join(', ')

const findCoordinatesByAddress = async (location: RestaurantLocation): Promise<Coordinates | null> => {
  if (!location.address) return null
  const candidates = await searchNominatim(buildAddressQuery(location))
  const match = candidates.find((candidate) => candidate.latitude !== null && candidate.longitude !== null)
  if (!match || match.latitude === null || match.longitude === null) return null
  return { latitude: match.latitude, longitude: match.longitude }
}

const findCoordinatesByPostalCode = async (location: RestaurantLocation): Promise<Coordinates | null> => {
  if (!location.postalCode || !isCompletePostalCode(location.postalCode)) return null
  const postalCodeAddress = await lookupPostalCode(location.postalCode)
  if (!postalCodeAddress || postalCodeAddress.latitude === null || postalCodeAddress.longitude === null) return null
  return { latitude: postalCodeAddress.latitude, longitude: postalCodeAddress.longitude }
}

export const findRestaurantCoordinates = async (location: RestaurantLocation) =>
  (await findCoordinatesByAddress(location)) ?? (await findCoordinatesByPostalCode(location))

const missingCoordinates = or(isNull(schema.restaurants.latitude), isNull(schema.restaurants.longitude))

export const fillMissingRestaurantCoordinates = async (restaurantId: string) => {
  const rows = await database
    .select({
      address: schema.restaurants.address,
      neighborhood: schema.restaurants.neighborhood,
      city: schema.restaurants.city,
      postalCode: schema.restaurants.postalCode,
    })
    .from(schema.restaurants)
    .where(and(eq(schema.restaurants.id, restaurantId), missingCoordinates))
    .limit(1)

  const restaurant = rows.at(0)
  if (!restaurant) return false

  const coordinates = await findRestaurantCoordinates(restaurant)
  if (!coordinates) return false

  await database
    .update(schema.restaurants)
    .set({ latitude: String(coordinates.latitude), longitude: String(coordinates.longitude) })
    .where(and(eq(schema.restaurants.id, restaurantId), missingCoordinates))
  return true
}

export const listRestaurantsMissingCoordinates = () =>
  database.select({ id: schema.restaurants.id, name: schema.restaurants.name }).from(schema.restaurants).where(missingCoordinates)
