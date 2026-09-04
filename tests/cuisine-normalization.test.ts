import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { normalizeCuisines } from '@/lib/places/normalizeCuisines'

describe('cuisine normalization', () => {
  it('maps a raw map tag to a single canonical category', () => {
    expect(normalizeCuisines('japanese')).toEqual(['Japanese'])
    expect(normalizeCuisines('pizza')).toEqual(['Pizza'])
  })

  it('splits a multi value tag into every category it names', () => {
    expect(normalizeCuisines('american;steak')).toEqual(['Steak'])
    expect(normalizeCuisines('pizza;japanese')).toEqual(['Pizza', 'Japanese'])
  })

  it('treats sushi and japanese as the same category', () => {
    expect(normalizeCuisines('sushi')).toEqual(normalizeCuisines('japanese'))
  })

  it('never repeats a category when several tags collapse into one', () => {
    const normalized = normalizeCuisines('steak;barbecue;grill;american')
    expect(normalized).toEqual(['Steak'])
  })

  it('ignores casing and separators used by mappers', () => {
    expect(normalizeCuisines('Ice Cream')).toEqual(normalizeCuisines('ice_cream'))
    expect(normalizeCuisines('  JAPANESE  ')).toEqual(['Japanese'])
  })

  it('returns nothing for an unmapped or empty tag instead of inventing a category', () => {
    expect(normalizeCuisines(null)).toEqual([])
    expect(normalizeCuisines('')).toEqual([])
    expect(normalizeCuisines(faker.string.alpha({ length: 14 }))).toEqual([])
  })

  it('never returns a value outside the canonical set for arbitrary input', () => {
    const canonicalPattern = /^[A-Z][A-Za-z ]+$/
    Array.from({ length: 50 }).forEach(() => {
      const randomTag = faker.helpers.arrayElement([
        'japanese', 'steak', 'pizza', 'burger', faker.word.noun(), faker.string.alpha(6),
      ])
      normalizeCuisines(randomTag).forEach((category) => {
        expect(category).toMatch(canonicalPattern)
      })
    })
  })
})
