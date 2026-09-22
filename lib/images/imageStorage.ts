export type StoredImageInput = {
  bytes: Buffer
  contentType: string
  width: number
  height: number
}

export type StoredImage = {
  bytes: Buffer
  contentType: string
}

export type ImageStorage = {
  saveImage: (image: StoredImageInput) => Promise<string>
  readImage: (imageKey: string) => Promise<StoredImage | null>
  removeImage: (imageKey: string) => Promise<void>
  resolveImageUrl: (imageKey: string) => string
}
