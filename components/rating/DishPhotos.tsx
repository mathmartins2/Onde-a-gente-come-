'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'
import { ImagePicker } from '@/components/share/ImagePicker'
import { Card } from '@/components/ui/Card'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'
import { storedImageLoader } from '@/lib/images/storedImageLoader'
import { useDragToScroll } from '@/lib/interaction/useDragToScroll'
import { dishPhotosQueryKey } from '@/lib/http/useVisitStream'

type DishPhoto = {
  id: string
  imageUrl: string
  addedByMemberId: string
  addedByName: string
}

const fallbackRefreshIntervalInMilliseconds = 30_000

export const DishPhotos = ({ visitId, currentMemberId }: { visitId: string; currentMemberId: string }) => {
  const queryClient = useQueryClient()
  const queryKey = dishPhotosQueryKey(visitId)
  const [openPhotoIndex, setOpenPhotoIndex] = useState<number | null>(null)
  const dragToScroll = useDragToScroll<HTMLUListElement>()

  const photosQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<{ photos: DishPhoto[]; maximumPerMember: number }>(`/visits/${visitId}/dish-photos`)
      return response.data
    },
    refetchInterval: fallbackRefreshIntervalInMilliseconds,
  })

  const refreshPhotos = () => queryClient.invalidateQueries({ queryKey })

  const removeMutation = useMutation({
    mutationFn: (photoId: string) => apiClient.delete(`/visits/${visitId}/dish-photos/${photoId}`),
    onSuccess: refreshPhotos,
    onError: (error) => toast.error(extractErrorMessage(error, 'Não consegui apagar a foto')),
  })

  const photos = photosQuery.data?.photos ?? []
  const maximumPerMember = photosQuery.data?.maximumPerMember ?? 0
  const ownPhotoCount = photos.filter((photo) => photo.addedByMemberId === currentMemberId).length
  const hasReachedLimit = photosQuery.isSuccess && ownPhotoCount >= maximumPerMember

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-heading-sm">
            Fotos dos pratos
            {photos.length > 0 ? <span className="ml-2 text-caption text-ink-faint">{photos.length}</span> : null}
          </p>
          <div className="shrink-0 whitespace-nowrap">
            <ImagePicker
              uploadPath={`/visits/${visitId}/dish-photos`}
              uploadMethod="post"
              label={hasReachedLimit ? `${ownPhotoCount} de ${maximumPerMember}` : 'Adicionar foto'}
              isDisabled={hasReachedLimit}
              onUploaded={refreshPhotos}
            />
          </div>
        </div>
        <p className="text-caption">
          Cada um manda até {maximumPerMember || 3}. Elas entram no story, no histórico e no rewind.
        </p>
      </div>

      {photosQuery.isLoading ? <Skeleton className="h-24 w-full sm:h-28" /> : null}

      {photos.length > 0 ? (
        <ul
          {...dragToScroll}
          className="group -mx-1 flex cursor-grab gap-2 overflow-x-auto px-1 pb-1 select-none [scrollbar-width:thin] active:cursor-grabbing"
        >
          {photos.map((photo, photoIndex) => (
            <li
              key={photo.id}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-hairline bg-surface-sunken transition-transform duration-200 ease-out group-data-[motion=backward]:rotate-3 group-data-[motion=forward]:-rotate-3 group-data-[motion]:scale-95 sm:h-28 sm:w-28"
            >
              <button
                type="button"
                aria-label={`Ver foto de ${photo.addedByName} em tela cheia`}
                onClick={() => setOpenPhotoIndex(photoIndex)}
                className="absolute inset-0"
              >
                <Image
                  loader={storedImageLoader}
                  src={photo.imageUrl}
                  alt={`Prato fotografado por ${photo.addedByName}`}
                  fill
                  sizes="112px"
                  draggable={false}
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </button>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-[linear-gradient(0deg,color-mix(in_srgb,var(--canvas)_85%,transparent),transparent)] px-1.5 pb-1 pt-3 text-[0.6875rem] text-ink">
                {photo.addedByName}
              </span>
              {photo.addedByMemberId === currentMemberId ? (
                <button
                  type="button"
                  aria-label="Apagar foto"
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate(photo.id)}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--canvas)_75%,transparent)] text-ink hover:text-accent"
                >
                  <X size={13} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <PhotoLightbox
        photos={photos.map((photo) => ({ url: photo.imageUrl, caption: `foto de ${photo.addedByName}` }))}
        openIndex={openPhotoIndex}
        onChangeIndex={setOpenPhotoIndex}
        onClose={() => setOpenPhotoIndex(null)}
      />
    </Card>
  )
}
