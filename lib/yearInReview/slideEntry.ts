import type { YearSlideEntry } from './types'

export const buildSlideEntry = (entry: Pick<YearSlideEntry, 'label' | 'value'> & Partial<YearSlideEntry>): YearSlideEntry => ({
  detail: null,
  valueScore: null,
  avatar: null,
  ...entry,
})
