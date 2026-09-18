'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ExternalLink, MapPin, Pencil, UtensilsCrossed, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiClient } from '@/lib/http/apiClient'
import { buildGoogleMapsUrl } from '@/lib/places/buildGoogleMapsUrl'
import { RestaurantForm, type EditableRestaurant } from './RestaurantForm'

type Restaurant = EditableRestaurant & {
  createdBy: string | null
  createdByName: string | null
  isMine: boolean
}

export const RestaurantList = () => {
  const queryClient = useQueryClient()
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null)

  const restaurantsQuery = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const response = await apiClient.get<{
        restaurants: Restaurant[]
        authorshipHidden: boolean
      }>('/restaurants')
      return response.data
    },
  })

  const closeEditor = () => {
    setEditingRestaurantId(null)
    queryClient.invalidateQueries({ queryKey: ['restaurants'] })
  }

  if (restaurantsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">
        {[0, 1, 2, 3].map((placeholder) => (
          <Skeleton key={placeholder} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const restaurants = restaurantsQuery.data?.restaurants ?? []
  const authorshipHidden = restaurantsQuery.data?.authorshipHidden ?? false

  if (restaurants.length === 0) {
    return (
      <Card>
        <EmptyState
          glyph="🍴"
          title="Nenhum lugar cadastrado"
          description="Cadastre o primeiro pra ele poder entrar no sorteio."
        />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {authorshipHidden ? (
        <p className="px-1 text-micro-cap text-ink-faint">
          quem indicou está escondido enquanto a rodada estiver aberta
        </p>
      ) : null}

      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3">
        {restaurants.map((restaurant) => {
          const isEditing = editingRestaurantId === restaurant.id
          const suggestedBy = restaurant.createdByName
          const location = [restaurant.neighborhood, restaurant.address]
            .filter(Boolean)
            .join(' · ')

          if (isEditing) {
            return (
              <div key={restaurant.id} className="flex flex-col gap-2 lg:col-span-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-micro-cap text-accent">editando {restaurant.name}</span>
                  <Button variant="ghost" size="small" onClick={() => setEditingRestaurantId(null)}>
                    <X size={14} />
                  </Button>
                </div>
                <RestaurantForm restaurant={restaurant} onCreated={closeEditor} />
              </div>
            )
          }

          return (
            <Card key={restaurant.id} className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-tint">
                  <UtensilsCrossed size={17} className="text-accent" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-heading-sm">{restaurant.name}</p>
                  {location ? (
                    <p className="mt-0.5 flex items-center gap-1 text-caption">
                      <MapPin size={11} className="shrink-0" />
                      <span className="truncate">{location}</span>
                    </p>
                  ) : null}
                </div>

                {authorshipHidden && restaurant.isMine ? (
                  <Badge tone="accent" size="small">
                    seu
                  </Badge>
                ) : null}
              </div>

              {restaurant.cuisines.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {restaurant.cuisines.map((cuisine) => (
                    <Badge key={cuisine} tone="neutral" size="small">
                      {cuisine}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 border-t border-hairline pt-3">
                <span className="min-w-0 truncate text-micro-cap text-ink-faint">
                  {suggestedBy ? `indicado por ${suggestedBy}` : 'sem indicação'}
                </span>

                <span className="flex shrink-0 items-center gap-1">
                  <a
                    href={buildGoogleMapsUrl(restaurant)}
                    target="_blank"
                    rel="noreferrer noopener"
                    title="Abrir no Google Maps"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-accent"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    title={`Editar ${restaurant.name}`}
                    onClick={() => setEditingRestaurantId(restaurant.id)}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-accent"
                  >
                    <Pencil size={15} />
                  </button>
                </span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
