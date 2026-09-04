export const drawConfiguration = {
  baseMemberWeight: 1,
  weightIncreasePerRoundWithoutWinning: 0.25,
  maximumMemberWeight: 2.5,
  minimumMemberWeight: 1,
  recentlyVisitedPenalty: 0.2,
  monthsToFullyRecoverFromVisit: 12,
  vetoesAllowedPerMemberPerRound: 1,
  minimumQuorumRatio: 0.5,
  qualityInfluencePerScorePoint: 0.1,
  minimumQualityMultiplier: 0.85,
  maximumQualityMultiplier: 1.15,
} as const

export const ratingConfiguration = {
  minimumScore: 0,
  maximumScore: 5,
  recommenderWeight: 1,
  nonRecommenderWeight: 1.25,
} as const


export const ratingCriteria = [
  { key: 'flavor', label: 'Sabor', column: 'flavorScore' },
  { key: 'price', label: 'Preço', column: 'priceScore' },
  { key: 'service', label: 'Atendimento', column: 'serviceScore' },
  { key: 'ambience', label: 'Ambiente', column: 'ambienceScore' },
  { key: 'menu', label: 'Menu', column: 'menuScore' },
  { key: 'waitTime', label: 'Tempo de espera', column: 'waitTimeScore' },
] as const

export type RatingCriterionKey = (typeof ratingCriteria)[number]['key']

export const rankingConfiguration = {
  bayesianConfidenceConstant: 5,
  bayesianPriorScore: 3,
  legacyVisitWeight: 1,
} as const

export const securityConfiguration = {
  sessionDurationInSeconds: 60 * 60 * 24 * 30,
  maximumPinAttemptsPerVisit: 5,
  pinLockoutInSeconds: 60 * 15,
  maximumLoginAttemptsPerUsername: 8,
  loginLockoutInSeconds: 60 * 10,
  credentialFingerprintLength: 32,
  drawCooldownInSeconds: 60,
} as const

export const regionConfiguration = {
  allowedCities: ['Recife', 'Jaboatão dos Guararapes', 'Olinda'],
  boundingBox: {
    minimumLongitude: -35.1,
    minimumLatitude: -8.3,
    maximumLongitude: -34.8,
    maximumLatitude: -7.9,
  },
} as const
