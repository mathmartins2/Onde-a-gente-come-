'use client'

import { Crop } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { classNames } from '@/lib/utilities/classNames'
import type { CropShape } from './ImageCropDialog'
import { LazyImageCropDialog } from './LazyImageCropDialog'
import { useImageUpload, type ImageUploadTarget } from './useImageUpload'

type ImageAdjustButtonProps = ImageUploadTarget & {
  imageUrl: string
  cropShape?: CropShape
  isIconOnly?: boolean
  className?: string
}

export const ImageAdjustButton = ({
  imageUrl,
  uploadPath,
  uploadMethod = 'put',
  onUploaded,
  cropShape = 'rect',
  isIconOnly = false,
  className,
}: ImageAdjustButtonProps) => {
  const [isAdjusting, setIsAdjusting] = useState(false)
  const uploadMutation = useImageUpload({
    uploadPath,
    uploadMethod,
    onUploaded: () => {
      setIsAdjusting(false)
      onUploaded()
    },
  })

  return (
    <>
      {isIconOnly ? (
        <button
          type="button"
          aria-label="Ajustar foto"
          onClick={() => setIsAdjusting(true)}
          className={classNames('flex items-center justify-center rounded-full text-ink hover:text-accent', className)}
        >
          <Crop size={13} />
        </button>
      ) : (
        <Button type="button" variant="ghost" size="small" onClick={() => setIsAdjusting(true)} className={className}>
          <Crop size={15} />
          Ajustar
        </Button>
      )}
      {isAdjusting ? (
        <LazyImageCropDialog
          imageUrl={imageUrl}
          title="Ajustar foto"
          cropShape={cropShape}
          isSaving={uploadMutation.isPending}
          onCancel={() => setIsAdjusting(false)}
          onConfirm={(croppedImage) => uploadMutation.mutate(croppedImage)}
        />
      ) : null}
    </>
  )
}
