import type { PlaceCandidate } from './types'
import { searchNominatim } from './searchPlaces'
import { placesHttpClient, redirectFollowingClient } from './httpClient'

const allowedHosts = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'www.google.com',
  'google.com',
  'maps.google.com',
  'www.google.com.br',
  'google.com.br',
  'maps.google.com.br',
])

const maximumRedirects = 5

export const isAllowedMapsHost = (candidateUrl: string) => {
  try {
    const parsed = new URL(candidateUrl)
    if (parsed.protocol !== 'https:') return false
    return allowedHosts.has(parsed.hostname.toLowerCase())
  } catch {
    return false
  }
}

export const followRedirects = async (initialUrl: string) => {
  const visit = async (currentUrl: string, remainingHops: number): Promise<string | null> => {
    if (!isAllowedMapsHost(currentUrl)) return null
    if (remainingHops <= 0) return currentUrl

    try {
      const response = await redirectFollowingClient.get(currentUrl)
      const location = response.headers.location
      if (!location) return currentUrl

      const nextUrl = new URL(String(location), currentUrl).toString()
      return await visit(nextUrl, remainingHops - 1)
    } catch {
      return null
    }
  }

  return visit(initialUrl, maximumRedirects)
}

export const parseCoordinatesFromMapsUrl = (mapsUrl: string) => {
  const atMatch = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) return { latitude: Number(atMatch[1]), longitude: Number(atMatch[2]) }

  const bangMatch = mapsUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (bangMatch) return { latitude: Number(bangMatch[1]), longitude: Number(bangMatch[2]) }

  const queryMatch = mapsUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (queryMatch) return { latitude: Number(queryMatch[1]), longitude: Number(queryMatch[2]) }

  return null
}

const readQueryParameter = (mapsUrl: string) => {
  try {
    const query = new URL(mapsUrl).searchParams.get('q')
    if (!query) return null
    const trimmed = query.trim()
    return trimmed.length === 0 ? null : trimmed
  } catch {
    return null
  }
}

const looksLikeCoordinatePair = (value: string) => /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(value)

export const parseSearchTermFromMapsUrl = (mapsUrl: string) => {
  const placeMatch = mapsUrl.match(/\/maps\/place\/([^/@?]+)/)
  if (placeMatch) {
    const decoded = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ').trim()
    return decoded.length === 0 ? null : decoded
  }

  const query = readQueryParameter(mapsUrl)
  if (!query) return null
  if (looksLikeCoordinatePair(query)) return null
  return query
}

export const parseNameFromMapsUrl = (mapsUrl: string) => {
  const searchTerm = parseSearchTermFromMapsUrl(mapsUrl)
  if (!searchTerm) return null

  const firstSegment = searchTerm.split(',').at(0)?.trim() ?? ''
  return firstSegment.length === 0 ? searchTerm : firstSegment
}

export const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<Partial<PlaceCandidate>> => {
  const parameters = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'jsonv2',
    addressdetails: '1',
  })

  try {
    const response = await placesHttpClient.get(
      `https://nominatim.openstreetmap.org/reverse?${parameters}`,
    )
    const address = response.data?.address ?? {}
    const street = address.road ?? null
    const houseNumber = address.house_number ?? null

    return {
      address: street ? [street, houseNumber].filter(Boolean).join(', ') : null,
      neighborhood: address.suburb ?? address.neighbourhood ?? address.city_district ?? null,
      city: address.city ?? address.town ?? address.municipality ?? null,
      postalCode: address.postcode ?? null,
    }
  } catch {
    return {}
  }
}

const findFirstMatchingPlace = async (searchTerm: string | null, name: string | null) => {
  if (searchTerm) {
    const bySearchTerm = await searchNominatim(searchTerm)
    const preciseMatch = bySearchTerm.at(0)
    if (preciseMatch) return preciseMatch
  }

  if (!name || name === searchTerm) return null

  const byName = await searchNominatim(name)
  return byName.at(0) ?? null
}

export const resolveMapsLink = async (link: string): Promise<PlaceCandidate | null> => {
  if (!isAllowedMapsHost(link)) return null

  const resolvedUrl = await followRedirects(link)
  if (!resolvedUrl) return null

  const coordinates = parseCoordinatesFromMapsUrl(resolvedUrl)
  const searchTerm = parseSearchTermFromMapsUrl(resolvedUrl)
  const name = parseNameFromMapsUrl(resolvedUrl)
  if (!coordinates && !searchTerm) return null

  const reverseGeocoded = coordinates
    ? await reverseGeocode(coordinates.latitude, coordinates.longitude)
    : {}

  const fallbackCandidate = coordinates
    ? null
    : await findFirstMatchingPlace(searchTerm, name)

  return {
    name: name ?? fallbackCandidate?.name ?? 'Restaurante',
    address: reverseGeocoded.address ?? fallbackCandidate?.address ?? null,
    neighborhood: reverseGeocoded.neighborhood ?? fallbackCandidate?.neighborhood ?? null,
    city: reverseGeocoded.city ?? fallbackCandidate?.city ?? null,
    postalCode: reverseGeocoded.postalCode ?? fallbackCandidate?.postalCode ?? null,
    latitude: coordinates?.latitude ?? fallbackCandidate?.latitude ?? null,
    longitude: coordinates?.longitude ?? fallbackCandidate?.longitude ?? null,
    cuisines: fallbackCandidate?.cuisines ?? [],
    phone: fallbackCandidate?.phone ?? null,
    website: fallbackCandidate?.website ?? null,
    source: 'google-maps-link',
    reference: resolvedUrl.slice(0, 120),
  }
}
