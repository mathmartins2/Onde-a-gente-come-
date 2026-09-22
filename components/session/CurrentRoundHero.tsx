'use client'

import Link from 'next/link'
import { ArrowRight, CalendarDays, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Meter } from '@/components/ui/Meter'
import { RestaurantPhoto } from '@/components/ui/RestaurantPhoto'
import type { HistoryRound } from '@/lib/http/historyQueries'
import { buildGoogleMapsUrl } from '@/lib/places/buildGoogleMapsUrl'
import { formatDrawMoment, formatVisitDay } from '@/lib/utilities/formatDate'
import type { PendingVisit } from './PendingRatings'

const describeRoundMoment = (round: HistoryRound) =>
  round.visitDateConfirmedAt && round.visitedAt
    ? `fomos ${formatVisitDay(round.visitedAt)}`
    : `sorteado ${formatDrawMoment(round.drawnAt)}`

const describeRatingProgress = (ratingCount: number, participantCount: number) =>
  ratingCount === 0 ? 'ninguém deu nota ainda' : `${ratingCount} de ${participantCount} já deram nota`

export const CurrentRoundHero = ({
  round,
  pendingVisit,
}: {
  round: HistoryRound & { visitId: string }
  pendingVisit: PendingVisit | null
}) => {
  const ratingCount = pendingVisit?.ratingCount ?? 0
  const participantCount = Math.max(round.participants.length, ratingCount, 1)
  const hasMyRating = pendingVisit?.hasMyRating ?? false

  return (
    <section className="relative overflow-hidden rounded-2xl border border-accent/30 bg-[linear-gradient(150deg,var(--surface-2),var(--surface-1)_55%,var(--canvas))] px-5 py-7">
      <span
        aria-hidden
        className="animate-glow-breathe pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-accent opacity-[0.18] blur-3xl"
      />
      <p className="relative text-micro-cap text-accent">rodada {round.roundNumber} · o rolê da vez</p>

      <div className="relative mt-4 flex items-center gap-4">
        <RestaurantPhoto
          name={round.winnerRestaurantName}
          photoUrl={round.winnerRestaurantPhotoUrl}
          className="h-20 w-20 rounded-xl shadow-[var(--elevation-3)]"
        />
        <div className="min-w-0">
          <h1 className="font-display text-display-large leading-[1.05]">{round.winnerRestaurantName}</h1>
          <p className="mt-1 text-body-sm text-ink-muted">indicação de {round.winnerNominatedByName}</p>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={13} className="text-accent" />
          {describeRoundMoment(round)}
        </span>
        <a
          href={buildGoogleMapsUrl({ name: round.winnerRestaurantName })}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-accent underline-offset-2 hover:underline"
        >
          <ExternalLink size={13} />
          abrir no Google Maps
        </a>
      </div>

      <div className="relative mt-5 flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3 text-caption">
          <span>{describeRatingProgress(ratingCount, participantCount)}</span>
          <span className={hasMyRating ? 'text-[var(--success)]' : 'text-accent'}>
            {hasMyRating ? 'você já deu a sua' : 'falta a sua'}
          </span>
        </div>
        <Meter value={ratingCount / participantCount} />
      </div>

      <Link href={`/visits/${round.visitId}/rate`} className="relative mt-5 block">
        <Button size="large" className="w-full">
          {hasMyRating ? 'Ver rodada' : 'Dar minha nota'}
          <ArrowRight size={18} />
        </Button>
      </Link>
    </section>
  )
}
