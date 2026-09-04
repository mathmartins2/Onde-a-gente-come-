import { config } from 'dotenv'
import { Pool } from 'pg'
import { hashSecret } from '@/lib/auth/password'

config({ path: '.env.local', quiet: true })

const run = async () => {
  const connectionString = process.env.DATABASE_URL
  const username = process.env.RESET_USERNAME
  const newPassword = process.env.RESET_PASSWORD

  if (!connectionString || !username || !newPassword) {
    console.log('uso: DATABASE_URL=... RESET_USERNAME=... RESET_PASSWORD=... tsx scripts/reset-password.ts')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: true },
  })

  const passwordHash = await hashSecret(newPassword)
  const updated = await pool.query(
    'update members set password_hash = $1, must_change_password = true where username = $2 returning username',
    [passwordHash, username],
  )

  if (updated.rows.length === 0) {
    console.log('membro nao encontrado:', username)
    await pool.end()
    process.exit(1)
  }

  await pool.query('delete from authentication_attempts')

  console.log('senha resetada:', updated.rows[0].username)
  console.log('travas de rate limit limpas')
  await pool.end()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
