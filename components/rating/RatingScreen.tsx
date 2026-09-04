'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Smartphone, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/http/apiClient'
import { BlindRatingSession } from './BlindRatingSession'
import { OwnRatingPanel } from './OwnRatingPanel'
import { FallbackToggle } from './FallbackToggle'
import { PriceHistory } from './PriceHistory'
import { VisitDate } from './VisitDate'

type RatingScreenProps = {
  visitId: string
  currentMemberId: string
}

type VisitSummary = {
  participants: Array<{ id: string; displayName: string }>
  restaurantName: string
  visitedAt: string
  usedFallback: boolean
  hasFallbackOption: boolean
  ratedMemberIds: string[]
}

export const RatingScreen = ({ visitId, currentMemberId }: RatingScreenProps) => {
  const [isPassAroundMode, setIsPassAroundMode] = useState(false)

  const visitQuery = useQuery({
    queryKey: ['rating-session', visitId],
    queryFn: async () => {
      const response = await apiClient.get<VisitSummary>(`/visits/${visitId}`)
      return response.data
    },
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-[var(--muted)]">avaliando</p>
        <h1 className="mt-1 text-xl font-semibold">
          {visitQuery.data?.restaurantName ?? 'Carregando...'}
        </h1>
        {visitQuery.data?.usedFallback ? (
          <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--warning)]">
            foi o segundo lugar
          </p>
        ) : null}
        {visitQuery.data ? (
          <div className="mt-1.5">
            <VisitDate visitId={visitId} visitedAt={visitQuery.data.visitedAt} />
          </div>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Button
          variant={isPassAroundMode ? 'secondary' : 'primary'}
          size="small"
          className="flex-1"
          onClick={() => setIsPassAroundMode(false)}
        >
          <Smartphone size={14} />
          No meu celular
        </Button>
        <Button
          variant={isPassAroundMode ? 'primary' : 'secondary'}
          size="small"
          className="flex-1"
          onClick={() => setIsPassAroundMode(true)}
        >
          <Users size={14} />
          Passando um só
        </Button>
      </div>

      {visitQuery.data?.hasFallbackOption ? (
        <FallbackToggle visitId={visitId} usedFallback={visitQuery.data.usedFallback} />
      ) : null}

      <PriceHistory visitId={visitId} />

      {isPassAroundMode ? (
        <BlindRatingSession visitId={visitId} />
      ) : (
        <OwnRatingPanel
          visitId={visitId}
          currentMemberId={currentMemberId}
          allMembers={visitQuery.data?.participants ?? []}
        />
      )}
    </div>
  )
}
