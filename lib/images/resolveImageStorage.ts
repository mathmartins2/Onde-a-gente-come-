import type { ImageStorage } from './imageStorage'
import { postgresImageStorage } from './postgresImageStorage'

const imageStorageDrivers: Record<string, ImageStorage> = {
  postgres: postgresImageStorage,
}

const defaultDriverName = 'postgres'

export const resolveImageStorage = () => {
  const driverName = process.env.IMAGE_STORAGE_DRIVER ?? defaultDriverName
  const driver = imageStorageDrivers[driverName]
  if (!driver) throw new Error(`Unknown image storage driver: ${driverName}`)
  return driver
}

export const resolveImageUrl = (imageKey: string | null) =>
  imageKey ? resolveImageStorage().resolveImageUrl(imageKey) : null
