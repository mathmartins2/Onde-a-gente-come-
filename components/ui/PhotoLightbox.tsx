'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react'
import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { storedImageLoader } from '@/lib/images/storedImageLoader'

export type LightboxPhoto = {
  url: string
  caption?: string
}

const swipeThresholdInPixels = 50

const wrapIndex = (index: number, length: number) => (index + length) % length

export const PhotoLightbox = ({
  photos,
  openIndex,
  onChangeIndex,
  onClose,
}: {
  photos: LightboxPhoto[]
  openIndex: number | null
  onChangeIndex: (index: number) => void
  onClose: () => void
}) => {
  const shouldReduceMotion = useReducedMotion()
  const swipeStartX = useRef<number | null>(null)
  const didSwipe = useRef(false)
  const closeButtonReference = useRef<HTMLButtonElement>(null)
  const isOpen = openIndex !== null && photos.length > 0
  const hasSeveralPhotos = photos.length > 1

  const showPrevious = useCallback(() => {
    if (openIndex === null) return
    onChangeIndex(wrapIndex(openIndex - 1, photos.length))
  }, [onChangeIndex, openIndex, photos.length])

  const showNext = useCallback(() => {
    if (openIndex === null) return
    onChangeIndex(wrapIndex(openIndex + 1, photos.length))
  }, [onChangeIndex, openIndex, photos.length])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return onClose()
      if (event.key === 'ArrowLeft') return showPrevious()
      if (event.key === 'ArrowRight') return showNext()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonReference.current?.focus()
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, showNext, showPrevious])

  const handlePointerDown = (event: PointerEvent) => {
    swipeStartX.current = event.clientX
  }

  const handlePointerUp = (event: PointerEvent) => {
    const startX = swipeStartX.current
    swipeStartX.current = null
    if (startX === null || !hasSeveralPhotos) return
    const horizontalDistance = event.clientX - startX
    if (Math.abs(horizontalDistance) < swipeThresholdInPixels) return
    didSwipe.current = true
    if (horizontalDistance > 0) return showPrevious()
    showNext()
  }

  const ignoreClickAfterSwipe = (event: MouseEvent) => {
    if (!didSwipe.current) return
    didSwipe.current = false
    event.stopPropagation()
  }

  if (typeof document === 'undefined') return null

  const currentIndex = openIndex ?? 0
  const currentPhoto = isOpen ? photos[currentIndex] : null

  return createPortal(
    <AnimatePresence>
      {currentPhoto ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Fotos em tela cheia"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0 }}
          className="scheme-dark fixed inset-0 z-50 flex flex-col text-ink bg-[color-mix(in_srgb,var(--canvas-deep)_94%,transparent)] backdrop-blur-sm"
          onClick={onClose}
        >
          <div className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
            <span className="text-numeric text-caption text-ink-muted">
              {hasSeveralPhotos ? `${currentIndex + 1} / ${photos.length}` : ''}
            </span>
            <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
              <a
                href={currentPhoto.url}
                download
                className="flex h-11 items-center gap-2 rounded-pill border border-hairline-strong bg-surface-2 px-4 text-button-cap text-ink hover:border-accent"
              >
                <Download size={16} />
                Baixar
              </a>
              <button
                ref={closeButtonReference}
                type="button"
                aria-label="Fechar"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline-strong bg-surface-2 text-ink hover:border-accent"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-4 py-4"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onClickCapture={ignoreClickAfterSwipe}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentPhoto.url}
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="relative h-full w-full"
              >
                <Image
                  loader={storedImageLoader}
                  src={currentPhoto.url}
                  alt={currentPhoto.caption ?? ''}
                  fill
                  sizes="100vw"
                  draggable={false}
                  onClick={(event) => event.stopPropagation()}
                  className="select-none object-contain"
                />
              </motion.div>
            </AnimatePresence>

            {hasSeveralPhotos ? (
              <>
                <button
                  type="button"
                  aria-label="Foto anterior"
                  onClick={(event) => {
                    event.stopPropagation()
                    showPrevious()
                  }}
                  className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--canvas)_70%,transparent)] text-ink hover:text-accent"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  aria-label="Próxima foto"
                  onClick={(event) => {
                    event.stopPropagation()
                    showNext()
                  }}
                  className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--canvas)_70%,transparent)] text-ink hover:text-accent"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            ) : null}
          </div>

          {currentPhoto.caption ? (
            <p className="px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] text-center text-body-sm text-ink-muted">
              {currentPhoto.caption}
            </p>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
