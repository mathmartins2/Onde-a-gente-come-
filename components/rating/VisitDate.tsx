'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'

const toInputValue = (value: string) => format(new Date(value), 'yyyy-MM-dd')

export const VisitDate = ({ visitId, visitedAt }: { visitId: string; visitedAt: string }) => {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  const saveMutation = useMutation({
    mutationFn: (value: string) =>
      apiClient.put(`/visits/${visitId}/date`, { visitedAt: value }),
    onSuccess: () => {
      setIsEditing(false)
      toast.success('Data ajustada')
      queryClient.invalidateQueries({ queryKey: ['rating-session', visitId] })
      queryClient.invalidateQueries({ queryKey: ['pending-ratings'] })
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível ajustar')),
  })

  if (isEditing) {
    return (
      <div className="flex items-center justify-center gap-2">
        <TextInput
          type="date"
          defaultValue={toInputValue(visitedAt)}
          max={format(new Date(), 'yyyy-MM-dd')}
          className="w-44"
          onChange={(event) => {
            if (event.target.value) saveMutation.mutate(event.target.value)
          }}
        />
        <Button variant="ghost" size="small" onClick={() => setIsEditing(false)}>
          <Check size={14} />
        </Button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
    >
      <CalendarDays size={12} />
      {format(new Date(visitedAt), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
    </button>
  )
}
