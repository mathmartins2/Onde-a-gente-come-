import { describe, expect, it } from 'vitest'
import { buildGoogleMapsUrl } from '@/lib/places/buildGoogleMapsUrl'

describe('google maps url', () => {
  it('points straight at the coordinates when the place has them', () => {
    const url = buildGoogleMapsUrl({
      name: 'Yokocho',
      latitude: -8.0471783,
      longitude: -34.9060935,
    })

    expect(url).toContain('query=-8.0471783%2C-34.9060935')
  })

  it('accepts coordinates stored as text', () => {
    const url = buildGoogleMapsUrl({
      name: 'Yokocho',
      latitude: '-8.0471783',
      longitude: '-34.9060935',
    })

    expect(url).toContain('query=-8.0471783%2C-34.9060935')
  })

  it('falls back to the full address when there are no coordinates', () => {
    const url = buildGoogleMapsUrl({
      name: 'Entre Amigos',
      address: 'Rua da Hora',
      neighborhood: 'Espinheiro',
      city: 'Recife',
      latitude: null,
      longitude: null,
    })

    expect(decodeURIComponent(url)).toContain('Entre Amigos, Rua da Hora, Espinheiro, Recife')
  })

  it('searches by name alone when nothing else is known', () => {
    const url = buildGoogleMapsUrl({ name: 'Ruffo Recife' })
    expect(decodeURIComponent(url)).toContain('query=Ruffo Recife')
  })

  it('skips empty address pieces instead of leaving dangling commas', () => {
    const url = buildGoogleMapsUrl({
      name: 'Zen',
      address: '',
      neighborhood: null,
      city: 'Recife',
    })

    expect(decodeURIComponent(url)).toContain('query=Zen, Recife')
  })

  it('escapes characters that would break the url', () => {
    const url = buildGoogleMapsUrl({ name: 'Bar & Cia', city: 'Recife' })
    expect(url).not.toContain(' ')
    expect(url).toContain('%26')
  })

  it('ignores coordinates that are not real numbers', () => {
    const url = buildGoogleMapsUrl({
      name: 'Zen',
      city: 'Recife',
      latitude: 'nao-e-numero',
      longitude: 'nada',
    })

    expect(decodeURIComponent(url)).toContain('query=Zen, Recife')
  })
})
