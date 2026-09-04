'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { ExternalLink, Link2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, TextInput } from '@/components/ui/Field'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'
import { buildGoogleMapsUrl } from '@/lib/places/buildGoogleMapsUrl'
import { canonicalCuisines } from '@/lib/places/normalizeCuisines'
import {
  restaurantSchema,
  type RestaurantFormValues,
  type RestaurantInput,
} from '@/lib/validation/schemas'

type PlaceCandidate = {
  name: string
  address: string | null
  neighborhood: string | null
  city: string | null
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  cuisines: string[]
  phone: string | null
  website: string | null
  source: string
  reference: string | null
}

const minimumSearchTermLength = 3
const minimumMapsLinkLength = 10

const readFieldValue = (form: HTMLFormElement, fieldName: string) =>
  String(new FormData(form).get(fieldName) ?? '').trim()

const sourceLabels: Record<string, string> = {
  nominatim: 'OpenStreetMap',
  overpass: 'Overpass',
  photon: 'Photon',
  'google-maps-link': 'Link do Maps',
}

export type EditableRestaurant = {
  id: string
  name: string
  address: string | null
  neighborhood: string | null
  city: string | null
  postalCode: string | null
  cuisines: string[]
  phone: string | null
  website: string | null
  latitude: string | null
  longitude: string | null
}

type RestaurantFormProps = {
  onCreated: () => void
  restaurant?: EditableRestaurant
}

