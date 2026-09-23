import { describe, expect, it } from 'vitest'
import {
  buildAddressFromStreet,
  extractPostalCodeDigits,
  formatPostalCode,
  isCompletePostalCode,
} from '@/lib/places/postalCode'
import { postalCodeLookupSchema } from '@/lib/validation/schemas'

describe('formatPostalCode', () => {
  it('adds the hyphen after the fifth digit while typing', () => {
    expect(['5', '52020', '520201', '52020015'].map(formatPostalCode)).toEqual(['5', '52020', '52020-1', '52020-015'])
  })

  it('ignores anything that is not a digit and extra digits', () => {
    expect(formatPostalCode('52.020-015 9')).toBe('52020-015')
    expect(extractPostalCodeDigits('abc52020015999')).toBe('52020015')
  })
})

describe('isCompletePostalCode', () => {
  it('needs exactly eight digits', () => {
    expect(isCompletePostalCode('52020-015')).toBe(true)
    expect(isCompletePostalCode('52020-01')).toBe(false)
  })
})

describe('postalCodeLookupSchema', () => {
  it('rejects incomplete postal codes', () => {
    expect(postalCodeLookupSchema.safeParse({ postalCode: '5202' }).success).toBe(false)
    expect(postalCodeLookupSchema.safeParse({ postalCode: '52020-015' }).success).toBe(true)
  })
})

describe('buildAddressFromStreet', () => {
  it('keeps the street number already typed', () => {
    expect(buildAddressFromStreet('Rua da Hora', 'R. da Hora, 295')).toBe('Rua da Hora, 295')
  })

  it('leaves room for the number when none was typed', () => {
    expect(buildAddressFromStreet('Rua da Hora', '')).toBe('Rua da Hora, ')
  })
})
