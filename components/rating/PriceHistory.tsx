'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Check, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextInput } from '@/components/ui/Field'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'

type PriceEntry = {
  id: string
  amount: string
  createdAt: string
  addedByMemberId: string
  addedByName: string
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const PriceHistory = ({ visitId }: { visitId: string }) => {
  const queryClient = useQueryClient()
  const amountRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)

  const entriesQuery = useQuery({
    queryKey: ['prices', visitId],
    queryFn: async () => {
      const response = await apiClient.get<{ entries: PriceEntry[] }>(`/visits/${visitId}/prices`)
      return response.data.entries
    },
  })

  const saveMutation = useMutation({
    mutationFn: (amount: string) => apiClient.post(`/visits/${visitId}/prices`, { amount }),
    onSuccess: () => {
      setIsEditing(false)
      toast.success('Total da conta guardado')
      queryClient.invalidateQueries({ queryKey: ['prices', visitId] })
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível salvar')),
  })

  const entry = entriesQuery.data?.at(0) ?? null

  const submit = () => {
    const amount = amountRef.current?.value ?? ''
    if (amount.trim().length === 0) return
    saveMutation.mutate(amount)
  }

  if (entry && !isEditing) {
    return (
      <Card className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">total da conta</p>
          <p className="text-xl font-semibold tabular-nums">
            {currencyFormatter.format(Number(entry.amount))}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
            lançado por {entry.addedByName}
          </p>
        </div>
        <Button variant="ghost" size="small" onClick={() => setIsEditing(true)}>
          <Pencil size={14} />
        </Button>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">total da conta</p>
      <div className="flex gap-2">
        <TextInput
          ref={amountRef}
          inputMode="decimal"
          placeholder="0,00"
          defaultValue={entry?.amount ?? ''}
          className="flex-1"
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit()
          }}
        />
        <Button variant="secondary" onClick={submit} disabled={saveMutation.isPending}>
          <Check size={16} />
        </Button>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Um valor por rolê. Qualquer um pode lançar ou corrigir.
      </p>
    </Card>
  )
}
