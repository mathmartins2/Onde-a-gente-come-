'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Globe, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ImagePicker } from '@/components/share/ImagePicker'
import { Button } from '@/components/ui/Button'
import { RestaurantPhoto } from '@/components/ui/RestaurantPhoto'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'

export const RestaurantPhotoEditor = ({
  restaurant,
}: {
  restaurant: { id: string; name: string; website: string | null; photoUrl: string | null }
}) => {
  const queryClient = useQueryClient()
  const photoPath = `/restaurants/${restaurant.id}/photo`
  const refreshPhotos = () => queryClient.invalidateQueries({ queryKey: ['restaurants'] })

  const websiteImportMutation = useMutation({
    mutationFn: () => apiClient.post(`${photoPath}/website`),
    onSuccess: () => {
      toast.success('Peguei a foto do site')
      refreshPhotos()
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não consegui pegar a foto do site')),
  })

  const removalMutation = useMutation({
    mutationFn: () => apiClient.delete(photoPath),
    onSuccess: refreshPhotos,
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível remover a foto')),
  })

  return (
    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-1 p-3">
      <RestaurantPhoto name={restaurant.name} photoUrl={restaurant.photoUrl} className="h-20 w-20" />
      <div className="flex min-w-0 flex-1 flex-wrap gap-2">
        <ImagePicker
          uploadPath={photoPath}
          label={restaurant.photoUrl ? 'Trocar foto' : 'Adicionar foto'}
          onUploaded={refreshPhotos}
        />
        {restaurant.website ? (
          <Button
            type="button"
            variant="ghost"
            size="small"
            disabled={websiteImportMutation.isPending}
            onClick={() => websiteImportMutation.mutate()}
          >
            <Globe size={15} />
            {websiteImportMutation.isPending ? 'Buscando…' : 'Buscar foto do site'}
          </Button>
        ) : null}
        {restaurant.photoUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="small"
            title="Remover foto"
            disabled={removalMutation.isPending}
            onClick={() => removalMutation.mutate()}
          >
            <Trash2 size={15} />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
