export type CropArea = {
  x: number
  y: number
  width: number
  height: number
}

const maximumCroppedDimension = 2048
const croppedImageQuality = 0.92

const loadImage = (imageUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Não consegui abrir essa imagem'))
    image.src = imageUrl
  })

const canvasToJpegBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Não consegui gerar a imagem ajustada'))),
      'image/jpeg',
      croppedImageQuality,
    ),
  )

export const cropImageInBrowser = async (imageUrl: string, cropArea: CropArea, backgroundColor: string) => {
  const image = await loadImage(imageUrl)
  const outputWidth = Math.round(Math.min(cropArea.width, maximumCroppedDimension))
  const scale = outputWidth / cropArea.width
  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = Math.round(cropArea.height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Seu navegador não conseguiu ajustar a imagem')

  context.fillStyle = backgroundColor
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image,
    -cropArea.x * scale,
    -cropArea.y * scale,
    image.naturalWidth * scale,
    image.naturalHeight * scale,
  )

  return canvasToJpegBlob(canvas)
}
