import { eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import type { ImageStorage } from './imageStorage'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const postgresImageStorage: ImageStorage = {
  saveImage: async (image) => {
    const [storedImage] = await database
      .insert(schema.storedImages)
      .values({
        bytes: image.bytes,
        contentType: image.contentType,
        width: image.width,
        height: image.height,
        byteSize: image.bytes.byteLength,
      })
      .returning({ id: schema.storedImages.id })

    return storedImage.id
  },

  readImage: async (imageKey) => {
    if (!uuidPattern.test(imageKey)) return null

    const rows = await database
      .select({ bytes: schema.storedImages.bytes, contentType: schema.storedImages.contentType })
      .from(schema.storedImages)
      .where(eq(schema.storedImages.id, imageKey))
      .limit(1)

    return rows.at(0) ?? null
  },

  removeImage: async (imageKey) => {
    if (!uuidPattern.test(imageKey)) return
    await database.delete(schema.storedImages).where(eq(schema.storedImages.id, imageKey))
  },

  resolveImageUrl: (imageKey) => `/api/images/${imageKey}`,
}
