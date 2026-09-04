'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'

type Restaurant = {
  id: string
  name: string
  address: string | null
  neighborhood: string | null
  city: string | null
  cuisines: string[]
  phone: string | null
}

type Nomination = { id: string; restaurantId: string }

export const RestaurantList = () => {
  const queryClient = useQueryClient()

  const restaurantsQuery = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const response = await apiClient.get<{ restaurants: Restaurant[] }>('/restaurants')
      return response.data.restaurants
    },
  })

  const nominationsQuery = useQuery({
    queryKey: ['nominations'],
    queryFn: async () => {
      const response = await apiClient.get<{ nominations: Nomination[] }>('/nominations')
      return response.data.nominations
    },
  })

  const nominateMutation = useMutation({
    mutationFn: (restaurantId: string) => apiClient.post('/nominations', { restaurantId }),
    onSuccess: () => {
      toast.success('Indicado! Entra no próximo sorteio.')
      queryClient.invalidateQueries({ queryKey: ['nominations'] })
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível indicar')),
  })

  const nominatedRestaurantIds = new Set(
    (nominationsQuery.data ?? []).map((nomination) => nomination.restaurantId),
  )

  if (restaurantsQuery.isLoading) {
    return <p className="text-sm text-[var(--muted)]">Carregando...</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {(restaurantsQuery.data ?? []).map((restaurant) => {
        const isNominated = nominatedRestaurantIds.has(restaurant.id)

        return (
          <Card key={restaurant.id} className="flex items-center justify-between gap-3 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{restaurant.name}</p>
              <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                {[
                  restaurant.cuisines.join(', ') || null,
                  restaurant.neighborhood,
                  restaurant.address,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'sem detalhes'}
              </p>
            </div>

            <Button
              variant={isNominated ? 'ghost' : 'secondary'}
              size="small"
              disabled={isNominated || nominateMutation.isPending}
              onClick={() => nominateMutation.mutate(restaurant.id)}
            >
              {isNominated ? 'indicado' : <><Plus size={14} /> indicar</>}
            </Button>
          </Card>
        )
      })}
    </div>
  )
}
