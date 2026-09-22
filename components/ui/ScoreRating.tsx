import { UtensilsGlyph } from '@/components/ui/UtensilsGlyph'
import { classNames } from '@/lib/utilities/classNames'
import { scoreTextClassFor } from '@/lib/utilities/scoreTone'

const maximumScore = 5
const positions = [0, 1, 2, 3, 4]

type ScoreRatingProps = {
  score: number
  size?: number
  className?: string
}

export const ScoreRating = ({ score, size = 15, className }: ScoreRatingProps) => {
  const boundedScore = Math.min(Math.max(score, 0), maximumScore)
  const filledTone = scoreTextClassFor(boundedScore)

  return (
    <span
      role="img"
      aria-label={`${boundedScore.toFixed(2)} de ${maximumScore}`}
      className={classNames('inline-flex gap-1', className)}
    >
      {positions.map((position) => {
        const fillRatio = Math.min(Math.max(boundedScore - position, 0), 1)

        return (
          <span key={position} className="relative inline-flex shrink-0">
            <UtensilsGlyph size={size} className="text-ink-faint opacity-45" />
            <span
              aria-hidden
              style={{ width: `${fillRatio * 100}%` }}
              className="absolute inset-y-0 left-0 overflow-hidden"
            >
              <UtensilsGlyph size={size} className={filledTone} />
            </span>
          </span>
        )
      })}
    </span>
  )
}
