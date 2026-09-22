import { eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { fetchWebsiteCoverImage } from '@/lib/images/fetchWebsiteCoverImage'
import { normalizeImage, type ImagePresetName } from '@/lib/images/normalizeImage'
import { resolveImageStorage, resolveImageUrl } from '@/lib/images/resolveImageStorage'

const replaceStoredImage = async (input: {
  bytes: Buffer | null
  presetName: ImagePresetName
  previousImageKey: string | null
  persistImageKey: (imageKey: string | null) => Promise<void>
}) => {
  const storage = resolveImageStorage()
  const imageKey = input.bytes
    ? await storage.saveImage(await normalizeImage(input.bytes, input.presetName))
    : null

  await input.persistImageKey(imageKey)
  if (input.previousImageKey) await storage.removeImage(input.previousImageKey)

  return resolveImageUrl(imageKey)
}

const loadRestaurantImageFields = async (restaurantId: string) => {
  const rows = await database
    .select({ photoImageKey: schema.restaurants.photoImageKey, website: schema.restaurants.website })
    .from(schema.restaurants)
    .where(eq(schema.restaurants.id, restaurantId))
    .limit(1)

  return rows.at(0) ?? null
}

const persistRestaurantPhotoKey = (restaurantId: string) => async (imageKey: string | null) => {
  await database
    .update(schema.restaurants)
    .set({ photoImageKey: imageKey })
    .where(eq(schema.restaurants.id, restaurantId))
}

export const replaceRestaurantPhoto = async (restaurantId: string, bytes: Buffer | null) => {
  const restaurant = await loadRestaurantImageFields(restaurantId)
  if (!restaurant) return { found: false as const }

  const photoUrl = await replaceStoredImage({
    bytes,
    presetName: 'restaurantPhoto',
    previousImageKey: restaurant.photoImageKey,
    persistImageKey: persistRestaurantPhotoKey(restaurantId),
  })

  return { found: true as const, photoUrl }
}

export const importRestaurantPhotoFromWebsite = async (restaurantId: string) => {
  const restaurant = await loadRestaurantImageFields(restaurantId)
  if (!restaurant) return { found: false as const, photoUrl: null }
  if (!restaurant.website) return { found: true as const, photoUrl: null }

  const coverImageBytes = await fetchWebsiteCoverImage(restaurant.website)
  if (!coverImageBytes) return { found: true as const, photoUrl: null }

  try {
    return await replaceRestaurantPhoto(restaurantId, coverImageBytes)
  } catch {
    return { found: true as const, photoUrl: null }
  }
}

export const importMissingRestaurantPhoto = async (restaurantId: string) => {
  const restaurant = await loadRestaurantImageFields(restaurantId)
  if (!restaurant || restaurant.photoImageKey || !restaurant.website) return
  await importRestaurantPhotoFromWebsite(restaurantId)
}

export const replaceMemberAvatar = async (memberId: string, bytes: Buffer | null) => {
  const rows = await database
    .select({ avatarImageKey: schema.members.avatarImageKey })
    .from(schema.members)
    .where(eq(schema.members.id, memberId))
    .limit(1)

  return replaceStoredImage({
    bytes,
    presetName: 'memberAvatar',
    previousImageKey: rows.at(0)?.avatarImageKey ?? null,
    persistImageKey: async (imageKey) => {
      await database
        .update(schema.members)
        .set({ avatarImageKey: imageKey })
        .where(eq(schema.members.id, memberId))
    },
  })
}
