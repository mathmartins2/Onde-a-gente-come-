'use client'

import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { SparkBurst } from '@/components/ui/SparkBurst'
import type { RevealMood } from '@/lib/scoring/revealMood'
import { classNames } from '@/lib/utilities/classNames'

const confettiColors = ['var(--accent)', 'var(--herb)', 'var(--berry)', 'var(--warning)', 'var(--accent-hover)']
const confettiShapes = ['h-3 w-1.5 rounded-sm', 'h-2 w-2 rounded-full', 'h-1.5 w-3 rounded-sm']
const confettiPieceCount = 56

const confettiPieces = Array.from({ length: confettiPieceCount }, (_, position) => ({
  key: position,
  left: `${(position * 37) % 100}%`,
  color: confettiColors[position % confettiColors.length],
  shape: confettiShapes[position % confettiShapes.length],
  drift: `${((position * 53) % 120) - 60}px`,
  spin: `${360 + ((position * 97) % 540)}deg`,
  duration: `${2.6 + ((position * 29) % 14) / 10}s`,
  delay: `${((position * 17) % 12) / 10}s`,
}))

const rainDropCount = 14

const rainDrops = Array.from({ length: rainDropCount }, (_, position) => ({
  key: position,
  left: `${4 + ((position * 41) % 92)}%`,
  delay: `${((position * 23) % 14) / 10}s`,
}))

const glowRingDelays = ['0s', '0.6s', '1.2s']

export const moodStamps: Record<RevealMood, { label: string; className: string }> = {
  flop: { label: 'rolê furado', className: 'border-[var(--danger)] text-[var(--danger)]' },
  approved: { label: 'rolê aprovado', className: 'border-[var(--herb)] text-[var(--herb)]' },
  legendary: { label: 'rolê lendário', className: 'border-[var(--success)] text-[var(--success)]' },
}

export const moodScoreAnimation: Record<RevealMood, string> = {
  flop: 'score-thud',
  approved: 'score-pop',
  legendary: 'score-hype',
}

const ConfettiShower = () =>
  createPortal(
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {confettiPieces.map((piece) => (
        <span
          key={piece.key}
          className={classNames('confetti-piece', piece.shape)}
          style={
            {
              left: piece.left,
              background: piece.color,
              '--confetti-drift': piece.drift,
              '--confetti-spin': piece.spin,
              '--confetti-duration': piece.duration,
              '--confetti-delay': piece.delay,
            } as CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  )

const GrayRain = () => (
  <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-48 overflow-hidden">
    {rainDrops.map((drop) => (
      <span
        key={drop.key}
        className="rain-drop absolute top-0 h-5 w-px rounded-pill bg-ink-faint"
        style={{ left: drop.left, animationDelay: drop.delay }}
      />
    ))}
  </span>
)

const GlowRings = () => (
  <>
    {glowRingDelays.map((delay) => (
      <span
        key={delay}
        aria-hidden
        className="glow-ring pointer-events-none absolute left-1/2 top-24 h-28 w-28 rounded-full border-2 border-[var(--success)]"
        style={{ animationDelay: delay }}
      />
    ))}
  </>
)

type ScoreCelebrationProps = {
  mood: RevealMood
  isFirstReveal: boolean
}

export const ScoreCelebration = ({ mood, isFirstReveal }: ScoreCelebrationProps) => {
  if (mood === 'flop') return <GrayRain />

  if (mood === 'approved') {
    return (
      <>
        <SparkBurst className="left-[22%] top-24 z-10" />
        <SparkBurst className="right-[22%] top-24 z-10" />
      </>
    )
  }

  return (
    <>
      {isFirstReveal ? <ConfettiShower /> : null}
      <GlowRings />
      <SparkBurst className="left-[16%] top-20 z-10" />
      <SparkBurst className="right-[16%] top-20 z-10" />
      <SparkBurst className="left-1/2 top-36 z-10" />
    </>
  )
}
