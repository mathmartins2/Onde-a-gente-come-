import { pluralize } from './formatters'
import { buildSlideEntry } from './slideEntry'
import type { YearSlide, YearVisit } from './types'

const countDistinct = (values: string[]) => new Set(values).size

const findTopCuisine = (visits: YearVisit[]) => {
  const countByCuisine = visits
    .flatMap((visit) => visit.cuisines)
    .reduce((counts, cuisine) => counts.set(cuisine, (counts.get(cuisine) ?? 0) + 1), new Map<string, number>())

  return [...countByCuisine.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name))
    .at(0) ?? null
}

export const buildSummarySlide = (year: number, visits: YearVisit[]): YearSlide | null => {
  if (visits.length === 0) return null

  const newPlaceCount = countDistinct(
    visits.filter((visit) => visit.isFirstVisitEver).map((visit) => visit.restaurantId),
  )
  const placeCount = countDistinct(visits.map((visit) => visit.restaurantId))
  const neighborhoodCount = countDistinct(visits.flatMap((visit) => (visit.neighborhood ? [visit.neighborhood] : [])))
  const topCuisine = findTopCuisine(visits)

  return {
    key: 'summary',
    eyebrow: `${year} na mesa`,
    title: `Vocês saíram pra comer ${pluralize(visits.length, 'vez', 'vezes')} em ${year}`,
    heroValue: String(visits.length),
    heroCaption: visits.length === 1 ? 'saída' : 'saídas',
    heroScore: null,
    entries: [
      buildSlideEntry({ label: 'lugares diferentes', value: String(placeCount) }),
      buildSlideEntry({ label: 'lugares novos pra mesa', value: String(newPlaceCount) }),
      ...(neighborhoodCount > 0 ? [buildSlideEntry({ label: 'bairros', value: String(neighborhoodCount) })] : []),
      ...(topCuisine
        ? [
            buildSlideEntry({
              label: 'a culinária do ano',
              value: topCuisine.name,
              detail: pluralize(topCuisine.count, 'vez', 'vezes'),
            }),
          ]
        : []),
    ],
    quote: null,
    photoImageKey: null,
    avatar: null,
  }
}
