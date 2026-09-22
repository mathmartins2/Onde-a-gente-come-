'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Meter } from '@/components/ui/Meter'
import { CopyLinkButton } from '@/components/share/CopyLinkButton'
import { ShareStoryButton } from '@/components/share/ShareStoryButton'
import { ScoreRating } from '@/components/ui/ScoreRating'
import { createVisitRestaurantPublicLink } from '@/lib/http/publicLinkQueries'
import { ratingCriteria } from '@/lib/scoring/configuration'
import { scoreTextClassFor } from '@/lib/utilities/scoreTone'

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

export const ScoreReveal = ({
  data,
  footnote,
  shareImagePath,
  visitId,
}: {
  data: ScoreRevealData
  footnote?: string
  shareImagePath?: string
  visitId?: string
}) => {
  const [stage, setStage] = useState<Stage>('tallying')
  const [scrambledScore, setScrambledScore] = useState(randomScore)
  const [visibleBallotCount, setVisibleBallotCount] = useState(0)
  const [countedScore, setCountedScore] = useState(0)

  const ballotCount = data.ratings.length
  const finalScore = data.finalScore

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
    if (stage !== 'final' || finalScore === null) return

    const startedAt = Date.now()
    const ticker = setInterval(() => {
      const progress = Math.min((Date.now() - startedAt) / countUpDurationInMilliseconds, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCountedScore(finalScore * eased)
      if (progress === 1) clearInterval(ticker)
    }, 30)

    return () => clearInterval(ticker)
  }, [stage, finalScore])

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence mode="wait">
        {stage === 'tallying' ? (
          <motion.div key="tallying" exit={{ opacity: 0, y: -12 }}>
            <Card className="board-grain py-12 text-center">
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

      {stage === 'tallying'
        ? null
        : data.ratings.slice(0, stage === 'final' ? ballotCount : visibleBallotCount).map((rating) => (
            <motion.div
              key={rating.memberId}
              initial={{ opacity: 0, y: 18, rotateX: -60 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            >
              <Card className="flex items-center justify-between gap-3 py-3.5">
                <Avatar name={rating.displayName} imageUrl={rating.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="text-body-md">
                    {rating.displayName}
                    {rating.isRecommender ? (
                      <Badge tone="quiet" size="small" className="ml-2">
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

      {stage === 'final' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 18 }}
        >
          <Card className="relative overflow-hidden border-accent/50 py-10 text-center">
            <span className="spotlight-bloom pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
            {[14, 38, 62, 86].map((leftPercentage, index) => (
              <span
                key={leftPercentage}
                className="ember pointer-events-none absolute bottom-6 h-1 w-1 rounded-full bg-accent"
                style={{ left: `${leftPercentage}%`, animationDelay: `${index * 400}ms` }}
              />
            ))}

            <p className="relative text-micro-cap text-accent">nota final</p>
            <p
              className={`text-numeric relative mt-2 text-6xl font-bold ${
                finalScore === null ? 'text-ink-muted' : scoreTextClassFor(finalScore)
              }`}
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

      {stage === 'final' && shareImagePath && finalScore !== null ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: countUpDurationInMilliseconds / 1000 }}
          className="flex flex-col gap-2"
        >
          <ShareStoryButton imagePath={shareImagePath} fileName="nota-da-mesa.png" className="w-full" />
          {visitId ? (
            <CopyLinkButton
              loadPath={() => createVisitRestaurantPublicLink(visitId)}
              label="Copiar link saiba mais"
              successMessage="Link copiado. Cola no sticker de link do story."
              className="w-full"
            />
          ) : null}
        </motion.div>
      ) : null}
    </div>
  )
}
