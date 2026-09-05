import { readdirSync } from 'node:fs'
import { config } from 'dotenv'
import { Pool } from 'pg'

config({ path: '.env.local', quiet: true })

const run = async () => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.log('defina DATABASE_URL')
    process.exit(1)
  }

  const localMigrations = readdirSync('drizzle/migrations').filter((entry) =>
    entry.endsWith('.sql'),
  )

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: true },
  })

  const applied = await pool.query<{ hash: string }>(
    'select hash from drizzle.__drizzle_migrations order by created_at',
  )

  const target = connectionString.includes('localhost') ? 'local' : 'remoto'
  console.log(`banco ${target}: ${applied.rows.length} de ${localMigrations.length} migrations`)

  if (applied.rows.length < localMigrations.length) {
    console.log('FALTAM MIGRATIONS — rode `pnpm database:migrate` apontando para este banco')
    await pool.end()
    process.exit(1)
  }

  console.log('em dia')
  await pool.end()
}

run().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
