import { describe, expect, it } from 'vitest'
import { pickAccentColor } from '@/lib/images/pickAccentColor'

const buildPixels = (colors: Array<{ rgb: [number, number, number]; count: number }>) =>
  new Uint8Array(colors.flatMap(({ rgb, count }) => Array.from({ length: count }, () => rgb).flat()))

const readChannels = (hexColor: string) => ({
  red: Number.parseInt(hexColor.slice(1, 3), 16),
  green: Number.parseInt(hexColor.slice(3, 5), 16),
  blue: Number.parseInt(hexColor.slice(5, 7), 16),
})

describe('logo accent color', () => {
  it('treats a black and white logo as monochrome', () => {
    const pixels = buildPixels([
      { rgb: [0, 0, 0], count: 800 },
      { rgb: [250, 250, 250], count: 200 },
    ])

    expect(pickAccentColor(pixels)).toEqual({ kind: 'monochrome' })
  })

  it('picks the hue that dominates the colourful part of the logo', () => {
    const pixels = buildPixels([
      { rgb: [20, 20, 20], count: 500 },
      { rgb: [200, 30, 30], count: 300 },
      { rgb: [30, 60, 200], count: 100 },
    ])

    const accent = pickAccentColor(pixels)

    expect(accent.kind).toBe('vibrant')
    const channels = readChannels(accent.kind === 'vibrant' ? accent.color : '#000000')
    expect(channels.red).toBeGreaterThan(channels.green + 100)
    expect(channels.red).toBeGreaterThan(channels.blue + 100)
  })

  it('brightens a dark brand colour so it glows on the dark story background', () => {
    const accent = pickAccentColor(buildPixels([{ rgb: [20, 40, 110], count: 100 }]))

    const channels = readChannels(accent.kind === 'vibrant' ? accent.color : '#000000')
    expect(Math.max(channels.red, channels.green, channels.blue)).toBeGreaterThan(220)
    expect(channels.blue).toBeGreaterThan(channels.red)
  })

  it('ignores a few stray coloured pixels in an otherwise grey logo', () => {
    const pixels = buildPixels([
      { rgb: [128, 128, 128], count: 990 },
      { rgb: [220, 40, 40], count: 10 },
    ])

    expect(pickAccentColor(pixels)).toEqual({ kind: 'monochrome' })
  })
})
