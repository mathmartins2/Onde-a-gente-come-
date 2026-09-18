'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Smartphone, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { classNames } from '@/lib/utilities/classNames'
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header className="relative overflow-hidden rounded-2xl border border-hairline bg-[linear-gradient(150deg,var(--surface-2),var(--surface-1)_55%,var(--canvas))] px-5 py-6 text-center">
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-28 w-48 -translate-x-1/2 rounded-full bg-accent opacity-[0.12] blur-3xl"
        />
        <p className="text-micro-cap text-accent">avaliando</p>
        <h1 className="font-display mt-1 text-display-large">
          {visitQuery.data?.restaurantName ?? 'Carregando...'}
        </h1>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {visitQuery.data ? (
            <VisitDate visitId={visitId} visitedAt={visitQuery.data.visitedAt} />
          ) : null}
          {visitQuery.data?.usedFallback ? (
            <Badge tone="warning" size="small">
              foi o plano B
            </Badge>
          ) : null}
        </div>
      </header>

      <div className="flex gap-1 rounded-pill border border-hairline bg-surface-1 p-1">
        <button
          onClick={() => setIsPassAroundMode(false)}
          className={classNames(
            'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-pill text-body-sm transition-colors',
            isPassAroundMode ? 'text-ink-muted hover:text-ink' : 'bg-accent-tint font-semibold text-accent',
          )}
        >
          <Smartphone size={15} />
          No meu celular
        </button>
        <button
          onClick={() => setIsPassAroundMode(true)}
          className={classNames(
            'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-pill text-body-sm transition-colors',
            isPassAroundMode ? 'bg-accent-tint font-semibold text-accent' : 'text-ink-muted hover:text-ink',
          )}
        >
          <Users size={15} />
          Passando um só
        </button>
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
