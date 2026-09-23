import { sql } from 'drizzle-orm'
import { schema } from './client'

export const onlyRevealedVisits = sql`${schema.visits.revealedAt} is not null`

export const onlyVisitsThatHappened = sql`(${schema.visits.revealedAt} is not null or ${schema.visits.visitDateConfirmedAt} is not null)`
