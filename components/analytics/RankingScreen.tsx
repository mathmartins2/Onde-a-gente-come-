'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
    lastVisitedAt: string | null
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
    lastVisitedAt: string | null
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
          O número grande é o score do ranking, não a nota. Ele começa perto de 3,0 e vai chegando
          na nota real conforme o lugar acumula avaliações.
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
                      : `média ${restaurant.averageScore.toFixed(2)}`}
                    {restaurant.cuisines.length > 0 ? ` · ${restaurant.cuisines.join(', ')}` : ''}
                  </p>
                  {restaurant.lastVisitedAt ? (
                    <p className="truncate text-[10px] uppercase tracking-wide text-[var(--muted)]">
                      última em{' '}
                      {format(new Date(restaurant.lastVisitedAt), "d 'de' MMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  ) : null}
                </div>
              </div>
              <span
                title="Score do ranking: mistura a nota real com uma âncora neutra de 3,0 até o lugar acumular avaliações"
                className={
                  restaurant.averageScore === null
                    ? 'shrink-0 text-xs uppercase tracking-wide text-[var(--muted)]'
                    : 'shrink-0 text-lg font-semibold tabular-nums'
                }
              >
                {restaurant.averageScore === null
                  ? 'aguardando'
                  : restaurant.bayesianScore.toFixed(2)}
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
