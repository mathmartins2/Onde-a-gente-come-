import { sql } from 'drizzle-orm'
import { schema } from './client'

export const onlyRevealedVisits = sql`${schema.visits.revealedAt} is not null`