export const RestaurantForm = ({ onCreated, restaurant }: RestaurantFormProps) => {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RestaurantFormValues, unknown, RestaurantInput>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: restaurant
      ? {
          name: restaurant.name,
          address: restaurant.address ?? '',
          neighborhood: restaurant.neighborhood ?? '',
          city: restaurant.city ?? '',
          postalCode: restaurant.postalCode ?? '',
          cuisines: restaurant.cuisines,
          phone: restaurant.phone ?? '',
          website: restaurant.website ?? '',
          latitude: restaurant.latitude === null ? null : Number(restaurant.latitude),
          longitude: restaurant.longitude === null ? null : Number(restaurant.longitude),
        }
      : { name: '', cuisines: [] },
  })

  const cuisines = watch('cuisines') ?? []

  const searchMutation = useMutation({
    mutationFn: async (term: string) => {
      const response = await apiClient.get<{ candidates: PlaceCandidate[] }>('/places/search', {
        params: { term },
      })
      return response.data.candidates
    },
    onSuccess: (found) => {
      if (found.length === 0) toast.info('Não achei no mapa. Cole o link do Maps ou digite à mão.')
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Busca falhou')),
  })

  const applyCandidate = (candidate: PlaceCandidate) => {
    setValue('name', candidate.name)
    setValue('address', candidate.address ?? '')
    setValue('neighborhood', candidate.neighborhood ?? '')
    setValue('city', candidate.city ?? '')
    setValue('postalCode', candidate.postalCode ?? '')
    setValue('phone', candidate.phone ?? '')
    setValue('website', candidate.website ?? '')
    setValue('latitude', candidate.latitude)
    setValue('longitude', candidate.longitude)
    setValue('cuisines', candidate.cuisines)
    setValue('placeSource', candidate.source)
    setValue('placeReference', candidate.reference ?? '')
    searchMutation.reset()
    toast.success('Dados preenchidos. Confira antes de salvar.')
  }

  const linkMutation = useMutation({
    mutationFn: async (link: string) => {
      const response = await apiClient.post<{ candidate: PlaceCandidate }>('/places/link', { link })
      return response.data.candidate
    },
    onSuccess: (candidate) => applyCandidate(candidate),
    onError: (error) => toast.error(extractErrorMessage(error, 'Não consegui ler esse link')),
  })

  const candidates = searchMutation.data ?? []

  const searchPlaces = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const term = readFieldValue(event.currentTarget, 'searchTerm')
    if (term.length < minimumSearchTermLength) return
    searchMutation.mutate(term)
  }

  const readPlaceFromLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const link = readFieldValue(event.currentTarget, 'mapsLink')
    if (link.length < minimumMapsLinkLength) return
    linkMutation.mutate(link)
  }

  const createMutation = useMutation({
    mutationFn: (values: RestaurantInput) =>
      restaurant
        ? apiClient.put(`/restaurants/${restaurant.id}`, values)
        : apiClient.post('/restaurants', values),
    onSuccess: (response) => {
      if (response.data.isOutsideRegion) {
        toast.warning('Esse lugar está fora de Recife, Jaboatão e Olinda — salvei mesmo assim.')
      }
      toast.success(restaurant ? 'Restaurante atualizado' : 'Restaurante cadastrado')
      if (!restaurant) reset({ name: '', cuisines: [] })
      queryClient.invalidateQueries({ queryKey: ['restaurants'] })
      onCreated()
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível salvar')),
  })

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          Buscar no mapa
        </p>
        <form className="flex gap-2" onSubmit={searchPlaces}>
          <TextInput
            className="flex-1"
            name="searchTerm"
            placeholder="nome do restaurante"
            minLength={minimumSearchTermLength}
            required
          />
          <Button type="submit" variant="secondary" disabled={searchMutation.isPending}>
            <Search size={16} />
          </Button>
        </form>

        <form className="flex gap-2" onSubmit={readPlaceFromLink}>
          <TextInput
            className="flex-1"
            name="mapsLink"
            placeholder="ou cole o link do Google Maps"
            minLength={minimumMapsLinkLength}
            required
          />
          <Button type="submit" variant="secondary" disabled={linkMutation.isPending}>
            <Link2 size={16} />
          </Button>
        </form>

        {candidates.length > 0 ? (
          <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--border)] p-2">
            <p className="px-1 text-xs text-[var(--muted)]">É algum destes?</p>
            {candidates.map((candidate, index) => (
              <div
                key={`${candidate.source}-${index}`}
                className="flex items-center gap-2 rounded-lg transition-colors hover:bg-[var(--surface-raised)]"
              >
                <button
                  onClick={() => applyCandidate(candidate)}
                  className="min-w-0 flex-1 px-2.5 py-2 text-left"
                >
                  <p className="truncate text-sm">{candidate.name}</p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {[candidate.address, candidate.neighborhood, candidate.city]
                      .filter(Boolean)
                      .join(' · ') || 'sem endereço'}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase text-[var(--muted)]">
                    {sourceLabels[candidate.source] ?? candidate.source}
                    {candidate.cuisines.length > 0 ? ` · ${candidate.cuisines.join(', ')}` : ''}
                  </p>
                </button>

                <a
                  href={buildGoogleMapsUrl(candidate)}
                  target="_blank"
                  rel="noreferrer noopener"
                  title="Abrir no Google Maps"
                  className="mr-1.5 shrink-0 rounded-lg p-2 text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit((values) => createMutation.mutate(values))}
        className="flex flex-col gap-3"
      >
        <Field label="Nome" error={errors.name?.message}>
          <TextInput placeholder="Ruffo Recife" {...register('name')} />
        </Field>

        <Field label="Endereço" error={errors.address?.message}>
          <TextInput placeholder="Rua, número" {...register('address')} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Bairro">
            <TextInput placeholder="Ilha do Leite" {...register('neighborhood')} />
          </Field>
          <Field label="Cidade">
            <TextInput placeholder="Recife" {...register('city')} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone">
            <TextInput placeholder="(81) 0000-0000" {...register('phone')} />
          </Field>
          <Field label="Site" error={errors.website?.message}>
            <TextInput placeholder="https://" {...register('website')} />
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Tipo de comida
          </span>
          <p className="text-xs text-[var(--muted)]">
            Toque pra marcar. Dá pra escolher mais de um.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {canonicalCuisines.map((cuisine) => {
              const isSelected = cuisines.includes(cuisine)

              return (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() =>
                    setValue(
                      'cuisines',
                      isSelected
                        ? cuisines.filter((entry) => entry !== cuisine)
                        : [...cuisines, cuisine],
                      { shouldDirty: true },
                    )
                  }
                  className={
                    isSelected
                      ? 'rounded-[var(--radius-pill)] border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-black'
                      : 'rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--foreground)]'
                  }
                >
                  {cuisine}
                </button>
              )
            })}
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting || createMutation.isPending} className="mt-1">
          {restaurant ? 'Salvar alterações' : 'Cadastrar restaurante'}
        </Button>
      </form>
    </Card>
  )
}
