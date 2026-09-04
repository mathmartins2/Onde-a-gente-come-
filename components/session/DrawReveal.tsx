'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Ban } from 'lucide-react'

export type DrawRevealData = {
  restaurantId: string
  fallbackRestaurantId: string | null
  bannedRestaurantName: string | null
  contenders: Array<{ restaurantId: string; name: string; addedByName: string; chance: number }>
}

type Stage = 'spinning' | 'banned' | 'fallback' | 'winner'

const scrambleAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const minimumBoardColumns = 6
const maximumBoardColumns = 16
const scrambleTickInMilliseconds = 55
const spinDurationInMilliseconds = 2500
const bannedDurationInMilliseconds = 2400
const fallbackDurationInMilliseconds = 2600

const toBoardCells = (value: string) => {
  const normalized = value.toUpperCase().trim().slice(0, maximumBoardColumns)
  const width = Math.max(normalized.length, minimumBoardColumns)
  return normalized.padEnd(width, ' ').split('')
}

const randomCharacter = () =>
  scrambleAlphabet[Math.floor(Math.random() * scrambleAlphabet.length)]

const FlapBoard = ({ cells, isSettled }: { cells: string[]; isSettled: boolean }) => (
  <div className="flex flex-wrap justify-center gap-[3px]">
    {cells.map((character, index) => (
      <span
        key={`${index}-${character}`}
        className={`board-grain relative flex h-9 w-[18px] items-center justify-center rounded-[3px] border border-[var(--border-strong)] bg-[var(--surface-sunken)] font-mono text-[15px] font-bold leading-none text-[var(--accent-soft)] shadow-[inset_0_-6px_10px_-8px_rgba(0,0,0,0.9)] ${isSettled ? 'flap-cell' : ''}`}
        style={isSettled ? { animationDelay: `${index * 42}ms` } : undefined}
      >
        <span className="absolute inset-x-0 top-1/2 h-px bg-black/50" />
        {character === ' ' ? ' ' : character}
      </span>
    ))}
  </div>
)

const Embers = () => (
  <>
    {[12, 34, 58, 76, 88].map((leftPercentage, index) => (
      <span
        key={leftPercentage}
        className="ember pointer-events-none absolute bottom-6 h-1 w-1 rounded-full bg-[var(--accent)]"
        style={{ left: `${leftPercentage}%`, animationDelay: `${index * 380}ms` }}
      />
    ))}
  </>
)

export const DrawReveal = ({ data }: { data: DrawRevealData }) => {
  const winner = data.contenders.find((entry) => entry.restaurantId === data.restaurantId)
  const fallback = data.contenders.find(
    (entry) => entry.restaurantId === data.fallbackRestaurantId,
  )

  const [stage, setStage] = useState<Stage>('spinning')
  const winnerCells = useMemo(() => toBoardCells(winner?.name ?? 'RESTAURANTE'), [winner?.name])
  const boardColumnCount = winnerCells.length

  const [scrambledCells, setScrambledCells] = useState<string[]>(() =>
    Array.from({ length: minimumBoardColumns }, randomCharacter),
  )

  useEffect(() => {
    if (stage !== 'spinning') return

    const ticker = setInterval(() => {
      setScrambledCells(Array.from({ length: boardColumnCount }, randomCharacter))
    }, scrambleTickInMilliseconds)

    const advance = setTimeout(() => {
      if (data.bannedRestaurantName) return setStage('banned')
      if (fallback) return setStage('fallback')
      setStage('winner')
    }, spinDurationInMilliseconds)

    return () => {
      clearInterval(ticker)
      clearTimeout(advance)
    }
  }, [stage, data.bannedRestaurantName, fallback])

  useEffect(() => {
    if (stage === 'banned') {
      const next = setTimeout(
        () => setStage(fallback ? 'fallback' : 'winner'),
        bannedDurationInMilliseconds,
      )
      return () => clearTimeout(next)
    }
    if (stage === 'fallback') {
      const next = setTimeout(() => setStage('winner'), fallbackDurationInMilliseconds)
      return () => clearTimeout(next)
    }
  }, [stage, fallback])

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-large)] border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-lifted)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/60 to-transparent" />

      <AnimatePresence mode="wait">
        {stage === 'spinning' ? (
          <motion.div key="spinning" exit={{ opacity: 0, y: -10 }} className="px-5 py-12">
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--muted)]">
              destino de hoje
            </p>
            <div className="board-shake mt-6">
              <FlapBoard cells={scrambledCells} isSettled={false} />
            </div>
            <div className="mx-auto mt-7 h-[3px] w-40 overflow-hidden rounded-full bg-[var(--surface-raised)]">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: spinDurationInMilliseconds / 1000, ease: 'linear' }}
                className="h-full w-full rounded-full bg-[var(--accent)]"
              />
            </div>
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
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--muted)]">
              o grupo cortou
            </p>
            <div className="stamp-in mt-6 inline-block">
              <div className="relative rounded-[6px] border-[3px] border-[var(--danger)] px-5 py-2.5">
                <span className="font-display text-3xl font-black uppercase leading-none tracking-tight text-[var(--danger)]">
                  Banido
                </span>
                <Ban
                  size={16}
                  className="absolute -right-2 -top-2 rounded-full bg-[var(--surface)] text-[var(--danger)]"
                />
              </div>
            </div>
            <p className="mt-5 text-lg font-medium text-[var(--muted)] line-through decoration-[var(--danger)] decoration-2">
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
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--muted)]">
              se não rolar, o plano b
            </p>
            <div className="ticket-in relative mx-auto mt-6 max-w-[19rem] rounded-[var(--radius-medium)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-raised)] px-5 py-5 text-center">
              <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[var(--surface)]" />
              <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[var(--surface)]" />
              <p className="text-2xl">🥈</p>
              <p className="font-display mt-2 text-xl font-semibold leading-tight">
                {fallback?.name}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
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
            <Embers />

            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  'radial-gradient(120% 70% at 50% 0%, rgba(255,107,53,0.22) 0%, transparent 62%)',
              }}
            />

            <p className="relative font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--accent)]">
              vai ser em
            </p>

            <div className="relative mt-6">
              <FlapBoard cells={winnerCells} isSettled />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: boardColumnCount * 0.042 + 0.15 }}
              className="font-display relative mt-6 px-2 text-3xl font-semibold leading-[1.05] tracking-tight"
            >
              {winner?.name ?? 'Restaurante'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: boardColumnCount * 0.042 + 0.45 }}
              className="relative mt-3 flex flex-col items-center gap-1.5"
            >
              <p className="text-sm text-[var(--muted)]">
                indicação de{' '}
                <span className="text-[var(--foreground)]">{winner?.addedByName}</span>
              </p>
              <span className="rounded-[var(--radius-pill)] border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent-soft)]">
                tinha {((winner?.chance ?? 0) * 100).toFixed(1)}% de chance
              </span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
