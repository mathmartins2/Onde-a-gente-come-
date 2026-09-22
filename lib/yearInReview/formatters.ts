import { formatLongDayInAppTimeZone } from '@/lib/utilities/appTimeZone'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export const formatScore = (score: number) => score.toFixed(2)

export const formatCurrency = (amount: number) => currencyFormatter.format(amount)

export const formatShortDay = (moment: Date) => formatLongDayInAppTimeZone(moment).replace(/ de \d{4}$/, '')

export const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`
