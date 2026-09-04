export type PlaceCandidate = {
  name: string
  address: string | null
  neighborhood: string | null
  city: string | null
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  cuisines: string[]
  phone: string | null
  website: string | null
  source: 'nominatim' | 'overpass' | 'photon' | 'google-maps-link'
  reference: string | null
}
