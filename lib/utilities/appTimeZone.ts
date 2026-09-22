export const appTimeZone = 'America/Recife'

const appTimeZoneUtcOffset = '-03:00'

const yearFormatter = new Intl.DateTimeFormat('en-US', { timeZone: appTimeZone, year: 'numeric' })

const longDayFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: appTimeZone,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const monthNumberFormatter = new Intl.DateTimeFormat('en-US', { timeZone: appTimeZone, month: 'numeric' })

export const resolveYearInAppTimeZone = (moment: Date) => Number(yearFormatter.format(moment))

export const resolveMonthNumberInAppTimeZone = (moment: Date) => Number(monthNumberFormatter.format(moment))

export const buildYearBoundariesInAppTimeZone = (year: number) => ({
  startsAt: new Date(`${year}-01-01T00:00:00${appTimeZoneUtcOffset}`),
  endsBefore: new Date(`${year + 1}-01-01T00:00:00${appTimeZoneUtcOffset}`),
})

export const formatLongDayInAppTimeZone = (moment: Date) => longDayFormatter.format(moment)
