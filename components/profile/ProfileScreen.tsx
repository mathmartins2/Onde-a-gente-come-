'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, TextInput } from '@/components/ui/Field'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'
import {
  changePasswordSchema,
  setPinSchema,
  type ChangePasswordValues,
  type SetPinValues,
} from '@/lib/validation/schemas'

type Nomination = {
  id: string
  restaurantName: string
  neighborhood: string | null
  cuisines: string[]
}

const PasswordCard = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) })

  const mutation = useMutation({
    mutationFn: (values: ChangePasswordValues) => apiClient.post('/auth/password', values),
    onSuccess: () => {
      toast.success('Senha alterada')
      reset()
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível trocar a senha')),
  })

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Trocar senha</h2>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-3">
        <Field label="Senha atual" error={errors.currentPassword?.message}>
          <TextInput type="password" autoComplete="current-password" {...register('currentPassword')} />
        </Field>
        <Field label="Nova senha" error={errors.newPassword?.message}>
          <TextInput type="password" autoComplete="new-password" {...register('newPassword')} />
        </Field>
        <Field label="Confirmar nova senha" error={errors.confirmPassword?.message}>
          <TextInput type="password" autoComplete="new-password" {...register('confirmPassword')} />
        </Field>
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          Salvar senha
        </Button>
      </form>
    </Card>
  )
}

const PinCard = ({ hasRatingPin }: { hasRatingPin: boolean }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SetPinValues>({ resolver: zodResolver(setPinSchema) })

  const mutation = useMutation({
    mutationFn: (values: SetPinValues) => apiClient.post('/auth/pin', values),
    onSuccess: () => {
      toast.success('PIN definido')
      reset()
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível salvar o PIN')),
  })

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">PIN de votação</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          4 dígitos, só usados quando o celular passa na mesa. {hasRatingPin ? 'Você já tem um.' : 'Você ainda não tem um.'}
        </p>
      </div>

      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="PIN" error={errors.pin?.message}>
            <TextInput inputMode="numeric" maxLength={4} placeholder="0000" {...register('pin')} />
          </Field>
          <Field label="Confirmar" error={errors.confirmPin?.message}>
            <TextInput inputMode="numeric" maxLength={4} placeholder="0000" {...register('confirmPin')} />
          </Field>
        </div>
        <Field label="Sua senha" error={errors.password?.message}>
          <TextInput type="password" autoComplete="current-password" {...register('password')} />
        </Field>
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          Salvar PIN
        </Button>
      </form>
    </Card>
  )
}

export const ProfileScreen = ({
  displayName,
  hasRatingPin,
}: {
  displayName: string
  hasRatingPin: boolean
}) => {
  const queryClient = useQueryClient()

  const nominationsQuery = useQuery({
    queryKey: ['nominations'],
    queryFn: async () => {
      const response = await apiClient.get<{ nominations: Nomination[] }>('/nominations')
      return response.data.nominations
    },
  })

  const removeMutation = useMutation({
    mutationFn: (nominationId: string) => apiClient.delete(`/nominations/${nominationId}`),
    onSuccess: () => {
      toast.success('Indicação removida')
      queryClient.invalidateQueries({ queryKey: ['nominations'] })
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível remover')),
  })

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold">{displayName}</h1>

      <Card className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Minhas indicações</h2>
        {(nominationsQuery.data ?? []).length === 0 ? (
          <p className="text-xs text-[var(--muted)]">
            Você não indicou nada — sem indicação você fica fora do sorteio.
          </p>
        ) : null}

        {(nominationsQuery.data ?? []).map((nomination) => (
          <div key={nomination.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm">{nomination.restaurantName}</p>
              <p className="truncate text-xs text-[var(--muted)]">
                {[nomination.cuisines.join(', ') || null, nomination.neighborhood]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="small"
              onClick={() => removeMutation.mutate(nomination.id)}
              disabled={removeMutation.isPending}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </Card>

      <PinCard hasRatingPin={hasRatingPin} />
      <PasswordCard />
    </div>
  )
}
