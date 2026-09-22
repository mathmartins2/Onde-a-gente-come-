'use client'

import { useMutation } from '@tanstack/react-query'
import { Camera } from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'
import { downscaleImageInBrowser } from '@/lib/images/downscaleImageInBrowser'

export const ImagePicker = ({
  uploadPath,
  label,
  onUploaded,
}: {
  uploadPath: string
  label: string
  onUploaded: () => void
}) => {
  const fileInputReference = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('image', await downscaleImageInBrowser(file), 'upload.jpg')
      await apiClient.put(uploadPath, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      toast.success('Foto salva')
      onUploaded()
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível salvar a foto')),
  })

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.item(0)
    event.target.value = ''
    if (selectedFile) uploadMutation.mutate(selectedFile)
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
        disabled={uploadMutation.isPending}
        onClick={() => fileInputReference.current?.click()}
      >
        <Camera size={15} />
        {uploadMutation.isPending ? 'Enviando…' : label}
      </Button>
    </>
  )
}
