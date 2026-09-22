'use client'

import { Clapperboard, Image as ImageIcon } from 'lucide-react'
import { CopyLinkButton } from '@/components/share/CopyLinkButton'
import { ShareStoryButton } from '@/components/share/ShareStoryButton'
import { createVisitRestaurantPublicLink } from '@/lib/http/publicLinkQueries'

export const StoryShareBar = ({ visitId }: { visitId: string }) => {
  const storyPath = `/api/visits/${visitId}/story`

  return (
    <div className="flex items-center justify-end gap-2">
      <span className="mr-auto text-micro-cap text-ink-faint">postar nos stories</span>
      <ShareStoryButton imagePath={storyPath} fileName="nota-da-mesa.png" label="Imagem do story" icon={ImageIcon} isCompact />
      <ShareStoryButton
        imagePath={`${storyPath}/video`}
        fileName="nota-da-mesa.mp4"
        label="Vídeo do story"
        preparingLabel="Gerando vídeo…"
        icon={Clapperboard}
        isCompact
        shouldPrefetch={false}
        progressPath={`${storyPath}/video/status`}
      />
      <CopyLinkButton
        loadPath={() => createVisitRestaurantPublicLink(visitId)}
        label="Copiar link saiba mais"
        successMessage="Link copiado. Cola no sticker de link do story."
        isCompact
      />
    </div>
  )
}
