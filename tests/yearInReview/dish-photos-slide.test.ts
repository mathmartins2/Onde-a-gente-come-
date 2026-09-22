import { describe, expect, it } from 'vitest'
import { buildBestAndWorstSlide } from '@/lib/yearInReview/buildBestAndWorstSlide'
import { buildDishPhotosSlide } from '@/lib/yearInReview/buildDishPhotosSlide'
import { buildYearVisit } from '../support/yearInReviewFactories'

describe('dish photos slide', () => {
  it('is skipped when nobody photographed a dish that year', () => {
    expect(buildDishPhotosSlide(2026, [buildYearVisit(), buildYearVisit()])).toBeNull()
  })

  it('counts every photo and highlights the most photographed restaurant', () => {
    const quiet = buildYearVisit({ restaurantName: 'Quiet Place', dishPhotoKeys: ['quiet-1'] })
    const busy = buildYearVisit({ restaurantName: 'Busy Place', dishPhotoKeys: ['busy-1', 'busy-2', 'busy-3'] })

    const slide = buildDishPhotosSlide(2026, [quiet, busy])

    expect(slide?.title).toBe('4 fotos de prato em 2026')
    expect(slide?.entries[0]).toMatchObject({ label: 'o mais fotografado', value: '3 fotos', detail: 'Busy Place' })
    expect(slide?.restaurantId).toBe(busy.restaurantId)
  })

  it('fills the mosaic with the remaining photos when only one outing has pictures', () => {
    const onlyOuting = buildYearVisit({ dishPhotoKeys: ['first', 'second', 'third'] })

    expect(buildDishPhotosSlide(2026, [onlyOuting])?.galleryImageKeys).toEqual(['first', 'second', 'third'])
  })

  it('spreads the mosaic across outings, newest first, and caps it at six photos', () => {
    const visits = [1, 2, 3, 4].map((month) =>
      buildYearVisit({
        visitedAt: new Date(`2026-0${month}-10T20:00:00Z`),
        dishPhotoKeys: [`month-${month}-a`, `month-${month}-b`, `month-${month}-c`],
      }),
    )

    const slide = buildDishPhotosSlide(2026, visits)

    expect(slide?.galleryImageKeys).toEqual([
      'month-4-a',
      'month-4-b',
      'month-3-a',
      'month-3-b',
      'month-2-a',
      'month-2-b',
    ])
  })
})

describe('best and worst background', () => {
  it('prefers a dish photo from the best outing over the restaurant logo', () => {
    const best = buildYearVisit({ legacyScore: 5, photoImageKey: 'logo', dishPhotoKeys: ['dish-photo'] })
    const worst = buildYearVisit({ legacyScore: 2 })

    expect(buildBestAndWorstSlide([best, worst], [])?.photoImageKey).toBe('dish-photo')
  })
})
