const maximumUploadDimension = 2048
const uploadQuality = 0.92

const canvasToJpegBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', uploadQuality))

export const downscaleImageInBrowser = async (file: File): Promise<Blob> => {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maximumUploadDimension / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    return (await canvasToJpegBlob(canvas)) ?? file
  } catch {
    return file
  }
}
