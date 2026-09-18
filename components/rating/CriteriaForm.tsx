'use client'

import { Slider } from '@/components/ui/Slider'
import { ratingCriteria, type RatingCriterionKey } from '@/lib/scoring/configuration'
import { scoreTextClassFor } from '@/lib/utilities/scoreTone'

export type CriteriaScores = Record<RatingCriterionKey, number>

export const emptyCriteriaScores = () =>
  Object.fromEntries(ratingCriteria.map((criterion) => [criterion.key, 3])) as CriteriaScores

export const calculateAverage = (scores: CriteriaScores) => {
  const values = ratingCriteria.map((criterion) => scores[criterion.key])
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

type CriteriaFormProps = {
  scores: CriteriaScores
  onChange: (scores: CriteriaScores) => void
}

export const CriteriaForm = ({ scores, onChange }: CriteriaFormProps) => (
  <div className="flex flex-col gap-5">
    {ratingCriteria.map((criterion) => (
      <Slider
        key={criterion.key}
        label={criterion.label}
        value={scores[criterion.key]}
        valueClassName={scoreTextClassFor(scores[criterion.key])}
        onChange={(value) => onChange({ ...scores, [criterion.key]: value })}
      />
    ))}
  </div>
)
