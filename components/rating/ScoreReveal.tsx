'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Meter } from '@/components/ui/Meter'
import { ScoreRating } from '@/components/ui/ScoreRating'
import { ratingCriteria } from '@/lib/scoring/configuration'
import { hasSeenScoreReveal, rememberScoreReveal } from '@/lib/utilities/scoreRevealMemory'
import { scoreTextClassFor } from '@/lib/utilities/scoreTone'
import { resolveRevealMood, type RevealMood } from '@/lib/scoring/revealMood'
import { classNames } from '@/lib/utilities/classNames'
import { moodScoreAnimation, moodStamps, ScoreCelebration } from './ScoreCelebration'

export type RevealedRating = {
  memberId: string
  displayName: string
  avatarUrl?: string | null
  score: number
  comment: string | null
  isRecommender: boolean
}

export type ScoreRevealData = {
  finalScore: number | null
  criteriaAverages?: Record<string, number | null>
  ratings: RevealedRating[]
}

type Stage = 'tallying' | 'ballots' | 'final'

const tallyDurationInMilliseconds = 2200
const tallyTickInMilliseconds = 60
const ballotIntervalInMilliseconds = 700
const countUpDurationInMilliseconds = 1400

const randomScore = () => (Math.random() * 5).toFixed(2)

const moodCardBorders: Record<RevealMood, string> = {
  flop: 'border-[color-mix(in_srgb,var(--danger)_45%,transparent)]',
  approved: 'border-accent/50',
  legendary: 'border-[color-mix(in_srgb,var(--success)_60%,transparent)] shadow-[0_0_48px_-12px_var(--success)]',
}

