'use client'

import { Camera } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import type { CropShape } from './ImageCropDialog'
import { LazyImageCropDialog } from './LazyImageCropDialog'
import { useImageUpload, type ImageUploadTarget } from './useImageUpload'

type ImagePickerProps = ImageUploadTarget & {
  label: string
  cropShape?: CropShape
  isDisabled?: boolean
}

export const ImagePicker = ({
  uploadPath,
  label,
  onUploaded,
  uploadMethod = 'put',
  cropShape = 'rect',
  isDisabled = false,
}: ImagePickerProps) => {
  const fileInputReference = useRef<HTMLInputElement>(null)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)

  const closeCropDialog = () => {
    if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl)
    setSelectedImageUrl(null)
  }

  const uploadMutation = useImageUpload({
    uploadPath,
    uploadMethod,
    onUploaded: () => {
      closeCropDialog()
      onUploaded()
    },
  })

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.item(0)
    event.target.value = ''
    if (selectedFile) setSelectedImageUrl(URL.createObjectURL(selectedFile))
  }

  return (
    <>
      <input
        ref={fileInputReference}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleFileSelected}
      />
      <Button
        type="button"
        variant="secondary"
        size="small"
        disabled={isDisabled || uploadMutation.isPending}
        onClick={() => fileInputReference.current?.click()}
      >
        <Camera size={15} />
        {uploadMutation.isPending ? 'Enviando…' : label}
      </Button>
      {selectedImageUrl ? (
        <LazyImageCropDialog
          imageUrl={selectedImageUrl}
          title="Ajustar foto"
          cropShape={cropShape}
          isSaving={uploadMutation.isPending}
          onCancel={closeCropDialog}
          onConfirm={(croppedImage) => uploadMutation.mutate(croppedImage)}
        />
      ) : null}
    </>
  )
}
