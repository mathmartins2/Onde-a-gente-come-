import { describe, expect, it } from 'vitest'
import { formatBrazilianDecimal, parseLocalizedDecimal } from '@/lib/utilities/localizedDecimal'
import { priceEntrySchema } from '@/lib/validation/schemas'

describe('parseLocalizedDecimal', () => {
  it('reads a comma as the decimal separator', () => {
    expect(parseLocalizedDecimal('389,50')).toBe(389.5)
  })

  it('reads a dot as the decimal separator', () => {
    expect(parseLocalizedDecimal('389.50')).toBe(389.5)
  })

  it('understands thousands in both formats', () => {
    expect(parseLocalizedDecimal('1.234,56')).toBe(1234.56)
    expect(parseLocalizedDecimal('1,234.56')).toBe(1234.56)
    expect(parseLocalizedDecimal('1.234')).toBe(1234)
  })

  it('ignores the currency symbol and spaces', () => {
    expect(parseLocalizedDecimal('R$ 89,90')).toBe(89.9)
  })

  it('returns not-a-number for text without digits', () => {
    expect(parseLocalizedDecimal('abc')).toBeNaN()
  })
})

describe('formatBrazilianDecimal', () => {
  it('always shows the value in the Brazilian format', () => {
    expect(formatBrazilianDecimal('389.00')).toBe('389,00')
    expect(formatBrazilianDecimal(1234.5)).toBe('1.234,50')
  })
})

describe('priceEntrySchema', () => {
  it('accepts a bill typed with a comma or a dot', () => {
    expect(priceEntrySchema.parse({ amount: '389,50' }).amount).toBe(389.5)
    expect(priceEntrySchema.parse({ amount: '389.50' }).amount).toBe(389.5)
  })

  it('rejects text that is not a value', () => {
    expect(priceEntrySchema.safeParse({ amount: 'nan' }).success).toBe(false)
  })
})
