import { describe, expect, it } from 'vitest'
import { escapeOverpassRegex } from '@/lib/places/searchPlaces'

describe('overpass name filter escaping', () => {
  it('keeps a plain term untouched', () => {
    expect(escapeOverpassRegex('Zen Sushi')).toBe('Zen Sushi')
  })

  it('escapes the quote that would close the overpass string literal', () => {
    expect(escapeOverpassRegex('a",i];out;//')).toBe('a\\",i\\];out;//')
  })

  it('escapes regex metacharacters so the term stays a literal match', () => {
    expect(escapeOverpassRegex('a.*b(c)')).toBe('a\\.\\*b\\(c\\)')
  })

  it('escapes the backslash before anything else can use it', () => {
    expect(escapeOverpassRegex('a\\"b')).toBe('a\\\\\\"b')
  })

  it('replaces newlines and carriage returns that could break the query out of its line', () => {
    expect(escapeOverpassRegex('a\nb\r\nc')).toBe('a b  c')
  })

  it('replaces tabs, null bytes and unicode line separators', () => {
    expect(escapeOverpassRegex('a\tb\u0000c\u2028d\u2029e')).toBe('a b c d e')
  })

  it('leaves no control character in the escaped term', () => {
    const escaped = escapeOverpassRegex('pizza \n\r\t')
    expect(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(escaped)).toBe(false)
  })
})
