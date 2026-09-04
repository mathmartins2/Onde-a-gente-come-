import { drawConfiguration } from '@/lib/scoring/configuration'

export type QualityMultiplierOptions = {
  influencePerScorePoint: number
  minimumMultiplier: number
  maximumMultiplier: number
}

export const defaultQualityMultiplierOptions: QualityMultiplierOptions = {
  influencePerScorePoint: drawConfiguration.qualityInfluencePerScorePoint,
  minimumMultiplier: drawConfiguration.minimumQualityMultiplier,
  maximumMultiplier: drawConfiguration.maximumQualityMultiplier,
}

export const calculateQualityMultiplier = (
  nominatorAverageScore: number | null,
  groupAverageScore: number | null,
  options: QualityMultiplierOptions = defaultQualityMultiplierOptions,
) => {
  if (nominatorAverageScore === null) return 1
  if (groupAverageScore === null) return 1

  const deviation = nominatorAverageScore - groupAverageScore
  const multiplier = 1 + deviation * options.influencePerScorePoint

  return Math.min(Math.max(multiplier, options.minimumMultiplier), options.maximumMultiplier)
}
