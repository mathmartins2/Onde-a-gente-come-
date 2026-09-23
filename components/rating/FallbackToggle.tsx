'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'

type FallbackToggleProps = {
  visitId: string
  usedFallback: boolean
  drawnRestaurantName: string | null
  fallbackRestaurantName: string
}

const OptionLabel = ({ caption, restaurantName }: { caption: string; restaurantName: string | null }) => (
  <span className="flex min-w-0 flex-col items-center leading-tight">
    <span className="text-[0.6875rem] font-medium opacity-80">{caption}</span>
    <span className="max-w-full truncate">{restaurantName ?? caption}</span>
  </span>
)

export const FallbackToggle = ({
  visitId,
  usedFallback,
  drawnRestaurantName,
  fallbackRestaurantName,
}: FallbackToggleProps) => {
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
      <p className="text-micro-cap text-ink-faint">onde vocês foram</p>
      <div className="flex gap-2">
        <Button
          variant={usedFallback ? 'secondary' : 'primary'}
          className="h-auto min-h-14 min-w-0 flex-1 py-2"
          onClick={() => switchMutation.mutate(false)}
          disabled={switchMutation.isPending}
        >
          <OptionLabel caption="No sorteado" restaurantName={drawnRestaurantName} />
        </Button>
        <Button
          variant={usedFallback ? 'primary' : 'secondary'}
          className="h-auto min-h-14 min-w-0 flex-1 py-2"
          onClick={() => switchMutation.mutate(true)}
          disabled={switchMutation.isPending}
        >
          <OptionLabel caption="No segundo lugar" restaurantName={fallbackRestaurantName} />
        </Button>
      </div>
      <p className="text-caption">
        A nota vai para o lugar onde vocês realmente foram.
      </p>
    </Card>
  )
}
