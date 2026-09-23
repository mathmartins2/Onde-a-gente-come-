'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'

export type ImageUploadTarget = {
  uploadPath: string
  uploadMethod?: 'put' | 'post'
  onUploaded: () => void
}

export const useImageUpload = ({ uploadPath, uploadMethod = 'put', onUploaded }: ImageUploadTarget) =>
  useMutation({
    mutationFn: async (image: Blob) => {
      const formData = new FormData()
      formData.append('image', image, 'upload.jpg')
      await apiClient.request({
        url: uploadPath,
        method: uploadMethod,
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      toast.success('Foto salva')
      onUploaded()
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível salvar a foto')),
  })
