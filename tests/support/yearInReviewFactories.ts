import { faker } from '@faker-js/faker'
import type { YearDraw, YearMember, YearRating, YearVisit } from '@/lib/yearInReview/types'

export const buildYearMember = (overrides: Partial<YearMember> = {}): YearMember => ({
  memberId: faker.string.uuid(),
  displayName: faker.person.firstName(),
  avatarImageKey: null,
  ...overrides,
})

export const buildYearRating = (member: YearMember, score: number, comment: string | null = null): YearRating => ({
  memberId: member.memberId,
  score,
  comment,
})

export const buildYearVisit = (overrides: Partial<YearVisit> = {}): YearVisit => ({
  visitId: faker.string.uuid(),
  restaurantId: faker.string.uuid(),
  restaurantName: faker.company.name(),
  neighborhood: null,
  cuisines: [],
  photoImageKey: null,
  visitedAt: faker.date.between({ from: '2026-01-01T12:00:00Z', to: '2026-12-30T12:00:00Z' }),
  recommendedByMemberId: null,
  legacyScore: null,
  isFirstVisitEver: false,
  billAmount: null,
  ratings: [],
  ...overrides,
})

export const buildYearDraw = (roundNumber: number, winner: YearMember): YearDraw => ({
  roundNumber,
  winnerMemberId: winner.memberId,
})