export const ScoreReveal = ({
  data,
  footnote,
  visitId,
}: {
  data: ScoreRevealData
  footnote?: string
  visitId?: string
}) => {
  const [shouldAnimate] = useState(() => !hasSeenScoreReveal(visitId))
  const [stage, setStage] = useState<Stage>(shouldAnimate ? 'tallying' : 'final')
  const [scrambledScore, setScrambledScore] = useState(randomScore)
  const [visibleBallotCount, setVisibleBallotCount] = useState(0)
  const [countedScore, setCountedScore] = useState(shouldAnimate ? 0 : (data.finalScore ?? 0))
  const [hasCountFinished, setHasCountFinished] = useState(!shouldAnimate)

  const ballotCount = data.ratings.length
  const finalScore = data.finalScore
  const mood = finalScore === null ? null : resolveRevealMood(finalScore)
  const isCelebrating = mood !== null && hasCountFinished

  useEffect(() => {
    if (stage !== 'tallying') return

    const ticker = setInterval(() => setScrambledScore(randomScore()), tallyTickInMilliseconds)
    const advance = setTimeout(() => setStage('ballots'), tallyDurationInMilliseconds)

    return () => {
      clearInterval(ticker)
      clearTimeout(advance)
    }
  }, [stage])

  useEffect(() => {
    if (stage !== 'ballots') return

    const ticker = setInterval(() => {
      setVisibleBallotCount((current) => {
        if (current >= ballotCount) return current
        return current + 1
      })
    }, ballotIntervalInMilliseconds)

    const advance = setTimeout(
      () => setStage('final'),
      ballotIntervalInMilliseconds * (ballotCount + 1),
    )

    return () => {
      clearInterval(ticker)
      clearTimeout(advance)
    }
  }, [stage, ballotCount])

  useEffect(() => {
    if (stage !== 'final') return
    rememberScoreReveal(visitId)
  }, [stage, visitId])

  useEffect(() => {
    if (stage !== 'final' || finalScore === null || !shouldAnimate) return

    const startedAt = Date.now()
    const ticker = setInterval(() => {
      const progress = Math.min((Date.now() - startedAt) / countUpDurationInMilliseconds, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCountedScore(finalScore * eased)
      if (progress < 1) return
      clearInterval(ticker)
      setHasCountFinished(true)
    }, 30)

    return () => clearInterval(ticker)
  }, [stage, finalScore, shouldAnimate])

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence mode="wait">
        {stage === 'tallying' ? (
          <motion.div key="tallying" exit={{ opacity: 0, y: -12 }}>
            <Card className="scheme-dark board-grain py-12 text-center">
              <p className="text-micro-cap text-accent">apurando as notas</p>
              <p className="text-numeric mt-4 text-6xl font-bold text-accent-hover">
                {scrambledScore}
              </p>
              <div className="mx-auto mt-6 h-[3px] w-40 overflow-hidden rounded-pill bg-surface-2">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: tallyDurationInMilliseconds / 1000, ease: 'linear' }}
                  className="h-full w-full rounded-pill bg-accent"
                />
              </div>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {stage === 'final' ? (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, scale: 0.92 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 18 }}
        >
          <Card
            className={classNames(
              'relative overflow-hidden py-10 text-center transition-[border-color,box-shadow] duration-500',
              isCelebrating ? moodCardBorders[mood] : 'border-accent/50',
            )}
          >
            {mood === 'flop' ? null : (
              <span className="spotlight-bloom pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
            )}
            {isCelebrating ? <ScoreCelebration mood={mood} isFirstReveal={shouldAnimate} /> : null}
            {isCelebrating ? (
              <span
                className={classNames(
                  'stamp-in absolute right-4 top-4 z-20 rounded-md border-2 bg-surface-1 px-2 py-1 text-micro-cap',
                  moodStamps[mood].className,
                )}
              >
                {moodStamps[mood].label}
              </span>
            ) : null}

            <p className="relative text-micro-cap text-accent">nota final</p>
            <p
              className={classNames(
                'text-numeric relative mt-2 text-6xl font-bold',
                finalScore === null ? 'text-ink-muted' : scoreTextClassFor(finalScore),
                isCelebrating && shouldAnimate && moodScoreAnimation[mood],
              )}
            >
              {finalScore === null ? '—' : countedScore.toFixed(2)}
            </p>

            {finalScore === null ? null : (
              <ScoreRating score={countedScore} size={20} className="relative mt-3" />
            )}

            <div className="relative mt-6 flex flex-col gap-2.5 text-left">
              {ratingCriteria.map((criterion) => {
                const average = data.criteriaAverages?.[criterion.key]
                if (average === null || average === undefined) return null

                return (
                  <div key={criterion.key} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-body-sm">{criterion.label}</span>
                      <span className={`text-numeric text-body-sm ${scoreTextClassFor(average)}`}>
                        {average.toFixed(2)}
                      </span>
                    </div>
                    <Meter value={average / 5} />
                  </div>
                )
              })}
            </div>

            {footnote ? <p className="relative mt-4 text-caption">{footnote}</p> : null}
          </Card>
        </motion.div>
      ) : null}

      {stage === 'tallying'
        ? null
        : data.ratings.slice(0, stage === 'final' ? ballotCount : visibleBallotCount).map((rating) => (
            <motion.div
              key={rating.memberId}
              initial={shouldAnimate ? { opacity: 0, y: 18, rotateX: -60 } : false}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            >
              <Card className="flex items-center justify-between gap-3 py-3.5">
                <Avatar name={rating.displayName} imageUrl={rating.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-body-md">
                    <span className="truncate">{rating.displayName}</span>
                    {rating.isRecommender ? (
                      <Badge tone="accent" size="small" className="h-5 px-2">
                        colocou
                      </Badge>
                    ) : null}
                  </p>
                  {rating.comment ? (
                    <p className="mt-0.5 text-caption italic">&ldquo;{rating.comment}&rdquo;</p>
                  ) : null}
                </div>
                <span className={`text-numeric text-heading-lg ${scoreTextClassFor(rating.score)}`}>
                  {rating.score.toFixed(2)}
                </span>
              </Card>
            </motion.div>
          ))}
    </div>
  )
}
