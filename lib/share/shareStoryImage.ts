export const fetchStoryFile = async (imagePath: string, fileName: string) => {
  const response = await fetch(imagePath, { credentials: 'same-origin' })
  if (!response.ok) throw new Error(`Story image request failed with ${response.status}`)
  return new File([await response.blob()], fileName, { type: 'image/png' })
}

const downloadFile = (file: File) => {
  const objectUrl = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = file.name
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

const isShareCancellation = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

export const shareStoryFile = async (file: File) => {
  const shareData = { files: [file] }
  const canShareFiles = typeof navigator.canShare === 'function' && navigator.canShare(shareData)
  if (!canShareFiles) {
    downloadFile(file)
    return 'downloaded' as const
  }

  try {
    await navigator.share(shareData)
    return 'shared' as const
  } catch (error) {
    if (isShareCancellation(error)) return 'cancelled' as const
    throw error
  }
}
