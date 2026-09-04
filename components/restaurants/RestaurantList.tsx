'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'
import { RestaurantForm, type EditableRestaurant } from './RestaurantForm'

type Restaurant = EditableRestaurant & { createdBy: string | null; createdByName: string | null }

export const RestaurantList = () => {
  const queryClient = useQueryClient()
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null)

  const restaurantsQuery = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const response = await apiClient.get<{ restaurants: Restaurant[] }>('/restaurants')
      return response.data.restaurants
    },
  })

  const closeEditor = () => {
    setEditingRestaurantId(null)
    queryClient.invalidateQueries({ queryKey: ['restaurants'] })
  }

  if (restaurantsQuery.isLoading) {
    return <p className="text-sm text-[var(--muted)]">Carregando...</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {(restaurantsQuery.data ?? []).map((restaurant) => {
        const isEditing = editingRestaurantId === restaurant.id
        const suggestedBy = restaurant.createdByName

        if (isEditing) {
          return (
            <div key={restaurant.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                  editando {restaurant.name}
                </span>
                <Button variant="ghost" size="small" onClick={() => setEditingRestaurantId(null)}>
                  <X size={14} />
                </Button>
              </div>
              <RestaurantForm restaurant={restaurant} onCreated={closeEditor} />
            </div>
          )
        }

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
              {suggestedBy ? (
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                  indicado por {suggestedBy}
                </p>
              ) : null}
            </div>

            <Button
              variant="secondary"
              size="small"
              onClick={() => setEditingRestaurantId(restaurant.id)}
            >
              <Pencil size={14} />
              editar
            </Button>
          </Card>
        )
      })}
    </div>
  )
}
