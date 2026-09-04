'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { apiClient } from '@/lib/http/apiClient'

type RankingResponse = {
  restaurants: Array<{
    restaurantId: string
    name: string
    visitCount: number
    averageScore: number | null
    bayesianScore: number
    neighborhood: string | null
    cuisines: string[]
    ratingCount: number
  }>
  nominators: Array<{
    memberId: string
    displayName: string
    averageScore: number | null
    restaurantCount: number
  }>
  strictness: Array<{
    memberId: string
    displayName: string
    averageScore: number | null
    ratingCount: number
  }>
}

const medals = ['🥇', '🥈', '🥉']

export const RankingScreen = () => {
  const rankingQuery = useQuery({
    queryKey: ['ranking'],
    queryFn: async () => {
      const response = await apiClient.get<RankingResponse>('/ranking')
      return response.data
    },
  })

  if (rankingQuery.isLoading) return <p className="text-sm text-[var(--muted)]">Carregando...</p>
  const data = rankingQuery.data
  if (!data) return <p className="text-sm text-[var(--muted)]">Sem dados.</p>

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="mb-1 text-lg font-semibold">Ranking dos lugares</h1>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Quanto mais vezes vocês vão e mantêm a nota, mais o lugar sobe.
        </p>

        <div className="flex flex-col gap-2">
          {data.restaurants.length === 0 ? (
            <Card>
              <p className="text-sm text-[var(--muted)]">Ninguém foi a lugar nenhum ainda.</p>
            </Card>
          ) : null}

          {data.restaurants.map((restaurant, index) => (
            <Card key={restaurant.restaurantId} className="flex items-center justify-between gap-3 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-6 text-center text-sm">
                  {medals[index] ?? <span className="text-[var(--muted)]">{index + 1}</span>}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{restaurant.name}</p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {restaurant.visitCount}x ·{' '}
                    {restaurant.averageScore === null
                      ? 'sem nota'
                      : `média ${restaurant.averageScore.toFixed(1)}`}
                    {restaurant.cuisines.length > 0 ? ` · ${restaurant.cuisines.join(', ')}` : ''}
                  </p>
                </div>
              </div>
              <span className="text-lg font-semibold tabular-nums">
                {restaurant.bayesianScore.toFixed(2)}
              </span>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Quem indica bem</h2>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Média das notas dos lugares que cada um indicou. Isso também mexe levemente na chance de ganhar.
        </p>

        <Card className="flex flex-col gap-2.5">
          {data.nominators.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">Ainda não há nota de lugar indicado.</p>
          ) : null}
          {data.nominators.map((nominator) => (
            <div key={nominator.memberId} className="flex items-baseline justify-between text-sm">
              <span>
                {nominator.displayName}
                <span className="ml-2 text-xs text-[var(--muted)]">
                  {nominator.restaurantCount} lugar(es)
                </span>
              </span>
              <span className="tabular-nums">
                {nominator.averageScore === null ? '—' : nominator.averageScore.toFixed(2)}
              </span>
            </div>
          ))}
        </Card>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Quem é carrasco</h2>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Média das notas que cada um dá. Do mais rigoroso pro mais bonzinho.
        </p>

        <Card className="flex flex-col gap-2.5">
          {data.strictness.map((member) => (
            <div key={member.memberId} className="flex items-baseline justify-between text-sm">
              <span>
                {member.displayName}
                <span className="ml-2 text-xs text-[var(--muted)]">
                  {member.ratingCount} nota(s)
                </span>
              </span>
              <span className="tabular-nums">
                {member.averageScore === null ? '—' : member.averageScore.toFixed(2)}
              </span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  )
}
