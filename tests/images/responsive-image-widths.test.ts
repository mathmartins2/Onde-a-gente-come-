import { describe, expect, it } from 'vitest'
import { parseResponsiveWidth, pickResponsiveWidth } from '@/lib/images/responsiveImageWidths'

describe('responsive image widths', () => {
  it('serves the smallest allowed width that still covers the requested one', () => {
    expect(pickResponsiveWidth(100)).toBe(160)
    expect(pickResponsiveWidth(320)).toBe(320)
    expect(pickResponsiveWidth(700)).toBe(960)
  })

  it('never serves more than the largest allowed width', () => {
    expect(pickResponsiveWidth(4000)).toBe(1280)
  })

  it('only accepts widths from the allowlist when parsing a request', () => {
    expect(parseResponsiveWidth('640')).toBe(640)
    expect(parseResponsiveWidth('641')).toBeNull()
    expect(parseResponsiveWidth('99999')).toBeNull()
    expect(parseResponsiveWidth(null)).toBeNull()
  })
})
