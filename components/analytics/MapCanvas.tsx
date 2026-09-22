'use client'

import { useEffect, useRef, useState } from 'react'
import { Map as MapLibreMap, Marker, NavigationControl, Popup, type StyleSpecification } from 'maplibre-gl'
import { palette, withAlpha } from '@/lib/theme/palette'
import { colorForScore, type MapPoint } from './VisitedMap'

const vectorStyleUrl = 'https://tiles.openfreemap.org/styles/dark'
const recifeCenter: [number, number] = [-34.89, -8.06]
const initialZoom = 11.5

const rasterFallbackStyle: StyleSpecification = {
  version: 8,
  sources: {
    openstreetmap: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap',
    },
  },
  layers: [
    {
      id: 'openstreetmap',
      type: 'raster',
      source: 'openstreetmap',
      paint: { 'raster-saturation': -0.7, 'raster-brightness-max': 0.7 },
    },
  ],
}

const buildPinElement = (point: MapPoint) => {
  const color = colorForScore(point.averageScore)
  const label = point.averageScore === null ? '—' : point.averageScore.toFixed(1)

  const wrapper = document.createElement('div')
  wrapper.style.cssText =
    'display:flex;flex-direction:column;align-items:center;gap:2px;white-space:nowrap;cursor:pointer'

  const chip = document.createElement('span')
  chip.style.cssText = `font-family:ui-monospace,monospace;font-size:10px;font-weight:700;letter-spacing:0.02em;color:${palette.ink};background:${withAlpha(palette.surface, 0.94)};border:1px solid ${color};border-radius:999px;padding:2px 7px`
  chip.textContent = point.name

  const score = document.createElement('span')
  score.style.cssText = `color:${color};margin-left:5px`
  score.textContent = label
  chip.appendChild(score)

  const dot = document.createElement('span')
  dot.style.cssText = `width:11px;height:11px;border-radius:999px;background:${color};border:2px solid ${withAlpha(palette.surface, 0.94)};box-shadow:0 0 0 2px ${color}44`

  wrapper.append(chip, dot)
  return wrapper
}

export const MapCanvas = ({ points }: { points: MapPoint[] }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasFailed, setHasFailed] = useState(false)
  const [isUsingFallback, setIsUsingFallback] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const map = new MapLibreMap({
      container,
      style: vectorStyleUrl,
      center: recifeCenter,
      zoom: initialZoom,
      attributionControl: { compact: true },
    })

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')

    const markers = points.map((point) =>
      new Marker({ element: buildPinElement(point), anchor: 'bottom' })
        .setLngLat([point.longitude, point.latitude])
        .setPopup(
          new Popup({ offset: 18, closeButton: false }).setText(
            `${point.name} · ${point.visitCount}x${
              point.averageScore === null ? '' : ` · nota ${point.averageScore.toFixed(2)}`
            }`,
          ),
        )
        .addTo(map),
    )

    const handleError = () => {
      setIsUsingFallback((alreadyFallenBack) => {
        if (alreadyFallenBack) {
          setHasFailed(true)
          return alreadyFallenBack
        }
        map.setStyle(rasterFallbackStyle)
        return true
      })
    }

    map.on('error', handleError)
    map.once('load', () => map.resize())

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      markers.forEach((marker) => marker.remove())
      map.remove()
    }
  }, [points])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full bg-canvas" />

      {isUsingFallback && !hasFailed ? (
        <p className="absolute inset-x-0 top-0 bg-[color-mix(in_srgb,var(--warning)_18%,var(--canvas))] px-3 py-1.5 text-caption text-ink">
          O mapa detalhado não respondeu — mostrando a versão simples.
        </p>
      ) : null}

      {hasFailed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-canvas px-6 text-center">
          <p className="text-heading-md">O mapa não carregou</p>
          <p className="text-body-sm text-ink-muted">
            O serviço de mapas não respondeu. A lista de lugares abaixo continua valendo.
          </p>
        </div>
      ) : null}
    </div>
  )
}
