'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { fetchStoryFile, shareStoryFile } from '@/lib/share/shareStoryImage'

export const ShareStoryButton = ({
  imagePath,
  fileName,
  label = 'Postar nos stories',
  variant = 'primary',
  className,
}: {
  imagePath: string
  fileName: string
  label?: string
  variant?: 'primary' | 'secondary'
  className?: string
}) => {
  const storyFileQuery = useQuery({
    queryKey: ['story-image', imagePath],
    queryFn: () => fetchStoryFile(imagePath, fileName),
    staleTime: 60_000,
    retry: 1,
  })

  const shareMutation = useMutation({
    mutationFn: async () => shareStoryFile(storyFileQuery.data ?? (await fetchStoryFile(imagePath, fileName))),
    onSuccess: (outcome) => {
      if (outcome === 'downloaded') toast.success('Imagem baixada. É só postar nos stories.')
    },
    onError: () => toast.error('Não consegui compartilhar a imagem agora'),
  })

  const isPreparing = storyFileQuery.isLoading || shareMutation.isPending

  return (
    <Button
      type="button"
      variant={variant}
      disabled={isPreparing}
      onClick={() => shareMutation.mutate()}
      className={className}
    >
      <Share2 size={17} />
      {isPreparing ? 'Preparando imagem…' : label}
    </Button>
  )
}
