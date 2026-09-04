'use client'

import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/Card'
import { apiClient } from '@/lib/http/apiClient'
import 'leaflet/dist/leaflet.css'

const MapContainer = dynamic(() => import('react-leaflet').then((module) => module.MapContainer), {
  ssr: false,
})
const TileLayer = dynamic(() => import('react-leaflet').then((module) => module.TileLayer), {
  ssr: false,
})
const CircleMarker = dynamic(() => import('react-leaflet').then((module) => module.CircleMarker), {
  ssr: false,
})
const Popup = dynamic(() => import('react-leaflet').then((module) => module.Popup), { ssr: false })

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

const colorForScore = (score: number | null) => {
  if (score === null) return '#9a9aae'
  if (score >= 4.5) return '#4ade80'
  if (score >= 3.5) return '#fbbf24'
  return '#f87171'
}

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
        <p className="mt-1 text-xs text-[var(--muted)]">
          Cor do pino é a nota: verde bom, amarelo mediano, vermelho ruim.
        </p>
      </div>

      {points.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            Nenhum lugar visitado tem coordenada ainda. Cadastre pela busca no mapa que as
            coordenadas vêm junto.
          </p>
        </Card>
      ) : (
        <div className="h-[420px] overflow-hidden rounded-2xl border border-[var(--border)]">
          <MapContainer
            center={[-8.0578, -34.8829]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.map((point) => (
              <CircleMarker
                key={point.id}
                center={[point.latitude, point.longitude]}
                radius={10}
                pathOptions={{
                  color: colorForScore(point.averageScore),
                  fillColor: colorForScore(point.averageScore),
                  fillOpacity: 0.7,
                }}
              >
                <Popup>
                  <strong>{point.name}</strong>
                  <br />
                  {point.visitCount}x
                  {point.averageScore !== null ? ` · nota ${point.averageScore.toFixed(1)}` : ''}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  )
}
