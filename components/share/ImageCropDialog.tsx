'use client'

import { X, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Cropper, { type Area, type Point } from 'react-easy-crop'
import { Button } from '@/components/ui/Button'
import { cropImageInBrowser } from '@/lib/images/cropImageInBrowser'
import { palette } from '@/lib/theme/palette'

const minimumZoom = 0.5
const maximumZoom = 4
const zoomStep = 0.01
const initialCropPosition: Point = { x: 0, y: 0 }

export type CropShape = 'rect' | 'round'

type ImageCropDialogProps = {
  imageUrl: string
  title: string
  cropShape?: CropShape
  isSaving: boolean
  onCancel: () => void
  onConfirm: (croppedImage: Blob) => void
}

export const ImageCropDialog = ({
  imageUrl,
  title,
  cropShape = 'rect',
  isSaving,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) => {
  const [cropPosition, setCropPosition] = useState<Point>(initialCropPosition)
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCancel])

  const confirmCrop = async () => {
    if (!croppedArea) return
    setIsCropping(true)
    try {
      onConfirm(await cropImageInBrowser(imageUrl, croppedArea, palette.canvas))
    } finally {
      setIsCropping(false)
    }
  }

  const isBusy = isSaving || isCropping

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-crop-title"
      className="scheme-dark fixed inset-0 z-[80] flex flex-col bg-[color-mix(in_srgb,var(--canvas-deep)_96%,transparent)] text-ink backdrop-blur-sm"
    >
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div>
          <h2 id="image-crop-title" className="text-heading-md">
            {title}
          </h2>
          <p className="text-caption">Arraste pra enquadrar e use o zoom.</p>
        </div>
        <button
          type="button"
          aria-label="Cancelar ajuste"
          onClick={onCancel}
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-surface-2 hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative mx-auto mt-4 aspect-square w-full max-w-md flex-none overflow-hidden bg-canvas">
        <Cropper
          image={imageUrl}
          crop={cropPosition}
          zoom={zoom}
          minZoom={minimumZoom}
          maxZoom={maximumZoom}
          aspect={1}
          cropShape={cropShape}
          restrictPosition={false}
          showGrid
          onCropChange={setCropPosition}
          onZoomChange={setZoom}
          onCropComplete={(_area, areaInPixels) => setCroppedArea(areaInPixels)}
        />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
        <label className="flex items-center gap-3">
          <ZoomOut size={16} className="shrink-0 text-ink-muted" aria-hidden />
          <span className="sr-only">Zoom</span>
          <input
            type="range"
            min={minimumZoom}
            max={maximumZoom}
            step={zoomStep}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="h-2 w-full cursor-pointer accent-[var(--accent)]"
          />
          <ZoomIn size={16} className="shrink-0 text-ink-muted" aria-hidden />
        </label>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={isBusy}>
            Cancelar
          </Button>
          <Button
            autoFocus
            type="button"
            className="flex-1"
            onClick={confirmCrop}
            disabled={isBusy || !croppedArea}
          >
            {isBusy ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
