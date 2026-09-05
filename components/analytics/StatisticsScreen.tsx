'use client'

import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card } from '@/components/ui/Card'
import { apiClient } from '@/lib/http/apiClient'

type FrequencyBucket = { period: string; visitCount: number }

type RestaurantFrequency = {
  restaurantId: string
  name: string
  visitCount: number
  lastVisitedAt: string | null
  firstVisitedAt: string | null
}

type SpendingData = {
  currentMonth: { period: string; total: number; visitCount: number }
  byRestaurant: Array<{
    restaurantId: string
    name: string
    total: number
    visits: number
    averagePerVisit: number
  }>
  byMonth: Array<{ period: string; total: number }>
  totalSpent: number
  averagePerVisit: number
}

type StatisticsResponse = {
  totalVisits: number
  spending: SpendingData
  frequency: {
    byMonth: FrequencyBucket[]
    byYear: FrequencyBucket[]
    byRestaurant: RestaurantFrequency[]
  }
  cuisines: Array<{ cuisine: string; visitCount: number }>
  neighborhoods: Array<{ neighborhood: string | null; visitCount: number }>
  bestRestaurant: { name: string; bayesianScore: number; visitCount: number } | null
  worstRestaurant: { name: string; bayesianScore: number; visitCount: number } | null
}

const tooltipStyle = {
  background: '#1d1d28',
  border: '1px solid #2a2a38',
  borderRadius: 12,
  fontSize: 12,
}

const formatMonthLabel = (period: string) => {
  const [year, month] = period.split('-')
  return format(new Date(Number(year), Number(month) - 1, 1), "MMM/yy", { locale: ptBR })
}

const formatFullDate = (value: string) =>
  format(new Date(value), "d 'de' MMM 'de' yyyy", { locale: ptBR })

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
            formatter={(value) => [`${value} rolê(s)`, '']}
            contentStyle={tooltipStyle}
            labelStyle={{ color: '#f2f2f5', fontWeight: 600 }}
            itemStyle={{ color: '#ff6b35' }}
          />
          <Bar dataKey="visitCount" radius={[6, 6, 0, 0]} maxBarSize={64}>
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

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

type SpendingChartProps = {
  buckets: Array<{ period: string; total: number }>
}

