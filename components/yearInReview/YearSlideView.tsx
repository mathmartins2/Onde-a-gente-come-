'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import type { ClientYearSlide } from '@/lib/services/yearInReviewService'
import { storedImageLoader } from '@/lib/images/storedImageLoader'
import { classNames } from '@/lib/utilities/classNames'
import { scoreTextClassFor } from '@/lib/utilities/scoreTone'

const entranceDelayStepInSeconds = 0.12

export const YearSlideView = ({ slide }: { slide: ClientYearSlide }) => {
  const shouldReduceMotion = useReducedMotion()

  const revealAt = (order: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: order * entranceDelayStepInSeconds, type: 'spring' as const, stiffness: 190, damping: 22 },
        }

  return (
    <div className="relative flex h-full flex-col">
      {slide.photoUrl ? (
        <div className="absolute inset-x-0 top-0 h-[55%]">
          <img src={slide.photoUrl} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--canvas)_35%,transparent)_0%,color-mix(in_srgb,var(--canvas)_30%,transparent)_30%,color-mix(in_srgb,var(--canvas)_85%,transparent)_70%,var(--canvas)_100%)]" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_14%,color-mix(in_srgb,var(--accent)_38%,transparent)_0%,color-mix(in_srgb,var(--accent-press)_12%,transparent)_38%,transparent_70%)]" />
      )}

      <div className={classNames('relative flex flex-1 flex-col px-6 pb-6', slide.photoUrl ? 'pt-[28vh]' : 'pt-20')}>
        {slide.avatar ? (
          <motion.div {...revealAt(0)} className="mb-3">
            <Avatar name={slide.avatar.name} imageUrl={slide.avatar.imageUrl} size="large" className="h-16 w-16" />
          </motion.div>
        ) : null}

        <motion.p {...revealAt(0)} className="text-micro-cap text-accent">
          {slide.eyebrow}
        </motion.p>
        <motion.h2 {...revealAt(1)} className="font-display mt-2 text-[1.75rem] font-black leading-[1.05] tracking-tight">
          {slide.title}
        </motion.h2>

        {slide.heroValue ? (
          <motion.div {...revealAt(2)} className="mt-4">
            <p
              className={classNames(
                'text-numeric text-[3.25rem] font-bold leading-none',
                slide.heroScore === null ? 'text-accent-hover' : scoreTextClassFor(slide.heroScore),
              )}
            >
              {slide.heroValue}
            </p>
            {slide.heroCaption ? <p className="mt-1.5 text-body-sm text-ink-muted">{slide.heroCaption}</p> : null}
          </motion.div>
        ) : null}

        {slide.galleryUrls.length > 0 ? (
          <div className="mt-5 grid grid-cols-3 gap-2">
            {slide.galleryUrls.map((galleryUrl, galleryIndex) => (
              <motion.div
                key={galleryUrl}
                {...revealAt(2 + galleryIndex * 0.5)}
                className={classNames(
                  'relative aspect-square w-full overflow-hidden rounded-lg border-4 border-[var(--ink)] shadow-[var(--elevation-3)]',
                  galleryIndex % 2 === 0 ? '-rotate-3' : 'rotate-2',
                )}
              >
                <Image loader={storedImageLoader} src={galleryUrl} alt="" fill sizes="140px" className="object-cover" />
              </motion.div>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-1.5">
          {slide.entries.map((entry, entryIndex) => (
            <motion.div
              key={`${entry.label}-${entryIndex}`}
              {...revealAt(3 + entryIndex)}
              className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-1/90 px-3.5 py-2.5"
            >
              {entry.avatar ? <Avatar name={entry.avatar.name} imageUrl={entry.avatar.imageUrl} size="small" /> : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-md">{entry.label}</p>
                {entry.detail ? <p className="truncate text-caption">{entry.detail}</p> : null}
              </div>
              <span
                className={classNames(
                  'text-numeric shrink-0 text-heading-sm',
                  entry.valueScore === null ? 'text-ink' : scoreTextClassFor(entry.valueScore),
                )}
              >
                {entry.value}
              </span>
            </motion.div>
          ))}
        </div>

        {slide.quote ? (
          <motion.blockquote
            {...revealAt(4 + slide.entries.length)}
            className="mt-4 border-l-4 border-accent pl-4"
          >
            <p className="text-body-md">&ldquo;{slide.quote.text}&rdquo;</p>
            <footer className="mt-1 text-caption">— {slide.quote.author}</footer>
          </motion.blockquote>
        ) : null}
      </div>
    </div>
  )
}
