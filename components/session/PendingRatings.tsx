'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ChevronRight, Star } from 'lucide-react'
import { apiClient } from '@/lib/http/apiClient'

export type PendingVisit = {
  visitId: string
  restaurantName: string
  visitedAt: string
  recommendedByName: string | null
  ratingCount: number
  hasMyRating: boolean
}

export const usePendingRatings = () =>
  useQuery({
    queryKey: ['pending-ratings'],
    queryFn: async () => {
      const response = await apiClient.get<{ visits: PendingVisit[] }>('/visits/pending')
      return response.data.visits
    },
    refetchInterval: 15000,
  })

export const PendingRatings = ({ excludedVisitId = null }: { excludedVisitId?: string | null }) => {
  const pendingQuery = usePendingRatings()

  const visits = (pendingQuery.data ?? []).filter((visit) => visit.visitId !== excludedVisitId)
  const awaitingMyRating = visits.filter((visit) => !visit.hasMyRating)
  const highlighted = awaitingMyRating.at(0) ?? visits.at(0)
  if (!highlighted) return null

  const remainingCount = visits.length - 1

  return (
    <Link
      href={`/visits/${highlighted.visitId}/rate`}
      className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent-tint px-3 py-2 transition-colors hover:border-accent"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Star size={14} className="shrink-0 text-accent" />
        <span className="min-w-0 truncate text-body-sm">
          <span className="font-semibold">{highlighted.restaurantName}</span>
          {highlighted.hasMyRating ? ' espera as notas' : ' espera sua nota'}
          {remainingCount > 0 ? ` · +${remainingCount}` : ''}
        </span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-accent" />
    </Link>
  )
}