const SpendingChart = dynamic<SpendingChartProps>(
  async () => {
    const { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } = await import('recharts')

    const SpendingBarChart = ({ buckets }: SpendingChartProps) => {
      const highestTotal = Math.max(...buckets.map((bucket) => bucket.total))

      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="period"
              tickFormatter={formatMonthLabel}
              tick={{ fill: '#9a9aae', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#ffffff08' }}
              labelFormatter={(label) => formatMonthLabel(String(label))}
              formatter={(value) => [currencyFormatter.format(Number(value)), '']}
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#f2f2f5', fontWeight: 600 }}
              itemStyle={{ color: '#a8dd52' }}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {buckets.map((bucket) => (
                <Cell
                  key={bucket.period}
                  fill={bucket.total === highestTotal ? '#ff6b35' : '#a8dd52'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    }

    return SpendingBarChart
  },
  { ssr: false },
)

type MonthlyChartProps = {
  buckets: Array<{ period: string; visitCount: number }>
}

const MonthlyChart = dynamic<MonthlyChartProps>(
  async () => {
    const { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } = await import('recharts')

    const MonthlyBarChart = ({ buckets }: MonthlyChartProps) => (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="period"
            tickFormatter={formatMonthLabel}
            tick={{ fill: '#9a9aae', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: '#ffffff08' }}
            labelFormatter={(label) => formatMonthLabel(String(label))}
            formatter={(value) => [`${value} rolê(s)`, '']}
            contentStyle={tooltipStyle}
            labelStyle={{ color: '#f2f2f5' }}
          />
          <Bar dataKey="visitCount" radius={[6, 6, 0, 0]} fill="#ff6b35" maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    )

    return MonthlyBarChart
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

  const highestSpendingMonth = data.spending.byMonth.reduce<
    { period: string; total: number } | null
  >((highest, bucket) => (highest === null || bucket.total > highest.total ? bucket : highest), null)

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold">Números do grupo</h1>

      {data.spending.totalSpent > 0 ? (
        <Card className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
                {formatMonthLabel(data.spending.currentMonth.period)} · este mês
              </p>
              <p className="font-display mt-1 text-3xl font-semibold tabular-nums text-[var(--herb)]">
                {currencyFormatter.format(data.spending.currentMonth.total)}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                {data.spending.currentMonth.visitCount} rolê(s)
              </p>
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-3 border-t border-[var(--border)] pt-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
                desde o começo
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {currencyFormatter.format(data.spending.totalSpent)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
                média por rolê
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--accent)]">
                {currencyFormatter.format(data.spending.averagePerVisit)}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

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

      {data.spending.byMonth.length > 0 ? (
        <Card>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Gasto por mês</h2>
            {highestSpendingMonth ? (
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent)]">
                recorde: {formatMonthLabel(highestSpendingMonth.period)}{' '}
                {currencyFormatter.format(highestSpendingMonth.total)}
              </span>
            ) : null}
          </div>
          <div className="h-40">
            <SpendingChart buckets={data.spending.byMonth} />
          </div>
          <div className="mt-3 flex flex-col gap-1.5 border-t border-[var(--border)] pt-3">
            {[...data.spending.byMonth]
              .sort((first, second) => second.total - first.total)
              .map((bucket) => (
                <div
                  key={bucket.period}
                  className="flex items-baseline justify-between gap-3 text-xs"
                >
                  <span className={bucket === highestSpendingMonth ? 'text-[var(--accent)]' : ''}>
                    {formatMonthLabel(bucket.period)}
                  </span>
                  <span
                    className={
                      bucket === highestSpendingMonth
                        ? 'tabular-nums text-[var(--accent)]'
                        : 'tabular-nums text-[var(--muted)]'
                    }
                  >
                    {currencyFormatter.format(bucket.total)}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      ) : null}

      {data.spending.byRestaurant.length > 0 ? (
        <Card className="flex flex-col gap-2.5">
          <h2 className="text-sm font-semibold">Quanto cada lugar custou</h2>
          {data.spending.byRestaurant.map((entry) => (
            <div key={entry.restaurantId} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm">
                {entry.name}
                <span className="ml-2 text-xs text-[var(--muted)]">{entry.visits}x</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm tabular-nums">
                  {currencyFormatter.format(entry.total)}
                </span>
                <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  {currencyFormatter.format(entry.averagePerVisit)} por rolê
                </span>
              </span>
            </div>
          ))}
        </Card>
      ) : null}

      {data.frequency.byMonth.length > 0 ? (
        <Card>
          <h2 className="mb-1 text-sm font-semibold">Rolês por mês</h2>
          <p className="mb-3 text-xs text-[var(--muted)]">Quantas vezes vocês saíram em cada mês.</p>
          <div className="h-40">
            <MonthlyChart buckets={data.frequency.byMonth} />
          </div>
        </Card>
      ) : null}

      {data.frequency.byYear.length > 0 ? (
        <Card className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Rolês por ano</h2>
          {data.frequency.byYear.map((bucket) => (
            <div key={bucket.period} className="flex items-baseline justify-between text-sm">
              <span>{bucket.period}</span>
              <span className="tabular-nums text-[var(--muted)]">{bucket.visitCount}x</span>
            </div>
          ))}
        </Card>
      ) : null}

      {data.frequency.byRestaurant.length > 0 ? (
        <Card className="flex flex-col gap-2.5">
          <h2 className="text-sm font-semibold">Quantas vezes em cada lugar</h2>
          {data.frequency.byRestaurant.map((entry) => (
            <div key={entry.restaurantId} className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm">{entry.name}</p>
                {entry.lastVisitedAt ? (
                  <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                    última em {formatFullDate(entry.lastVisitedAt)}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {entry.visitCount}x
              </span>
            </div>
          ))}
        </Card>
      ) : null}

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
