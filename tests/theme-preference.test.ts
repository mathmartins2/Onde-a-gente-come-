import { describe, expect, it } from 'vitest'
import { lightPalette, palette, paletteFor } from '@/lib/theme/palette'
import { parseThemePreference, resolveTheme } from '@/lib/theme/themePreference'
import { scoreHexFor, scoreToneHexFor } from '@/lib/utilities/scoreTone'
import { themePreferenceSchema } from '@/lib/validation/schemas'

describe('parseThemePreference', () => {
  it('keeps each supported preference', () => {
    expect(['dark', 'light', 'system'].map(parseThemePreference)).toEqual(['dark', 'light', 'system'])
  })

  it('falls back to the dark theme when nothing valid is stored', () => {
    expect([undefined, null, '', 'sepia'].map(parseThemePreference)).toEqual(['dark', 'dark', 'dark', 'dark'])
  })
})

describe('resolveTheme', () => {
  it('uses an explicit preference regardless of the device scheme', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('follows the device scheme when set to automatic', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})

describe('themePreferenceSchema', () => {
  it('accepts the three modes', () => {
    expect(themePreferenceSchema.safeParse({ themePreference: 'system' }).success).toBe(true)
  })

  it('rejects anything outside the three modes', () => {
    expect(themePreferenceSchema.safeParse({ themePreference: 'sepia' }).success).toBe(false)
    expect(themePreferenceSchema.safeParse({}).success).toBe(false)
  })
})

describe('theme palettes', () => {
  it('offers the same color roles in both themes', () => {
    expect(Object.keys(lightPalette).sort()).toEqual(Object.keys(palette).sort())
  })

  it('picks the palette for the resolved theme', () => {
    expect(paletteFor('light').canvas).toBe(lightPalette.canvas)
    expect(paletteFor('dark').canvas).toBe(palette.canvas)
  })

  it('uses darker score colors on the light theme', () => {
    expect(scoreHexFor(4.5, 'light')).not.toBe(scoreHexFor(4.5, 'dark'))
    expect(scoreHexFor(4.5)).toBe(scoreToneHexFor('dark').great)
  })
})
