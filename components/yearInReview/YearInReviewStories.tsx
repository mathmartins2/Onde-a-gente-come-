'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Pause, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { CopyLinkButton } from '@/components/share/CopyLinkButton'
import { ShareStoryButton } from '@/components/share/ShareStoryButton'
import { apiClient } from '@/lib/http/apiClient'
import type { ClientYearInReview } from '@/lib/services/yearInReviewService'
import { classNames } from '@/lib/utilities/classNames'
import { YearSlideView } from './YearSlideView'

const slideDurationInMilliseconds = 6500
const holdThresholdInMilliseconds = 220
const previousZoneRatio = 1 / 3

const createPublicRestaurantLink = (restaurantId: string) =>
  apiClient.post<{ path: string }>(`/restaurants/${restaurantId}/public-link`).then((response) => response.data.path)

export const YearInReviewStories = ({
  yearInReview,
  onClose,
}: {
  yearInReview: ClientYearInReview
  onClose: () => void
}) => {
  const [slideIndex, setSlideIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const pressStartedAt = useRef<number | null>(null)
  const shouldReduceMotion = useReducedMotion()

  const slides = yearInReview.slides
  const currentSlide = slides[slideIndex]
  const isLastSlide = slideIndex === slides.length - 1
  const featuredRestaurantId = currentSlide.restaurantId

  const goToNextSlide = useCallback(() => {
    if (isLastSlide) return onClose()
    setSlideIndex((index) => index + 1)
  }, [isLastSlide, onClose])

  const goToPreviousSlide = useCallback(() => setSlideIndex((index) => Math.max(0, index - 1)), [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') return goToNextSlide()
      if (event.key === 'ArrowLeft') return goToPreviousSlide()
      if (event.key === 'Escape') return onClose()
      if (event.key === ' ') {
        event.preventDefault()
        setIsPaused((paused) => !paused)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNextSlide, goToPreviousSlide, onClose])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const handlePointerDown = () => {
    pressStartedAt.current = Date.now()
    setIsPaused(true)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const pressDuration = Date.now() - (pressStartedAt.current ?? Date.now())
    pressStartedAt.current = null
    setIsPaused(false)
    if (pressDuration >= holdThresholdInMilliseconds) return

    const bounds = event.currentTarget.getBoundingClientRect()
    if (event.clientX - bounds.left < bounds.width * previousZoneRatio) return goToPreviousSlide()
    goToNextSlide()
  }

  const releasePress = () => {
    pressStartedAt.current = null
    setIsPaused(false)
  }

  if (!currentSlide) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Retrospectiva ${yearInReview.year}`}
      className="fixed inset-0 z-[70] flex justify-center bg-canvas-deep"
    >
      <div className="relative flex h-dvh w-full max-w-md flex-col overflow-hidden bg-canvas">
        <div className="absolute inset-x-0 top-0 z-20 flex flex-col gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <div className="flex gap-1.5">
            {slides.map((slide, index) => (
              <span key={slide.key} className="h-1 flex-1 overflow-hidden rounded-pill bg-white/20">
                {index === slideIndex && !shouldReduceMotion ? (
                  <span
                    key={`progress-${slideIndex}`}
                    onAnimationEnd={goToNextSlide}
                    className="story-progress block h-full w-full rounded-pill bg-ink"
                    style={
                      {
                        '--story-duration': `${slideDurationInMilliseconds}ms`,
                        animationPlayState: isPaused ? 'paused' : 'running',
                      } as CSSProperties
                    }
                  />
                ) : (
                  <span
                    className={classNames(
                      'block h-full rounded-pill bg-ink',
                      index <= slideIndex ? 'w-full' : 'w-0',
                    )}
                  />
                )}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-micro-cap text-ink-muted">
              retrospectiva {yearInReview.year} · {slideIndex + 1}/{slides.length}
            </span>
            <span className="flex items-center gap-1">
              {isPaused ? <Pause size={14} className="text-ink-muted" aria-label="pausado" /> : null}
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar retrospectiva"
                className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </span>
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentSlide.key}
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="min-h-full"
            >
              <YearSlideView slide={currentSlide} />
            </motion.div>
          </AnimatePresence>

          <div
            aria-hidden
            data-testid="story-tap-area"
            className="absolute inset-0 z-10 select-none touch-manipulation"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={releasePress}
            onPointerLeave={releasePress}
            onContextMenu={(event) => event.preventDefault()}
          />
        </div>

        <div className="relative z-20 flex flex-col gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
          <ShareStoryButton
            key={currentSlide.key}
            imagePath={`/api/year-in-review/story/${currentSlide.key}`}
            fileName={`retrospectiva-${yearInReview.year}-${currentSlide.key}.png`}
            className="w-full"
          />
          {featuredRestaurantId ? (
            <CopyLinkButton
              loadPath={() => createPublicRestaurantLink(featuredRestaurantId)}
              label="Copiar link saiba mais"
              successMessage="Link copiado. Cola no sticker de link do story."
              className="w-full"
            />
          ) : null}
          <div className="flex justify-between">
            <button type="button" onClick={goToPreviousSlide} disabled={slideIndex === 0} className="min-h-11 px-2 text-caption disabled:opacity-40">
              Anterior
            </button>
            <button type="button" onClick={goToNextSlide} className="min-h-11 px-2 text-caption">
              {isLastSlide ? 'Fechar' : 'Próxima'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
