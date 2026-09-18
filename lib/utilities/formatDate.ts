import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const formatDrawMoment = (value: string | Date) =>
  format(new Date(value), "d 'de' MMM 'às' HH:mm", { locale: ptBR })

export const formatVisitDay = (value: string | Date) =>
  format(new Date(value), "d 'de' MMM 'de' yyyy", { locale: ptBR })

export const parseVisitDayInput = (value: string) => {
  const isCalendarDay = /^\d{4}-\d{2}-\d{2}$/.test(value)
  if (!isCalendarDay) return new Date(value)

  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}
