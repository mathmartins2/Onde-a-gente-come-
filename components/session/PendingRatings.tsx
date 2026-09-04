'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { apiClient } from '@/lib/http/apiClient'

type PendingVisit = {
  visitId: string
  restaurantName: string
  visitedAt: string
  recommendedByName: string | null
  ratingCount: number
  hasMyRating: boolean
}

export const PendingRatings = () => {
  const pendingQuery = useQuery({
    queryKey: ['pending-ratings'],
    queryFn: async () => {
      const response = await apiClient.get<{ visits: PendingVisit[] }>('/visits/pending')
      return response.data.visits
    },
    refetchInterval: 15000,
  })

  const visits = pendingQuery.data ?? []
  if (visits.length === 0) return null

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">Esperando nota</h2>
      {visits.map((visit) => (
        <Link key={visit.visitId} href={`/visits/${visit.visitId}/rate`}>
          <Card className="flex items-center justify-between gap-3 py-3.5 transition-colors hover:border-[var(--accent)]">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{visit.restaurantName}</p>
              <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                {format(new Date(visit.visitedAt), "d 'de' MMM", { locale: ptBR })}
                {visit.recommendedByName ? ` · por ${visit.recommendedByName}` : ''}
                {` · ${visit.ratingCount} nota(s)`}
              </p>
            </div>
            <span
              className={
                visit.hasMyRating
                  ? 'shrink-0 text-[10px] uppercase text-[var(--muted)]'
                  : 'inline-flex shrink-0 items-center gap-1 text-[10px] uppercase text-[var(--accent)]'
              }
            >
              {visit.hasMyRating ? (
                'sua nota já foi'
              ) : (
                <>
                  <Star size={12} />
                  dar nota
                </>
              )}
            </span>
          </Card>
        </Link>
      ))}
    </section>
  )
}
