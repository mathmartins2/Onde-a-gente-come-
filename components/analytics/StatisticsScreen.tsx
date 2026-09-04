'use client'

import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/Card'
import { apiClient } from '@/lib/http/apiClient'

type StatisticsResponse = {
  totalVisits: number
  cuisines: Array<{ cuisine: string; visitCount: number }>
  neighborhoods: Array<{ neighborhood: string | null; visitCount: number }>
  bestRestaurant: { name: string; bayesianScore: number; visitCount: number } | null
  worstRestaurant: { name: string; bayesianScore: number; visitCount: number } | null
}

const chartColors = ['#ff6b35', '#ff8f5e', '#ffb08a', '#ffc9ae', '#ffe0d2']

type CuisineChartProps = {
  cuisines: Array<{ cuisine: string; visitCount: number }>
}

const CuisineChart = dynamic<CuisineChartProps>(
  async () => {
    const { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } = await import('recharts')

    const CuisineBarChart = ({ cuisines }: CuisineChartProps) => (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={cuisines} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="cuisine"
            tick={{ fill: '#9a9aae', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: '#ffffff08' }}
            contentStyle={{
              background: '#1d1d28',
              border: '1px solid #2a2a38',
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: '#f2f2f5' }}
          />
          <Bar dataKey="visitCount" radius={[6, 6, 0, 0]}>
            {cuisines.map((entry, index) => (
              <Cell key={entry.cuisine} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )

    return CuisineBarChart
  },
  { ssr: false },
)

export const StatisticsScreen = () => {
  const statisticsQuery = useQuery({
    queryKey: ['statistics'],
    queryFn: async () => {
      const response = await apiClient.get<StatisticsResponse>('/statistics')
      return response.data
    },
  })

  if (statisticsQuery.isLoading) return <p className="text-sm text-[var(--muted)]">Carregando...</p>
  const data = statisticsQuery.data
  if (!data) return <p className="text-sm text-[var(--muted)]">Sem dados.</p>

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold">Números do grupo</h1>

      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3.5 text-center">
          <p className="text-2xl font-semibold tabular-nums">{data.totalVisits}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">rolês</p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-2xl font-semibold tabular-nums">{data.cuisines.length}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">cozinhas</p>
        </Card>
        <Card className="p-3.5 text-center">
          <p className="text-2xl font-semibold tabular-nums">{data.neighborhoods.length}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">bairros</p>
        </Card>
      </div>

      {data.cuisines.length > 0 ? (
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Cozinha mais comida</h2>
          <div className="h-44">
            <CuisineChart cuisines={data.cuisines} />
          </div>
        </Card>
      ) : null}

      {data.neighborhoods.length > 0 ? (
        <Card className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Bairro campeão</h2>
          {data.neighborhoods.map((entry) => (
            <div key={entry.neighborhood} className="flex justify-between text-sm">
              <span>{entry.neighborhood}</span>
              <span className="tabular-nums text-[var(--muted)]">{entry.visitCount}x</span>
            </div>
          ))}
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {data.bestRestaurant ? (
          <Card>
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">melhor da história</p>
            <p className="mt-1 text-sm font-medium">{data.bestRestaurant.name}</p>
            <p className="text-xs text-[var(--muted)]">
              {data.bestRestaurant.bayesianScore.toFixed(2)} · {data.bestRestaurant.visitCount}x
            </p>
          </Card>
        ) : null}

        {data.worstRestaurant ? (
          <Card>
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">pior da história</p>
            <p className="mt-1 text-sm font-medium">{data.worstRestaurant.name}</p>
            <p className="text-xs text-[var(--muted)]">
              {data.worstRestaurant.bayesianScore.toFixed(2)} · {data.worstRestaurant.visitCount}x
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
