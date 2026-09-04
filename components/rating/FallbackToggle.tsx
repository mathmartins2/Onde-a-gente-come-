'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'

type FallbackToggleProps = {
  visitId: string
  usedFallback: boolean
}

export const FallbackToggle = ({ visitId, usedFallback }: FallbackToggleProps) => {
  const queryClient = useQueryClient()

  const switchMutation = useMutation({
    mutationFn: (nextUsedFallback: boolean) =>
      apiClient.put(`/visits/${visitId}/fallback`, { usedFallback: nextUsedFallback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rating-session', visitId] })
      queryClient.invalidateQueries({ queryKey: ['pending-ratings'] })
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível trocar')),
  })

  return (
    <Card className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">onde vocês foram</p>
      <div className="flex gap-2">
        <Button
          variant={usedFallback ? 'secondary' : 'primary'}
          size="small"
          className="flex-1"
          onClick={() => switchMutation.mutate(false)}
          disabled={switchMutation.isPending}
        >
          No sorteado
        </Button>
        <Button
          variant={usedFallback ? 'primary' : 'secondary'}
          size="small"
          className="flex-1"
          onClick={() => switchMutation.mutate(true)}
          disabled={switchMutation.isPending}
        >
          No segundo lugar
        </Button>
      </div>
      <p className="text-xs text-[var(--muted)]">
        A nota vai para o lugar onde vocês realmente foram.
      </p>
    </Card>
  )
}
