'use client'

import { ratingCriteria, type RatingCriterionKey } from '@/lib/scoring/configuration'

export type CriteriaScores = Record<RatingCriterionKey, number>

export const emptyCriteriaScores = () =>
  Object.fromEntries(ratingCriteria.map((criterion) => [criterion.key, 3])) as CriteriaScores

export const calculateAverage = (scores: CriteriaScores) => {
  const values = ratingCriteria.map((criterion) => scores[criterion.key])
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const scoreTone = (value: number) => {
  if (value >= 4) return 'text-[var(--success)]'
  if (value >= 2.5) return 'text-[var(--warning)]'
  return 'text-red-400'
}

type CriteriaFormProps = {
  scores: CriteriaScores
  onChange: (scores: CriteriaScores) => void
}

export const CriteriaForm = ({ scores, onChange }: CriteriaFormProps) => (
  <div className="flex flex-col gap-4">
    {ratingCriteria.map((criterion) => (
      <label key={criterion.key} className="flex flex-col gap-1.5">
        <span className="flex items-baseline justify-between">
          <span className="text-sm">{criterion.label}</span>
          <span
            className={`text-base font-semibold tabular-nums ${scoreTone(scores[criterion.key])}`}
          >
            {scores[criterion.key].toFixed(1)}
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={5}
          step={0.5}
          value={scores[criterion.key]}
          onChange={(event) =>
            onChange({ ...scores, [criterion.key]: Number(event.target.value) })
          }
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--surface-raised)] accent-[var(--accent)]"
        />
      </label>
    ))}
  </div>
)
