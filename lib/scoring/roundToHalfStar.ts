export const roundToHalfStar = (score: number) => Math.round(score * 2) / 2

export const formatHalfStarScore = (score: number) => String(roundToHalfStar(score))
