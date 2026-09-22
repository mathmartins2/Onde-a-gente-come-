import { describe, expect, it } from 'vitest'
import { buildYearBoundariesInAppTimeZone, resolveYearInAppTimeZone } from '@/lib/utilities/appTimeZone'

const isInsideYear = (moment: Date, year: number) => {
  const { startsAt, endsBefore } = buildYearBoundariesInAppTimeZone(year)
  return moment >= startsAt && moment < endsBefore
}

describe('year boundaries in the app time zone', () => {
  it('keeps a new year eve dinner in the old year even though it is already january in UTC', () => {
    const newYearEveDinner = new Date('2025-12-31T23:30:00-03:00')

    expect(newYearEveDinner.getUTCFullYear()).toBe(2026)
    expect(isInsideYear(newYearEveDinner, 2025)).toBe(true)
    expect(isInsideYear(newYearEveDinner, 2026)).toBe(false)
    expect(resolveYearInAppTimeZone(newYearEveDinner)).toBe(2025)
  })

  it('puts the first minutes of january in the new year', () => {
    const firstLunch = new Date('2026-01-01T00:30:00-03:00')

    expect(isInsideYear(firstLunch, 2026)).toBe(true)
    expect(resolveYearInAppTimeZone(firstLunch)).toBe(2026)
  })
})
