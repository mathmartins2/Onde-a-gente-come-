import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  ratingPinHash: text('rating_pin_hash'),
  roundsSinceLastWin: integer('rounds_since_last_win').notNull().default(0),
  mustChangePassword: boolean('must_change_password').notNull().default(true),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const restaurants = pgTable(
  'restaurants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    address: text('address'),
    neighborhood: text('neighborhood'),
    city: text('city'),
    postalCode: text('postal_code'),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    cuisines: text('cuisines').array().notNull().default([]),
    phone: text('phone'),
    website: text('website'),
    placeSource: text('place_source'),
    placeReference: text('place_reference'),
    createdBy: uuid('created_by').references(() => members.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('restaurants_name_index').on(table.name)],
)

export const nominations = pgTable(
  'nominations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    consumedByDrawId: uuid('consumed_by_draw_id'),
  },
  (table) => [
    unique('nominations_active_unique').on(table.memberId, table.restaurantId, table.consumedAt),
    index('nominations_member_index').on(table.memberId),
  ],
)

export const vetoes = pgTable(
  'vetoes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roundNumber: integer('round_number').notNull(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    nominationId: uuid('nomination_id').references(() => nominations.id, {
      onDelete: 'cascade',
    }),
    restaurantId: uuid('restaurant_id').references(() => restaurants.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('vetoes_member_round_unique').on(table.memberId, table.roundNumber)],
)

export const draws = pgTable('draws', {
  id: uuid('id').primaryKey().defaultRandom(),
  roundNumber: integer('round_number').notNull().unique(),
  winnerMemberId: uuid('winner_member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'restrict' }),
  restaurantId: uuid('restaurant_id')
    .notNull()
    .references(() => restaurants.id, { onDelete: 'restrict' }),
  nominationId: uuid('nomination_id').references(() => nominations.id, { onDelete: 'set null' }),
  weightSnapshot: jsonb('weight_snapshot').notNull(),
  drawnAt: timestamp('drawn_at', { withTimezone: true }).notNull().defaultNow(),
})

export const visits = pgTable('visits', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id')
    .notNull()
    .references(() => restaurants.id, { onDelete: 'cascade' }),
  drawId: uuid('draw_id').references(() => draws.id, { onDelete: 'set null' }),
  recommendedByMemberId: uuid('recommended_by_member_id').references(() => members.id, {
    onDelete: 'set null',
  }),
  visitedAt: timestamp('visited_at', { withTimezone: true }).notNull().defaultNow(),
  revealedAt: timestamp('revealed_at', { withTimezone: true }),
  legacyScore: numeric('legacy_score', { precision: 3, scale: 1 }),
  legacyComment: text('legacy_comment'),
})

export const ratings = pgTable(
  'ratings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    visitId: uuid('visit_id')
      .notNull()
      .references(() => visits.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    score: numeric('score', { precision: 3, scale: 1 }).notNull(),
    comment: text('comment'),
    appliedWeight: numeric('applied_weight', { precision: 4, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('ratings_visit_member_unique').on(table.visitId, table.memberId)],
)

export const placeLookupCache = pgTable('place_lookup_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  cacheKey: text('cache_key').notNull().unique(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const authenticationAttempts = pgTable(
  'authentication_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scope: text('scope').notNull(),
    identifier: text('identifier').notNull(),
    failureCount: integer('failure_count').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('authentication_attempts_unique').on(table.scope, table.identifier)],
)


export const drawSessions = pgTable('draw_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roundNumber: integer('round_number').notNull().unique(),
  openedByMemberId: uuid('opened_by_member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'restrict' }),
  status: text('status').notNull().default('collecting'),
  drawId: uuid('draw_id').references(() => draws.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  drawnAt: timestamp('drawn_at', { withTimezone: true }),
})

export const sessionParticipants = pgTable(
  'session_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => drawSessions.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    isReady: boolean('is_ready').notNull().default(false),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    readyAt: timestamp('ready_at', { withTimezone: true }),
  },
  (table) => [unique('session_participants_unique').on(table.sessionId, table.memberId)],
)

export const sessionPoolEntries = pgTable(
  'session_pool_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => drawSessions.id, { onDelete: 'cascade' }),
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    addedByMemberId: uuid('added_by_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('session_pool_entries_unique').on(table.sessionId, table.restaurantId)],
)

export const sessionPreferences = pgTable(
  'session_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => drawSessions.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
  },
  (table) => [
    unique('session_preferences_unique').on(table.sessionId, table.memberId, table.restaurantId),
    unique('session_preferences_position_unique').on(
      table.sessionId,
      table.memberId,
      table.position,
    ),
  ],
)

export const ratingSessionParticipants = pgTable(
  'rating_session_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    visitId: uuid('visit_id')
      .notNull()
      .references(() => visits.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    isReady: boolean('is_ready').notNull().default(false),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('rating_session_participants_unique').on(table.visitId, table.memberId)],
)

export const membersRelations = relations(members, ({ many }) => ({
  nominations: many(nominations),
  ratings: many(ratings),
}))

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  nominations: many(nominations),
  visits: many(visits),
}))

export const nominationsRelations = relations(nominations, ({ one }) => ({
  member: one(members, { fields: [nominations.memberId], references: [members.id] }),
  restaurant: one(restaurants, {
    fields: [nominations.restaurantId],
    references: [restaurants.id],
  }),
}))

export const visitsRelations = relations(visits, ({ one, many }) => ({
  restaurant: one(restaurants, { fields: [visits.restaurantId], references: [restaurants.id] }),
  ratings: many(ratings),
}))

export const ratingsRelations = relations(ratings, ({ one }) => ({
  visit: one(visits, { fields: [ratings.visitId], references: [visits.id] }),
  member: one(members, { fields: [ratings.memberId], references: [members.id] }),
}))
