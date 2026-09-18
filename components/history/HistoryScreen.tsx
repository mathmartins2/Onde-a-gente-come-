'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Ban, ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ScoreRating } from '@/components/ui/ScoreRating'
import { fetchHistory, type HistoryRating, type HistoryRound } from '@/lib/http/historyQueries'
import { ratingCriteria } from '@/lib/scoring/configuration'
import { classNames } from '@/lib/utilities/classNames'
import { formatDrawMoment, formatVisitDay } from '@/lib/utilities/formatDate'
import { scoreTextClassFor } from '@/lib/utilities/scoreTone'
import { EmptyState } from '@/components/ui/EmptyState'
import { Meter } from '@/components/ui/Meter'
import { Skeleton } from '@/components/ui/Skeleton'

const formatPercentage = (value: number) => `${(value * 100).toFixed(0)}%`

const scoreTone = scoreTextClassFor

const RatingRow = ({ rating }: { rating: HistoryRating }) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasCriteria = ratingCriteria.some(
    (criterion) => rating.criteria[criterion.key] !== null && rating.criteria[criterion.key] !== undefined,
  )

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsOpen((open) => !open)}
        disabled={!hasCriteria}
        className="flex items-baseline justify-between gap-3 py-1 text-left text-sm disabled:cursor-default"
      >
        <span className="min-w-0 truncate">
          {hasCriteria ? (
            <ChevronDown
              size={11}
              className={`mr-1 inline-block text-ink-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          ) : null}
          {rating.displayName}
          {rating.isRecommender ? (
            <span className="ml-2 text-micro-cap text-ink-faint">indicou</span>
          ) : null}
        </span>
        <span className={`shrink-0 tabular-nums ${scoreTone(rating.score)}`}>
          {rating.score.toFixed(2)}
        </span>
      </button>

      {isOpen ? (
        <div className="mb-1 ml-4 flex flex-col gap-1 border-l border-hairline-strong pl-3">
          {ratingCriteria.map((criterion) => {
            const value = rating.criteria[criterion.key]
            if (value === null || value === undefined) return null

            return (
              <div key={criterion.key} className="flex items-center gap-2">
                <span className="w-28 shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                  {criterion.label}
                </span>
                <Meter value={value / 5} className="flex-1" />
                <span className={`w-7 shrink-0 text-right text-xs tabular-nums ${scoreTone(value)}`}>
                  {value.toFixed(1)}
                </span>
              </div>
            )
          })}

          {rating.comment ? (
            <p className="mt-1 text-xs italic text-ink-muted">&ldquo;{rating.comment}&rdquo;</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const positionMedals = ['1º', '2º', '3º', '4º', '5º']

const LogSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-ink-muted">{title}</p>
    {children}
  </div>
)

const BallotLog = ({ round }: { round: HistoryRound }) => (
  <div
    className="relative mt-1 flex flex-col gap-5 rounded-xl border border-dashed border-hairline-strong bg-surface-sunken px-4 py-5"
    style={{
      backgroundImage:
        'repeating-linear-gradient(180deg, transparent 0px, transparent 27px, rgba(255,255,255,0.025) 27px, rgba(255,255,255,0.025) 28px)',
    }}
  >
    <span className="absolute -left-2 top-8 h-4 w-4 rounded-full bg-surface-1" />
    <span className="absolute -right-2 top-8 h-4 w-4 rounded-full bg-surface-1" />

    <LogSection title="o rank de cada um">
      {round.ballots.length === 0 ? (
        <p className="text-caption">Rodada antiga, sem registro dos votos.</p>
      ) : null}

      {round.ballots.map((ballot) => (
        <div key={ballot.memberId} className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-hover">
            {ballot.displayName}
          </span>
          {ballot.ranking.length === 0 ? (
            <span className="text-caption">não ranqueou nada</span>
          ) : (
            <ol className="flex flex-col gap-0.5">
              {ballot.ranking.map((entry, index) => (
                <li
                  key={entry.restaurantId}
                  className="flex items-baseline gap-2 text-xs text-ink"
                >
                  <span className="w-5 shrink-0 font-mono text-[10px] text-ink-muted">
                    {positionMedals[index] ?? `${entry.position}º`}
                  </span>
                  <span className="truncate">{entry.restaurantName}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ))}
    </LogSection>

    <LogSection
      title={round.banRound > 1 ? `votos pra banir · ${round.banRound}º turno` : 'votos pra banir'}
    >
      <div className="flex flex-col gap-1">
        {round.ballots.map((ballot) => (
          <div
            key={`ban-${ballot.memberId}`}
            className="flex items-baseline justify-between gap-3 text-xs"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
              {ballot.displayName}
            </span>
            <span
              className={
                ballot.banVote?.restaurantName
                  ? 'truncate text-right text-[var(--danger)]'
                  : 'truncate text-right text-ink-muted'
              }
            >
              {!ballot.banVote
                ? '—'
                : ballot.banVote.restaurantName === null
                  ? 'não quis banir'
                  : ballot.banVote.restaurantName}
            </span>
          </div>
        ))}
      </div>

      {round.bannedRestaurantName ? (
        <div className="mt-1 inline-flex items-center gap-2 self-start rounded-[4px] border-2 border-[var(--danger)] px-2.5 py-1">
          <Ban size={12} className="text-[var(--danger)]" />
          <span className="font-display text-sm font-bold uppercase tracking-tight text-[var(--danger)]">
            {round.bannedRestaurantName}
          </span>
        </div>
      ) : (
        <p className="text-caption">Ninguém foi banido.</p>
      )}
    </LogSection>

    {round.fallback?.name ? (
      <LogSection title="plano b sorteado">
        <div className="flex items-baseline gap-2 text-xs">
          <span>🥈</span>
          <span className="truncate text-ink">{round.fallback.name}</span>
          {round.fallback.addedByName ? (
            <span className="truncate text-ink-muted">
              indicação de {round.fallback.addedByName}
            </span>
          ) : null}
          {round.usedFallback ? (
            <span className="ml-auto shrink-0 rounded-pill bg-[var(--warning)]/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--warning)]">
              foi esse
            </span>
          ) : null}
        </div>
      </LogSection>
    ) : null}
  </div>
)

const RoundCard = ({ round }: { round: HistoryRound }) => {
  const [isLogOpen, setIsLogOpen] = useState(false)

  return (
  <Card className="flex flex-col gap-4">
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <span className="text-micro-cap text-accent">rodada {round.roundNumber}</span>
      <span className="text-caption">
        sorteio {formatDrawMoment(round.drawnAt)}
        {round.visitDateConfirmedAt && round.visitedAt
          ? ` · fomos ${formatVisitDay(round.visitedAt)}`
          : ''}
      </span>
    </div>

    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-tint">
        <Trophy size={17} className="text-accent" />
      </span>
      <div className="min-w-0">
        <p className="text-heading-md leading-tight">{round.winnerRestaurantName}</p>
        <p className="mt-0.5 text-caption">indicação de {round.winnerNominatedByName}</p>
      </div>
      <span className="ml-auto flex shrink-0 flex-col items-end gap-1">
        {round.finalScore === null ? null : (
          <>
            <span className={`text-numeric text-heading-lg ${scoreTone(round.finalScore)}`}>
              {round.finalScore.toFixed(2)}
            </span>
            <ScoreRating score={round.finalScore} />
          </>
        )}
        {round.totalPaid ? (
          <span className="text-numeric text-caption">
            {currencyFormatter.format(Number(round.totalPaid))}
            {round.paidPerPerson
              ? ` · ${currencyFormatter.format(round.paidPerPerson)} cada`
              : ''}
          </span>
        ) : null}
      </span>
    </div>

    <div className="flex flex-col gap-1.5">
      <p className="text-micro-cap text-ink-faint">quem estava disputando</p>
      {round.contenders.map((contender) => {
        const isWinner = contender.restaurantId === round.winnerRestaurantId

        return (
          <div
            key={`${round.drawId}-${contender.restaurantId}`}
            className={classNames(
              'flex items-baseline justify-between gap-3 rounded-lg px-2.5 py-1.5 text-sm',
              isWinner ? 'bg-accent-tint' : 'bg-surface-2',
            )}
          >
            <span className="min-w-0 truncate">
              {contender.restaurantName}
              <span className="ml-2 text-caption">
                {contender.nominatedByName}
              </span>
              {contender.supporters > 0 ? (
                <span className="ml-2 text-micro-cap text-ink-faint">
                  {contender.supporters} quiseram
                  {contender.topChoiceCount > 0 ? ` · ${contender.topChoiceCount} em 1º` : ''}
                </span>
              ) : null}
              {contender.revisitWeight < 1 ? (
                <span className="ml-2 text-[10px] uppercase text-[var(--warning)]">
                  já foram
                </span>
              ) : null}
            </span>
            <span className="shrink-0 tabular-nums text-caption">
              {formatPercentage(contender.chance)}
            </span>
          </div>
        )
      })}
    </div>

    {round.ratings.length === 0 ? null : (
      <div className="flex flex-col gap-1.5">
        <p className="text-micro-cap text-ink-faint">notas que deram</p>
        {round.ratings.map((rating) => (
          <RatingRow key={`${round.drawId}-${rating.memberId}`} rating={rating} />
        ))}
      </div>
    )}

    {round.isRevealed || round.ratings.length > 0 ? null : (
      <p className="text-caption">notas ainda não reveladas</p>
    )}

    <button
      onClick={() => setIsLogOpen((open) => !open)}
      className="inline-flex min-h-9 items-center justify-center gap-1.5 text-micro-cap text-ink-faint transition-colors hover:text-ink"
    >
      {isLogOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      {isLogOpen ? 'esconder quem votou em quem' : 'ver quem votou em quem'}
    </button>

    {isLogOpen ? <BallotLog round={round} /> : null}
  </Card>
  )
}

export const HistoryScreen = () => {
  const historyQuery = useQuery({ queryKey: ['history'], queryFn: fetchHistory })

  if (historyQuery.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-52 w-full" />
      </div>
    )
  }

  const rounds = historyQuery.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading-xl">Histórico</h1>
        <p className="mt-1 text-caption max-w-prose">
          Cada rodada com quem estava na disputa, a chance de cada um e as notas.
        </p>
      </div>

      {rounds.length === 0 ? (
        <Card>
          <EmptyState glyph="🎲" title="Nenhum sorteio ainda" />
        </Card>
      ) : null}

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start">
        {rounds.map((round) => (
          <RoundCard key={round.drawId} round={round} />
        ))}
      </div>
    </div>
  )
}
