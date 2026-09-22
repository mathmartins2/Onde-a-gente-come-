import { yearInReviewConfiguration } from './configuration'
import { pluralize } from './formatters'
import { buildSlideEntry } from './slideEntry'
import type { YearSlide, YearVisit } from './types'

const galleryPhotosPerVisitFirst = yearInReviewConfiguration.maximumGalleryPhotosPerVisit

const findMostPhotographedVisit = (visits: YearVisit[]) =>
  [...visits].sort(
    (first, second) =>
      second.dishPhotoKeys.length - first.dishPhotoKeys.length ||
      second.visitedAt.getTime() - first.visitedAt.getTime(),
  )[0]

export const buildDishPhotosSlide = (year: number, visits: YearVisit[]): YearSlide | null => {
  const photographedVisits = [...visits]
    .filter((visit) => visit.dishPhotoKeys.length > 0)
    .sort((first, second) => second.visitedAt.getTime() - first.visitedAt.getTime())
  if (photographedVisits.length === 0) return null

  const photoCount = photographedVisits.reduce((sum, visit) => sum + visit.dishPhotoKeys.length, 0)
  const mostPhotographed = findMostPhotographedVisit(photographedVisits)

  return {
    key: 'dishPhotos',
    eyebrow: 'o que a gente comeu',
    title: `${pluralize(photoCount, 'foto', 'fotos')} de prato em ${year}`,
    heroValue: null,
    heroCaption: null,
    heroScore: null,
    entries: [
      buildSlideEntry({
        label: 'o mais fotografado',
        value: pluralize(mostPhotographed.dishPhotoKeys.length, 'foto', 'fotos'),
        detail: mostPhotographed.restaurantName,
      }),
    ],
    quote: null,
    photoImageKey: null,
    avatar: null,
    restaurantId: mostPhotographed.restaurantId,
    galleryImageKeys: [
      ...photographedVisits.flatMap((visit) => visit.dishPhotoKeys.slice(0, galleryPhotosPerVisitFirst)),
      ...photographedVisits.flatMap((visit) => visit.dishPhotoKeys.slice(galleryPhotosPerVisitFirst)),
    ].slice(0, yearInReviewConfiguration.maximumGalleryPhotoCount),
  }
}
