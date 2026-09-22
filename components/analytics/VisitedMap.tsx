'use client'

import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiClient } from '@/lib/http/apiClient'
import { scoreHexFor, scoreToneHexFor } from '@/lib/utilities/scoreTone'
import { paletteFor } from '@/lib/theme/palette'
import { useResolvedTheme } from '@/lib/theme/themeDocument'
import type { ResolvedTheme } from '@/lib/theme/themePreference'
import 'maplibre-gl/dist/maplibre-gl.css'

export type MapPoint = {
  id: string
  name: string
  latitude: number
  longitude: number
  neighborhood: string | null
  cuisines: string[]
  averageScore: number | null
  visitCount: number
}

export const colorForScore = (score: number | null, theme: ResolvedTheme) =>
  score === null ? paletteFor(theme).inkMuted : scoreHexFor(score, theme)

const MapCanvas = dynamic(() => import('./MapCanvas').then((module) => module.MapCanvas), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
})

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
    <span className="text-micro-cap text-ink-faint">{label}</span>
  </span>
)

export const VisitedMap = () => {
  const theme = useResolvedTheme()
  const toneColors = scoreToneHexFor(theme)
  const mapQuery = useQuery({
    queryKey: ['map-points'],
    queryFn: async () => {
      const response = await apiClient.get<{ mapPoints: MapPoint[] }>('/statistics')
      return response.data.mapPoints
    },
  })

  const points = mapQuery.data ?? []
  const rankedPoints = [...points].sort(
    (first, second) => (second.averageScore ?? 0) - (first.averageScore ?? 0),
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading-xl">Mapa dos rolês</h1>
        <div className="mt-2 flex flex-wrap gap-3">
          <LegendDot color={toneColors.great} label="4 ou mais" />
          <LegendDot color={toneColors.good} label="3 a 4" />
          <LegendDot color={toneColors.fair} label="2 a 3" />
          <LegendDot color={toneColors.poor} label="abaixo de 2" />
          <LegendDot color={colorForScore(null, theme)} label="sem nota" />
        </div>
      </div>

      {points.length === 0 ? (
        <Card>
          <EmptyState
            glyph="🗺️"
            title="Nenhum lugar no mapa ainda"
            description="Cadastre pela busca que as coordenadas vêm junto."
          />
        </Card>
      ) : (
        <div className="h-[430px] overflow-hidden rounded-xl border border-hairline-strong lg:h-[560px]">
          <MapCanvas points={points} theme={theme} />
        </div>
      )}

      {points.length > 0 ? (
        <Card className="flex flex-col gap-2">
          {rankedPoints.map((point) => (
            <div key={point.id} className="flex items-baseline justify-between gap-3 text-body-md">
              <span className="min-w-0 truncate">
                {point.name}
                <span className="ml-2 text-caption">
                  {point.neighborhood ?? ''} · {point.visitCount}x
                </span>
              </span>
              <span
                className="text-numeric shrink-0 text-body-sm"
                style={{ color: colorForScore(point.averageScore, theme) }}
              >
                {point.averageScore === null ? 'sem nota' : point.averageScore.toFixed(2)}
              </span>
            </div>
          ))}
        </Card>
      ) : null}
    </div>
  )
}
