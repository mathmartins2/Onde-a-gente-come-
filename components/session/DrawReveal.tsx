'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Ban } from 'lucide-react'
import { SparkBurst } from '@/components/ui/SparkBurst'
import { SplitFlapBoard } from '@/components/ui/SplitFlapBoard'
import { minimumBoardColumns, toBoardRows } from '@/lib/utilities/splitFlapRows'

export type DrawRevealData = {
  restaurantId: string | null
  fallbackRestaurantId: string | null
  bannedRestaurantName: string | null
  tiedRestaurantNames: string[]
  wasBanDecidedByTiebreak: boolean
  contenders: Array<{ restaurantId: string; name: string; addedByName: string; chance: number }>
}

type Stage = 'spinning' | 'tiebreak' | 'banned' | 'fallback' | 'winner'

const scrambleAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const scrambleTickInMilliseconds = 55
const spinDurationInMilliseconds = 2500
const tiebreakDurationInMilliseconds = 2600
const bannedDurationInMilliseconds = 2400
const fallbackDurationInMilliseconds = 2600

const randomCharacter = () =>
  scrambleAlphabet[Math.floor(Math.random() * scrambleAlphabet.length)]

export const DrawReveal = ({
  data,
  onFinished,
}: {
  data: DrawRevealData
  onFinished?: () => void
}) => {
  const winner = data.contenders.find((entry) => entry.restaurantId === data.restaurantId)
  const fallback = data.contenders.find(
    (entry) => entry.restaurantId === data.fallbackRestaurantId,
  )
  const hasFallback = Boolean(fallback)
  const hasBan = Boolean(data.bannedRestaurantName)
  const wasBanDecidedByTiebreak = data.wasBanDecidedByTiebreak

  const [stage, setStage] = useState<Stage>('spinning')
  const winnerRows = useMemo(() => toBoardRows(winner?.name ?? 'RESTAURANTE'), [winner?.name])
  const boardCellCount = winnerRows.flat().length

  const [scrambledRows, setScrambledRows] = useState<string[][]>(() => [
    Array.from({ length: minimumBoardColumns }, randomCharacter),
  ])

  useEffect(() => {
    if (stage !== 'spinning' && stage !== 'tiebreak') return

    const ticker = setInterval(() => {
      setScrambledRows(winnerRows.map((row) => row.map(randomCharacter)))
    }, scrambleTickInMilliseconds)

    if (stage === 'tiebreak') return () => clearInterval(ticker)

    const advance = setTimeout(() => {
      if (wasBanDecidedByTiebreak) return setStage('tiebreak')
      if (hasBan) return setStage('banned')
      if (hasFallback) return setStage('fallback')
      setStage('winner')
    }, spinDurationInMilliseconds)

    return () => {
      clearInterval(ticker)
      clearTimeout(advance)
    }
  }, [stage, winnerRows, hasBan, wasBanDecidedByTiebreak, hasFallback])

  useEffect(() => {
    if (stage === 'tiebreak') {
      const next = setTimeout(() => setStage('banned'), tiebreakDurationInMilliseconds)
      return () => clearTimeout(next)
    }
    if (stage === 'banned') {
      const next = setTimeout(
        () => setStage(hasFallback ? 'fallback' : 'winner'),
        bannedDurationInMilliseconds,
      )
      return () => clearTimeout(next)
    }
    if (stage === 'fallback') {
      const next = setTimeout(() => setStage('winner'), fallbackDurationInMilliseconds)
      return () => clearTimeout(next)
    }
  }, [stage, hasFallback])

  useEffect(() => {
    if (stage !== 'winner') return
    onFinished?.()
  }, [stage, onFinished])

  return (
    <div
      data-draw-stage={stage}
      className="relative overflow-hidden rounded-2xl border border-hairline-strong bg-surface-1 shadow-[var(--elevation-3)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/60 to-transparent" />

      <AnimatePresence mode="wait">
        {stage === 'spinning' ? (
          <motion.div key="spinning" exit={{ opacity: 0, y: -10 }} className="px-5 py-12">
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-ink-muted">
              destino de hoje
            </p>
            <div className="board-shake mt-6">
              <SplitFlapBoard rows={scrambledRows} isSettled={false} />
            </div>
            <div className="mx-auto mt-7 h-[3px] w-40 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: spinDurationInMilliseconds / 1000, ease: 'linear' }}
                className="h-full w-full rounded-full bg-[var(--accent)]"
              />
            </div>
          </motion.div>
        ) : null}

        {stage === 'tiebreak' ? (
          <motion.div
            key="tiebreak"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-5 py-12 text-center"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--warning)]">
              empate na votação
            </p>
            <p className="mt-4 text-sm text-ink-muted">
              {data.tiedRestaurantNames.join(' · ')}
            </p>
            <div className="board-shake mt-6">
              <SplitFlapBoard rows={scrambledRows} isSettled={false} />
            </div>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
              sorteando quem cai
            </p>
          </motion.div>
        ) : null}

        {stage === 'banned' ? (
          <motion.div
            key="banned"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative px-5 py-14 text-center"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-ink-muted">
              {data.wasBanDecidedByTiebreak ? 'caiu no sorteio do empate' : 'o grupo cortou'}
            </p>
            <div className="stamp-in mt-6 inline-block">
              <div className="relative rounded-[6px] border-[3px] border-[var(--danger)] px-5 py-2.5">
                <span className="font-display text-3xl font-black uppercase leading-none tracking-tight text-[var(--danger)]">
                  Banido
                </span>
                <Ban
                  size={16}
                  className="absolute -right-2 -top-2 rounded-full bg-surface-1 text-[var(--danger)]"
                />
              </div>
            </div>
            <p className="mt-5 text-lg font-medium text-ink-muted line-through decoration-[var(--danger)] decoration-2">
              {data.bannedRestaurantName}
            </p>
          </motion.div>
        ) : null}

        {stage === 'fallback' ? (
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-5 py-12"
          >
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-ink-muted">
              se não rolar, o plano b
            </p>
            <div className="ticket-in relative mx-auto mt-6 max-w-[19rem] rounded-xl border border-dashed border-hairline-strong bg-surface-2 px-5 py-5 text-center">
              <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface-1" />
              <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface-1" />
              <p className="text-2xl">🥈</p>
              <p className="font-display mt-2 text-xl font-semibold leading-tight">
                {fallback?.name}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                indicação de {fallback?.addedByName}
              </p>
            </div>
          </motion.div>
        ) : null}

        {stage === 'winner' ? (
          <motion.div
            key="winner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative px-5 py-14 text-center"
          >
            <span className="spotlight-bloom pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]" />
            <SparkBurst className="left-[9%] top-[30%] z-10" />
            <SparkBurst className="right-[9%] top-[30%] z-10" />

            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  'radial-gradient(120% 70% at 50% 0%, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 62%)',
              }}
            />

            <p className="relative font-mono text-[10px] uppercase tracking-[0.4em] text-accent">
              vai ser em
            </p>

            <div className="relative mt-6">
              <SplitFlapBoard rows={winnerRows} isSettled />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: boardCellCount * 0.042 + 0.15 }}
              className="font-display relative mt-6 px-2 text-3xl font-semibold leading-[1.05] tracking-tight"
            >
              {winner?.name ?? 'Restaurante'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: boardCellCount * 0.042 + 0.45 }}
              className="relative mt-3 flex flex-col items-center gap-1.5"
            >
              <p className="text-sm text-ink-muted">
                indicação de{' '}
                <span className="text-ink">{winner?.addedByName}</span>
              </p>
              <span className="rounded-pill border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-accent-hover">
                tinha {((winner?.chance ?? 0) * 100).toFixed(1)}% de chance
              </span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
