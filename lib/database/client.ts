import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForDatabase = globalThis as unknown as { databasePool?: Pool }

const createPool = () => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not defined')
  return new Pool({
    connectionString,
    max: 5,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: true },
  })
}

const pool = globalForDatabase.databasePool ?? createPool()
if (process.env.NODE_ENV !== 'production') globalForDatabase.databasePool = pool

export const database = drizzle(pool, { schema })
export { schema }
