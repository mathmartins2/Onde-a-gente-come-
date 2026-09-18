'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { ScoreRating } from '@/components/ui/ScoreRating'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiClient } from '@/lib/http/apiClient'
import { formatVisitDay } from '@/lib/utilities/formatDate'
import { scoreTextClassFor } from '@/lib/utilities/scoreTone'

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

const PersonRow = ({
  displayName,
  detail,
  score,
}: {
  displayName: string
  detail: string
  score: number | null
}) => (
  <div className="flex items-baseline justify-between gap-3">
    <span className="min-w-0 truncate text-body-md">
      {displayName}
      <span className="ml-2 text-caption">{detail}</span>
    </span>
    <span
      className={
        score === null ? 'text-caption shrink-0' : `text-numeric shrink-0 text-heading-sm ${scoreTextClassFor(score)}`
      }
    >
      {score === null ? '—' : score.toFixed(2)}
    </span>
  </div>
)

export const RankingScreen = () => {
  const rankingQuery = useQuery({
    queryKey: ['ranking'],
    queryFn: async () => {
      const response = await apiClient.get<RankingResponse>('/ranking')
      return response.data
    },
  })

  if (rankingQuery.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  const data = rankingQuery.data
  if (!data) return <p className="text-body-sm text-ink-muted">Sem dados.</p>

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-heading-xl">Ranking dos lugares</h1>
        <p className="mt-1 text-caption max-w-prose">
          O número grande é o score do ranking, não a nota. Ele começa perto de 3,0 e vai chegando
          na nota real conforme o lugar acumula avaliações.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {data.restaurants.length === 0 ? (
            <Card>
              <EmptyState glyph="🍽️" title="Ninguém foi a lugar nenhum ainda" />
            </Card>
          ) : null}

          {data.restaurants.map((restaurant, index) => (
            <div
              key={restaurant.restaurantId}
              className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-1 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-7 shrink-0 text-center text-heading-sm">
                  {medals[index] ?? <span className="text-numeric text-ink-faint">{index + 1}</span>}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-body-md font-medium">{restaurant.name}</p>
                  <p className="truncate text-caption">
                    {restaurant.visitCount}x ·{' '}
                    {restaurant.averageScore === null
                      ? 'sem nota'
                      : `média ${restaurant.averageScore.toFixed(2)}`}
                    {restaurant.neighborhood ? ` · ${restaurant.neighborhood}` : ''}
                  </p>
                  {restaurant.lastVisitedAt ? (
                    <p className="mt-0.5 truncate text-micro-cap text-ink-faint">
                      última em {formatVisitDay(restaurant.lastVisitedAt)}
                    </p>
                  ) : null}
                </div>
              </div>

              {restaurant.averageScore === null ? (
                <span className="text-numeric shrink-0 text-heading-lg text-ink-faint">—</span>
              ) : (
                <span
                  title="Score do ranking: mistura a nota real com uma âncora neutra de 3,0 até o lugar acumular avaliações"
                  className="flex shrink-0 flex-col items-end gap-1"
                >
                  <span
                    className={`text-numeric text-heading-lg ${scoreTextClassFor(restaurant.bayesianScore)}`}
                  >
                    {restaurant.bayesianScore.toFixed(2)}
                  </span>
                  <ScoreRating score={restaurant.bayesianScore} />
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:gap-6">
        <section>
          <SectionHeading title="Quem indica bem" hint="média do que indicou" />
          <p className="mb-3 text-caption">
            Média das notas dos lugares que cada um indicou. Isso também mexe levemente na chance de
            ganhar.
          </p>

          <Card className="flex flex-col gap-3">
            {data.nominators.length === 0 ? (
              <p className="text-caption">Ainda não há nota de lugar indicado.</p>
            ) : null}
            {data.nominators.map((nominator) => (
              <PersonRow
                key={nominator.memberId}
                displayName={nominator.displayName}
                detail={`${nominator.restaurantCount} lugar(es)`}
                score={nominator.averageScore}
              />
            ))}
          </Card>
        </section>

        <section>
          <SectionHeading title="Quem é carrasco" hint="do rigoroso ao bonzinho" />
          <p className="mb-3 text-caption">Média das notas que cada um dá.</p>

          <Card className="flex flex-col gap-3">
            {data.strictness.map((member) => (
              <PersonRow
                key={member.memberId}
                displayName={member.displayName}
                detail={`${member.ratingCount} nota(s)`}
                score={member.averageScore}
              />
            ))}
          </Card>
        </section>
      </div>
    </div>
  )
}
