'use client'

import { useQuery } from '@tanstack/react-query'
import { Clapperboard, Image as ImageIcon } from 'lucide-react'
import { CopyLinkButton } from '@/components/share/CopyLinkButton'
import { ShareStoryButton } from '@/components/share/ShareStoryButton'
import { apiClient } from '@/lib/http/apiClient'
import { createVisitRestaurantPublicLink } from '@/lib/http/publicLinkQueries'
import { dishPhotosQueryKey } from '@/lib/http/useVisitStream'

export const StoryShareBar = ({ visitId }: { visitId: string }) => {
  const dishPhotosQuery = useQuery({
    queryKey: dishPhotosQueryKey(visitId),
    queryFn: async () => {
      const response = await apiClient.get<{ photos: unknown[]; maximumPerMember: number }>(`/visits/${visitId}/dish-photos`)
      return response.data
    },
  })
  const hasDishPhotos = (dishPhotosQuery.data?.photos.length ?? 0) > 0
  const storyPath = `/api/visits/${visitId}/story`

  return (
    <div className="flex items-center justify-end gap-2">
      <span className="mr-auto text-micro-cap text-ink-faint">postar nos stories</span>
      <ShareStoryButton imagePath={storyPath} fileName="nota-da-mesa.png" label="Imagem do story" icon={ImageIcon} isCompact />
      {hasDishPhotos ? (
        <ShareStoryButton
          imagePath={`${storyPath}/video`}
          fileName="nota-da-mesa.mp4"
          label="Vídeo do story"
          preparingLabel="Preparando vídeo…"
          icon={Clapperboard}
          isCompact
        />
      ) : null}
      <CopyLinkButton
        loadPath={() => createVisitRestaurantPublicLink(visitId)}
        label="Copiar link saiba mais"
        successMessage="Link copiado. Cola no sticker de link do story."
        isCompact
      />
    </div>
  )
}
