'use client'

import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/Card'
import { apiClient } from '@/lib/http/apiClient'
import 'leaflet/dist/leaflet.css'

type MapPoint = {
  id: string
  name: string
  latitude: number
  longitude: number
  neighborhood: string | null
  cuisines: string[]
  averageScore: number | null
  visitCount: number
}

const scorePalette = {
  great: '#5fd68f',
  good: '#fbbf24',
  poor: '#ff6b6b',
  unrated: '#b0a094',
}

const colorForScore = (score: number | null) => {
  if (score === null) return scorePalette.unrated
  if (score >= 4) return scorePalette.great
  if (score >= 2.5) return scorePalette.good
  return scorePalette.poor
}

const MapCanvas = dynamic(
  async () => {
    const leaflet = await import('leaflet')
    const { MapContainer, Marker, Popup, TileLayer } = await import('react-leaflet')

    const buildPinIcon = (point: MapPoint) => {
      const color = colorForScore(point.averageScore)
      const label = point.averageScore === null ? '—' : point.averageScore.toFixed(1)

      return leaflet.divIcon({
        className: '',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        html: `
          <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; gap: 2px; white-space: nowrap;">
            <span style="
              font-family: ui-monospace, monospace;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 0.02em;
              color: #f8f0e7;
              background: rgba(23,17,14,0.94);
              border: 1px solid ${color};
              border-radius: 999px;
              padding: 2px 7px;
              box-shadow: 0 6px 16px -8px rgba(0,0,0,0.95);
            ">${point.name}<span style="color:${color}; margin-left:5px;">${label}</span></span>
            <span style="
              width: 11px; height: 11px; border-radius: 999px;
              background: ${color};
              border: 2px solid rgba(23,17,14,0.94);
              box-shadow: 0 0 0 2px ${color}44;
            "></span>
          </div>
        `,
      })
    }

    const RenderedMap = ({ points }: { points: MapPoint[] }) => (
      <MapContainer
        center={[-8.06, -34.89]}
        zoom={12}
        style={{ height: '100%', width: '100%', background: '#0d0a09' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {points.map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={buildPinIcon(point)}
          >
            <Popup>
              <strong>{point.name}</strong>
              <br />
              {point.visitCount}x
              {point.averageScore === null ? '' : ` · nota ${point.averageScore.toFixed(2)}`}
              {point.cuisines.length > 0 ? <><br />{point.cuisines.join(', ')}</> : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    )

    return RenderedMap
  },
  { ssr: false },
)

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
      {label}
    </span>
  </span>
)

export const VisitedMap = () => {
  const mapQuery = useQuery({
    queryKey: ['map-points'],
    queryFn: async () => {
      const response = await apiClient.get<{ mapPoints: MapPoint[] }>('/statistics')
      return response.data.mapPoints
    },
  })

  const points = mapQuery.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Mapa dos rolês</h1>
        <div className="mt-2 flex flex-wrap gap-3">
          <LegendDot color={scorePalette.great} label="4 ou mais" />
          <LegendDot color={scorePalette.good} label="2,5 a 4" />
          <LegendDot color={scorePalette.poor} label="abaixo de 2,5" />
          <LegendDot color={scorePalette.unrated} label="sem nota" />
        </div>
      </div>

      {points.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            Nenhum lugar visitado tem coordenada ainda. Cadastre pela busca no mapa que as
            coordenadas vêm junto.
          </p>
        </Card>
      ) : (
        <div className="h-[430px] overflow-hidden rounded-[var(--radius-large)] border border-[var(--border-strong)]">
          <MapCanvas points={points} />
        </div>
      )}

      {points.length > 0 ? (
        <Card className="flex flex-col gap-2">
          {[...points]
            .sort((first, second) => (second.averageScore ?? 0) - (first.averageScore ?? 0))
            .map((point) => (
              <div key={point.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  {point.name}
                  <span className="ml-2 text-xs text-[var(--muted)]">
                    {point.neighborhood ?? ''} · {point.visitCount}x
                  </span>
                </span>
                <span
                  className="shrink-0 tabular-nums"
                  style={{ color: colorForScore(point.averageScore) }}
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
