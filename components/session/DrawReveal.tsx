'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Ban, Sparkles, Trophy } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export type DrawRevealData = {
  restaurantId: string
  fallbackRestaurantId: string | null
  bannedRestaurantName: string | null
  contenders: Array<{ restaurantId: string; name: string; addedByName: string; chance: number }>
}

type Stage = 'spinning' | 'banned' | 'fallback' | 'winner'

const spinIntervalInMilliseconds = 90
const spinDurationInMilliseconds = 2600

const stageAfterSpin = (hasBanned: boolean, hasFallback: boolean): Stage => {
  if (hasBanned) return 'banned'
  if (hasFallback) return 'fallback'
  return 'winner'
}

export const DrawReveal = ({ data }: { data: DrawRevealData }) => {
  const winner = data.contenders.find((entry) => entry.restaurantId === data.restaurantId)
  const fallback = data.contenders.find(
    (entry) => entry.restaurantId === data.fallbackRestaurantId,
  )

  const [stage, setStage] = useState<Stage>('spinning')
  const [spinningIndex, setSpinningIndex] = useState(0)

  useEffect(() => {
    if (stage !== 'spinning') return

    const names = data.contenders.length > 0 ? data.contenders : [{ name: '...' }]
    const ticker = setInterval(() => {
      setSpinningIndex((current) => (current + 1) % names.length)
    }, spinIntervalInMilliseconds)

    const finish = setTimeout(() => {
      setStage(stageAfterSpin(Boolean(data.bannedRestaurantName), Boolean(fallback)))
    }, spinDurationInMilliseconds)

    return () => {
      clearInterval(ticker)
      clearTimeout(finish)
    }
  }, [stage, data.contenders, data.bannedRestaurantName, fallback])

  useEffect(() => {
    if (stage === 'banned') {
      const next = setTimeout(() => setStage(fallback ? 'fallback' : 'winner'), 2200)
      return () => clearTimeout(next)
    }
    if (stage === 'fallback') {
      const next = setTimeout(() => setStage('winner'), 2400)
      return () => clearTimeout(next)
    }
  }, [stage, fallback])

  const spinningName = data.contenders[spinningIndex]?.name ?? '...'

  return (
    <AnimatePresence mode="wait">
      {stage === 'spinning' ? (
        <motion.div key="spinning" exit={{ opacity: 0, scale: 0.95 }}>
          <Card className="flex flex-col items-center gap-4 overflow-hidden py-14 text-center">
            <motion.p
              animate={{ rotate: [0, 12, -12, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="text-4xl"
            >
              🎲
            </motion.p>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">sorteando</p>
            <motion.p
              key={spinningName}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.08 }}
              className="px-4 text-2xl font-semibold blur-[0.4px]"
            >
              {spinningName}
            </motion.p>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: spinDurationInMilliseconds / 1000, ease: 'linear' }}
              className="h-0.5 rounded-full bg-[var(--accent)]"
            />
          </Card>
        </motion.div>
      ) : null}

      {stage === 'banned' ? (
        <motion.div
          key="banned"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, y: -16 }}
        >
          <Card className="flex flex-col items-center gap-3 border-red-500/40 py-12 text-center">
            <Ban size={26} className="text-red-400" />
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
              o grupo baniu
            </p>
            <p className="text-2xl font-semibold text-red-300 line-through">
              {data.bannedRestaurantName}
            </p>
            <p className="text-xs text-[var(--muted)]">ficou fora do sorteio</p>
          </Card>
        </motion.div>
      ) : null}

      {stage === 'fallback' ? (
        <motion.div
          key="fallback"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, y: -16 }}
        >
          <Card className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-3xl">🥈</p>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
              plano B, se não rolar
            </p>
            <p className="text-2xl font-semibold">{fallback?.name}</p>
            <p className="text-xs text-[var(--muted)]">indicação de {fallback?.addedByName}</p>
          </Card>
        </motion.div>
      ) : null}

      {stage === 'winner' ? (
        <motion.div
          key="winner"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14 }}
        >
          <Card className="relative flex flex-col items-center gap-3 overflow-hidden border-[var(--accent)] bg-gradient-to-b from-[var(--accent)]/20 to-transparent py-14 text-center">
            <motion.div
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="absolute h-24 w-24 rounded-full bg-[var(--accent)]"
            />
            <Trophy size={28} className="relative text-[var(--accent)]" />
            <p className="relative text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
              vai ser em
            </p>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative px-4 text-3xl font-semibold leading-tight"
            >
              {winner?.name ?? 'Restaurante'}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative text-sm text-[var(--muted)]"
            >
              indicação de {winner?.addedByName}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="relative mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--muted)]"
            >
              <Sparkles size={12} />
              tinha {((winner?.chance ?? 0) * 100).toFixed(1)}% de chance
            </motion.div>
          </Card>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
