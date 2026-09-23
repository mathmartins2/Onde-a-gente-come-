import { placesHttpClient } from './httpClient'
import { extractPostalCodeDigits, formatPostalCode } from './postalCode'

export type PostalCodeAddress = {
  postalCode: string
  street: string | null
  neighborhood: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
}

type BrasilApiResponse = {
  street?: string
  neighborhood?: string
  city?: string
  location?: { coordinates?: { latitude?: string; longitude?: string } }
}

type ViaCepResponse = {
  erro?: boolean | string
  logradouro?: string
  bairro?: string
  localidade?: string
}

const emptyToNull = (value: string | undefined) => (value && value.trim().length > 0 ? value.trim() : null)

const parseCoordinate = (value: string | undefined) => {
  const parsed = Number(value)
  return value && Number.isFinite(parsed) ? parsed : null
}

const lookupWithBrasilApi = async (digits: string): Promise<PostalCodeAddress | null> => {
  const response = await placesHttpClient.get<BrasilApiResponse>(`https://brasilapi.com.br/api/cep/v2/${digits}`)
  const coordinates = response.data.location?.coordinates
  return {
    postalCode: formatPostalCode(digits),
    street: emptyToNull(response.data.street),
    neighborhood: emptyToNull(response.data.neighborhood),
    city: emptyToNull(response.data.city),
    latitude: parseCoordinate(coordinates?.latitude),
    longitude: parseCoordinate(coordinates?.longitude),
  }
}

const lookupWithViaCep = async (digits: string): Promise<PostalCodeAddress | null> => {
  const response = await placesHttpClient.get<ViaCepResponse>(`https://viacep.com.br/ws/${digits}/json/`)
  if (response.data.erro) return null
  return {
    postalCode: formatPostalCode(digits),
    street: emptyToNull(response.data.logradouro),
    neighborhood: emptyToNull(response.data.bairro),
    city: emptyToNull(response.data.localidade),
    latitude: null,
    longitude: null,
  }
}

export const lookupPostalCode = async (postalCode: string) => {
  const digits = extractPostalCodeDigits(postalCode)
  const fromBrasilApi = await lookupWithBrasilApi(digits).catch(() => null)
  if (fromBrasilApi) return fromBrasilApi
  return lookupWithViaCep(digits).catch(() => null)
}
