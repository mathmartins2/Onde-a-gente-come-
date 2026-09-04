export type MapsLinkTarget = {
  name: string
  address?: string | null
  neighborhood?: string | null
  city?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
}

const toFiniteNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const buildGoogleMapsUrl = (target: MapsLinkTarget) => {
  const latitude = toFiniteNumber(target.latitude)
  const longitude = toFiniteNumber(target.longitude)

  if (latitude !== null && longitude !== null) {
    const coordinates = `${latitude},${longitude}`
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`
  }

  const searchTerm = [target.name, target.address, target.neighborhood, target.city]
    .filter((piece) => Boolean(piece && String(piece).trim().length > 0))
    .join(', ')

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchTerm)}`
}
