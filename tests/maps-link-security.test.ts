import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  followRedirects,
  isAllowedMapsHost,
  parseCoordinatesFromMapsUrl,
  parseNameFromMapsUrl,
} from '@/lib/places/resolveMapsLink'
import { redirectFollowingClient } from '@/lib/places/httpClient'

describe('maps link host allowlist', () => {
  it('accepts the google maps hosts the group actually uses', () => {
    expect(isAllowedMapsHost('https://maps.app.goo.gl/abc123')).toBe(true)
    expect(isAllowedMapsHost('https://www.google.com/maps/place/Ruffo')).toBe(true)
    expect(isAllowedMapsHost('https://maps.google.com.br/maps/place/Zen')).toBe(true)
  })

  it('rejects internal network targets', () => {
    expect(isAllowedMapsHost('http://localhost:5544')).toBe(false)
    expect(isAllowedMapsHost('https://127.0.0.1/admin')).toBe(false)
    expect(isAllowedMapsHost('https://169.254.169.254/latest/meta-data/')).toBe(false)
    expect(isAllowedMapsHost('https://10.0.0.5/internal')).toBe(false)
    expect(isAllowedMapsHost('https://[::1]/')).toBe(false)
  })

  it('rejects non https protocols including file and gopher', () => {
    expect(isAllowedMapsHost('file:///etc/passwd')).toBe(false)
    expect(isAllowedMapsHost('gopher://google.com/')).toBe(false)
    expect(isAllowedMapsHost('http://www.google.com/maps')).toBe(false)
  })

  it('rejects hosts that merely contain an allowed host as a substring', () => {
    expect(isAllowedMapsHost('https://google.com.attacker.net/maps')).toBe(false)
    expect(isAllowedMapsHost('https://maps.app.goo.gl.evil.com/x')).toBe(false)
    expect(isAllowedMapsHost('https://notgoogle.com/maps')).toBe(false)
  })

  it('rejects credentials in the url that could confuse host parsing', () => {
    expect(isAllowedMapsHost('https://www.google.com@attacker.net/maps')).toBe(false)
  })

  it('rejects malformed input instead of throwing', () => {
    expect(isAllowedMapsHost('not a url')).toBe(false)
    expect(isAllowedMapsHost('')).toBe(false)
  })
})

describe('maps url parsing', () => {
  it('reads coordinates from the at notation', () => {
    const coordinates = parseCoordinatesFromMapsUrl(
      'https://www.google.com/maps/place/Ruffo/@-8.0578,-34.8945,17z/data=!3m1',
    )
    expect(coordinates).toEqual({ latitude: -8.0578, longitude: -34.8945 })
  })

  it('reads coordinates from the data segment when the at notation is the map centre', () => {
    const coordinates = parseCoordinatesFromMapsUrl(
      'https://www.google.com/maps/place/X/data=!4m2!3m1!1s0x0:0x0!3d-8.0471783!4d-34.9060935',
    )
    expect(coordinates).toEqual({ latitude: -8.0471783, longitude: -34.9060935 })
  })

  it('reads the place name and decodes it', () => {
    expect(
      parseNameFromMapsUrl('https://www.google.com/maps/place/Yokocho+Izakaya+e+Sushi+Bar/@-8.04,-34.90,17z'),
    ).toBe('Yokocho Izakaya e Sushi Bar')
  })

  it('decodes accented names', () => {
    expect(parseNameFromMapsUrl('https://www.google.com/maps/place/Forner%C3%ADa+1121/@-8.04,-34.90,17z')).toBe(
      'Fornería 1121',
    )
  })

  it('returns null when the url carries no place', () => {
    expect(parseNameFromMapsUrl('https://www.google.com/maps/@-8.04,-34.90,17z')).toBeNull()
    expect(parseCoordinatesFromMapsUrl('https://www.google.com/maps/search/pizza')).toBeNull()
  })
})

describe('maps link redirect following', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const stubRedirectChain = (redirects: Record<string, string>) =>
    vi.spyOn(redirectFollowingClient, 'get').mockImplementation(async (url: string) => {
      const location = redirects[url]
      return { headers: location ? { location } : {} } as never
    })

  it('follows a short chain and returns the final google url', async () => {
    stubRedirectChain({
      'https://maps.app.goo.gl/short': 'https://www.google.com/maps/place/Zen/@-8.04,-34.90,17z',
    })

    await expect(followRedirects('https://maps.app.goo.gl/short')).resolves.toBe(
      'https://www.google.com/maps/place/Zen/@-8.04,-34.90,17z',
    )
  })

  it('refuses a chain that leaves the allowlist halfway', async () => {
    stubRedirectChain({ 'https://maps.app.goo.gl/short': 'https://attacker.example/steal' })

    await expect(followRedirects('https://maps.app.goo.gl/short')).resolves.toBeNull()
  })

  it('refuses a chain that leaves the allowlist exactly when the hop budget runs out', async () => {
    stubRedirectChain({
      'https://maps.app.goo.gl/short': 'https://www.google.com/hop1',
      'https://www.google.com/hop1': 'https://www.google.com/hop2',
      'https://www.google.com/hop2': 'https://www.google.com/hop3',
      'https://www.google.com/hop3': 'https://www.google.com/hop4',
      'https://www.google.com/hop4': 'https://attacker.example/steal',
    })

    await expect(followRedirects('https://maps.app.goo.gl/short')).resolves.toBeNull()
  })

  it('keeps the last allowed url when the hop budget runs out on an allowed host', async () => {
    stubRedirectChain({
      'https://maps.app.goo.gl/short': 'https://www.google.com/hop1',
      'https://www.google.com/hop1': 'https://www.google.com/hop2',
      'https://www.google.com/hop2': 'https://www.google.com/hop3',
      'https://www.google.com/hop3': 'https://www.google.com/hop4',
      'https://www.google.com/hop4': 'https://www.google.com/maps/place/Zen',
    })

    await expect(followRedirects('https://maps.app.goo.gl/short')).resolves.toBe(
      'https://www.google.com/maps/place/Zen',
    )
  })
})
