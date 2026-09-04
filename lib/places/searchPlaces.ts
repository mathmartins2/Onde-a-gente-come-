import { regionConfiguration } from '@/lib/scoring/configuration'
import { normalizeCuisines } from './normalizeCuisines'
import { placesHttpClient } from './httpClient'
import type { PlaceCandidate } from './types'

const { boundingBox } = regionConfiguration

const requestJson = async (url: string) => {
  try {
    const response = await placesHttpClient.get(url)
    return response.data
  } catch {
    return null
  }
}

const postForm = async (url: string, form: Record<string, string>) => {
  try {
    const response = await placesHttpClient.post(url, new URLSearchParams(form).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return response.data
  } catch {
    return null
  }
}

const toNumberOrNull = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const searchNominatim = async (term: string): Promise<PlaceCandidate[]> => {
  const parameters = new URLSearchParams({
    q: term,
    format: 'jsonv2',
    addressdetails: '1',
    extratags: '1',
    limit: '5',
    countrycodes: 'br',
    viewbox: `${boundingBox.minimumLongitude},${boundingBox.maximumLatitude},${boundingBox.maximumLongitude},${boundingBox.minimumLatitude}`,
    bounded: '1',
  })

  const payload = await requestJson(`https://nominatim.openstreetmap.org/search?${parameters}`)
  if (!Array.isArray(payload)) return []

  return payload.map((row) => {
    const address = row.address ?? {}
    const extraTags = row.extratags ?? {}
    const street = address.road ?? null
    const houseNumber = address.house_number ?? null

    return {
      name: row.name || row.display_name?.split(',')[0] || term,
      address: street ? [street, houseNumber].filter(Boolean).join(', ') : null,
      neighborhood: address.suburb ?? address.neighbourhood ?? address.city_district ?? null,
      city: address.city ?? address.town ?? address.municipality ?? null,
      postalCode: address.postcode ?? null,
      latitude: toNumberOrNull(row.lat),
      longitude: toNumberOrNull(row.lon),
      cuisines: normalizeCuisines(extraTags.cuisine),
      phone: extraTags.phone ?? extraTags['contact:phone'] ?? null,
      website: extraTags.website ?? extraTags['contact:website'] ?? null,
      source: 'nominatim' as const,
      reference: row.osm_id ? `${row.osm_type}/${row.osm_id}` : null,
    }
  })
}

const controlCharacterPattern = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g
const overpassRegexMetacharacterPattern = /[\\"^$.*+?()[\]{}|]/g

export const escapeOverpassRegex = (term: string) =>
  term.replace(controlCharacterPattern, ' ').replace(overpassRegexMetacharacterPattern, '\\$&')

export const searchOverpass = async (term: string): Promise<PlaceCandidate[]> => {
  const safeTerm = escapeOverpassRegex(term)
  const query = `[out:json][timeout:20];
    (
      nwr[~"^(amenity|shop)$"~"restaurant|fast_food|cafe|bar|pub|ice_cream"]["name"~"${safeTerm}",i](${boundingBox.minimumLatitude},${boundingBox.minimumLongitude},${boundingBox.maximumLatitude},${boundingBox.maximumLongitude});
    );
    out center tags 5;`

  const payload = await postForm('https://overpass-api.de/api/interpreter', { data: query })

  const elements = payload?.elements
  if (!Array.isArray(elements)) return []

  return elements.map((element) => {
    const tags = element.tags ?? {}
    const center = element.center ?? element
    const street = tags['addr:street'] ?? null
    const houseNumber = tags['addr:housenumber'] ?? null

    return {
      name: tags.name ?? term,
      address: street ? [street, houseNumber].filter(Boolean).join(', ') : null,
      neighborhood: tags['addr:suburb'] ?? tags['addr:neighbourhood'] ?? null,
      city: tags['addr:city'] ?? null,
      postalCode: tags['addr:postcode'] ?? null,
      latitude: toNumberOrNull(center.lat),
      longitude: toNumberOrNull(center.lon),
      cuisines: normalizeCuisines(tags.cuisine),
      phone: tags.phone ?? tags['contact:phone'] ?? null,
      website: tags.website ?? tags['contact:website'] ?? null,
      source: 'overpass' as const,
      reference: element.id ? `${element.type}/${element.id}` : null,
    }
  })
}

export const searchPhoton = async (term: string): Promise<PlaceCandidate[]> => {
  const parameters = new URLSearchParams({
    q: term,
    limit: '5',
    lat: String((boundingBox.minimumLatitude + boundingBox.maximumLatitude) / 2),
    lon: String((boundingBox.minimumLongitude + boundingBox.maximumLongitude) / 2),
  })

  const payload = await requestJson(`https://photon.komoot.io/api/?${parameters}`)
  const features = payload?.features
  if (!Array.isArray(features)) return []

  return features
    .filter((feature) => feature?.properties?.name)
    .map((feature) => {
      const properties = feature.properties
      const coordinates = feature.geometry?.coordinates ?? []

      return {
        name: properties.name,
        address: properties.street
          ? [properties.street, properties.housenumber].filter(Boolean).join(', ')
          : null,
        neighborhood: properties.district ?? null,
        city: properties.city ?? null,
        postalCode: properties.postcode ?? null,
        latitude: toNumberOrNull(coordinates[1]),
        longitude: toNumberOrNull(coordinates[0]),
        cuisines: [],
        phone: null,
        website: null,
        source: 'photon' as const,
        reference: properties.osm_id ? `${properties.osm_type}/${properties.osm_id}` : null,
      }
    })
}

const isInsideRegion = (candidate: PlaceCandidate) => {
  if (candidate.latitude === null || candidate.longitude === null) return true
  return (
    candidate.latitude >= boundingBox.minimumLatitude &&
    candidate.latitude <= boundingBox.maximumLatitude &&
    candidate.longitude >= boundingBox.minimumLongitude &&
    candidate.longitude <= boundingBox.maximumLongitude
  )
}

const buildDeduplicationKey = (candidate: PlaceCandidate) =>
  `${candidate.name.toLowerCase()}|${candidate.latitude?.toFixed(4) ?? ''}|${candidate.longitude?.toFixed(4) ?? ''}`

export const searchPlaceCandidates = async (term: string) => {
  const results = await Promise.all([
    searchNominatim(term),
    searchOverpass(term),
    searchPhoton(term),
  ])

  const seen = new Set<string>()
  return results
    .flat()
    .filter(isInsideRegion)
    .filter((candidate) => {
      const key = buildDeduplicationKey(candidate)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 8)
}
