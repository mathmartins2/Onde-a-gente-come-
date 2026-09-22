export type YearRating = {
  memberId: string
  score: number
  comment: string | null
}

export type YearVisit = {
  visitId: string
  restaurantId: string
  restaurantName: string
  neighborhood: string | null
  cuisines: string[]
  photoImageKey: string | null
  visitedAt: Date
  recommendedByMemberId: string | null
  legacyScore: number | null
  isFirstVisitEver: boolean
  billAmount: number | null
  ratings: YearRating[]
}

export type YearDraw = {
  roundNumber: number
  winnerMemberId: string
}

export type YearMember = {
  memberId: string
  displayName: string
  avatarImageKey: string | null
}

export type YearSlideKey = 'summary' | 'bestAndWorst' | 'strictness' | 'moneyAndDraws' | 'personal'

export type YearSlideAvatar = {
  name: string
  imageKey: string | null
}

export type YearSlideEntry = {
  label: string
  value: string
  detail: string | null
  valueScore: number | null
  avatar: YearSlideAvatar | null
}

export type YearSlide = {
  key: YearSlideKey
  eyebrow: string
  title: string
  heroValue: string | null
  heroCaption: string | null
  heroScore: number | null
  entries: YearSlideEntry[]
  quote: { text: string; author: string } | null
  photoImageKey: string | null
  avatar: YearSlideAvatar | null
}

export type YearInReviewInput = {
  year: number
  memberId: string
  visits: YearVisit[]
  draws: YearDraw[]
  members: YearMember[]
}
