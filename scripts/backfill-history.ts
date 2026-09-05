import { Pool } from 'pg'

const historicalVisits = [
  { restaurant: 'Outback', score: '4.8', monthsAgo: 13 },
  { restaurant: 'Outback', score: '4.8', monthsAgo: 11 },
  { restaurant: 'Outback', score: '4.8', monthsAgo: 8 },
  { restaurant: 'Outback', score: '4.8', monthsAgo: 5 },
  { restaurant: 'Outback', score: '4.8', monthsAgo: 2 },
  { restaurant: 'Rock n Ribs', score: '4.3', monthsAgo: 16 },
  { restaurant: 'Rock n Ribs', score: '4.3', monthsAgo: 14 },
  { restaurant: 'Rock n Ribs', score: '4.3', monthsAgo: 12 },
  { restaurant: 'Rock n Ribs', score: '4.3', monthsAgo: 10 },
  { restaurant: 'Rock n Ribs', score: '4.3', monthsAgo: 9 },
  { restaurant: 'Rock n Ribs', score: '4.3', monthsAgo: 7 },
  { restaurant: 'Rock n Ribs', score: '4.3', monthsAgo: 6 },
  { restaurant: 'Rock n Ribs', score: '4.3', monthsAgo: 3 },
  { restaurant: 'Rock n Ribs', score: '4.3', monthsAgo: 1 },
  { restaurant: 'Ruffo Recife', score: '5.0', monthsAgo: 9 },
  { restaurant: 'Ruffo Recife', score: '5.0', monthsAgo: 4 },
  { restaurant: 'Yokocho Izakaya e Sushi Bar', score: '4.3', monthsAgo: 3 },
]

const monthsBefore = (months: number) => {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  date.setDate(15)
  date.setHours(20, 30, 0, 0)
  return date
}

const run = async () => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL ausente')

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: true },
  })

  await pool.query('begin')
  await pool.query('delete from visits where draw_id is null')

  for (const visit of historicalVisits) {
    const restaurant = await pool.query<{ id: string; created_by: string | null }>(
      'select id, created_by from restaurants where name ilike $1 limit 1',
      [visit.restaurant.replace('Forneria1121', 'Forneria%1121')],
    )
    const found = restaurant.rows.at(0)
    if (!found) {
      console.log('  nao encontrei:', visit.restaurant)
      continue
    }

    await pool.query(
      `insert into visits (restaurant_id, recommended_by_member_id, legacy_score, visited_at, revealed_at)
       values ($1, $2, $3, $4, $4)`,
      [found.id, found.created_by, visit.score, monthsBefore(visit.monthsAgo)],
    )
  }

  await pool.query('commit')

  const summary = await pool.query(`
    select r.name, count(*)::int as idas, max(v.legacy_score) as nota,
           to_char(min(v.visited_at), 'MM/YY') as primeira,
           to_char(max(v.visited_at), 'MM/YY') as ultima
    from visits v join restaurants r on r.id = v.restaurant_id
    where v.draw_id is null
    group by r.name order by count(*) desc, max(v.legacy_score) desc`)

  summary.rows.forEach((row) =>
    console.log(
      `    ${row.name.padEnd(30)} ${row.idas}x  nota ${row.nota}  ${row.primeira} a ${row.ultima}`,
    ),
  )

  await pool.end()
}

run().catch((error) => {
  console.log('ERRO', error.message)
  process.exit(1)
})
