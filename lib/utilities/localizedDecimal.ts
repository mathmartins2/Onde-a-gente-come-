const brazilianDecimalFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const thousandsGroupPattern = /^\d{1,3}(\.\d{3})+$/

const normalizeDecimalSeparators = (text: string) => {
  const lastCommaPosition = text.lastIndexOf(',')
  const lastDotPosition = text.lastIndexOf('.')
  if (lastCommaPosition === -1 && thousandsGroupPattern.test(text)) return text.replaceAll('.', '')
  if (lastCommaPosition > lastDotPosition) return text.replaceAll('.', '').replace(',', '.')
  return text.replaceAll(',', '')
}

export const parseLocalizedDecimal = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return Number.NaN
  const compactText = value.replace(/[^\d.,-]/g, '')
  if (compactText.length === 0) return Number.NaN
  return Number(normalizeDecimalSeparators(compactText))
}

export const formatBrazilianDecimal = (value: number | string) => {
  const parsedValue = parseLocalizedDecimal(value)
  return Number.isFinite(parsedValue) ? brazilianDecimalFormatter.format(parsedValue) : ''
}
