'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Ban, ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { fetchHistory, type HistoryRound } from '@/lib/http/historyQueries'
import { classNames } from '@/lib/utilities/classNames'

const formatPercentage = (value: number) => `${(value * 100).toFixed(0)}%`

const BallotLog = ({ round }: { round: HistoryRound }) => (
  <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-3">
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
        o rank de cada um
      </p>
      {round.ballots.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">Sem registro (rodada antiga).</p>
      ) : null}
      {round.ballots.map((ballot) => (
        <div key={ballot.memberId} className="text-xs">
          <span className="font-medium text-[var(--foreground)]">{ballot.displayName}</span>
          <span className="text-[var(--muted)]">
            {ballot.ranking.length === 0
              ? ' não ranqueou nada'
              : ` ${ballot.ranking.map((entry) => `${entry.position}º ${entry.restaurantName}`).join(' · ')}`}
          </span>
        </div>
      ))}
    </div>

    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
        votos pra banir{round.banRound > 1 ? ` (${round.banRound}º turno)` : ''}
      </p>
      {round.ballots.map((ballot) => (
        <div key={`ban-${ballot.memberId}`} className="text-xs">
          <span className="font-medium text-[var(--foreground)]">{ballot.displayName}</span>
          <span className="text-[var(--muted)]">
            {!ballot.banVote
              ? ' não votou'
              : ballot.banVote.restaurantName === null
                ? ' não quis banir ninguém'
                : ` votou pra banir ${ballot.banVote.restaurantName}`}
          </span>
        </div>
      ))}
      {round.bannedRestaurantName ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-red-400">
          <Ban size={11} />
          banido: {round.bannedRestaurantName}
        </p>
      ) : (
        <p className="text-xs text-[var(--muted)]">Ninguém foi banido.</p>
      )}
    </div>

    {round.fallback?.name ? (
      <div>
        <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">plano B sorteado</p>
        <p className="text-xs">
          🥈 {round.fallback.name}
          <span className="ml-2 text-[var(--muted)]">
            indicação de {round.fallback.addedByName}
          </span>
          {round.usedFallback ? (
            <span className="ml-2 text-[10px] uppercase text-[var(--warning)]">foi esse</span>
          ) : null}
        </p>
      </div>
    ) : null}
  </div>
)

const RoundCard = ({ round }: { round: HistoryRound }) => {
  const [isLogOpen, setIsLogOpen] = useState(false)

  return (
  <Card className="flex flex-col gap-4">
    <div className="flex items-baseline justify-between">
      <span className="text-xs uppercase tracking-widest text-[var(--muted)]">
        rodada {round.roundNumber}
      </span>
      <span className="text-xs text-[var(--muted)]">
        {format(new Date(round.drawnAt), "d 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
      </span>
    </div>

    <div className="flex items-start gap-3">
      <Trophy size={18} className="mt-0.5 shrink-0 text-[var(--accent)]" />
      <div className="min-w-0">
        <p className="text-base font-semibold leading-tight">{round.winnerRestaurantName}</p>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          indicação de {round.winnerNominatedByName}
        </p>
      </div>
      {round.finalScore === null ? null : (
        <span className="ml-auto text-xl font-semibold tabular-nums">
          {round.finalScore.toFixed(2)}
        </span>
      )}
    </div>

    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
        quem estava disputando
      </p>
      {round.contenders.map((contender) => {
        const isWinner = contender.restaurantId === round.winnerRestaurantId

        return (
          <div
            key={`${round.drawId}-${contender.restaurantId}`}
            className={classNames(
              'flex items-baseline justify-between gap-3 rounded-lg px-2.5 py-1.5 text-sm',
              isWinner ? 'bg-[var(--accent)]/12' : 'bg-[var(--surface-raised)]',
            )}
          >
            <span className="min-w-0 truncate">
              {contender.restaurantName}
              <span className="ml-2 text-xs text-[var(--muted)]">
                {contender.nominatedByName}
              </span>
              {contender.supporters > 0 ? (
                <span className="ml-2 text-[10px] uppercase text-[var(--muted)]">
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
            <span className="shrink-0 tabular-nums text-xs text-[var(--muted)]">
              {formatPercentage(contender.chance)}
            </span>
          </div>
        )
      })}
    </div>

    {round.ratings.length === 0 ? null : (
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">notas que deram</p>
        {round.ratings.map((rating) => (
          <div
            key={`${round.drawId}-${rating.memberId}`}
            className="flex items-baseline justify-between text-sm"
          >
            <span>
              {rating.displayName}
              {rating.isRecommender ? (
                <span className="ml-2 text-[10px] uppercase text-[var(--muted)]">indicou</span>
              ) : null}
              {rating.comment ? (
                <span className="ml-2 text-xs text-[var(--muted)]">{rating.comment}</span>
              ) : null}
            </span>
            <span className="tabular-nums">{rating.score.toFixed(1)}</span>
          </div>
        ))}
      </div>
    )}

    {round.isRevealed || round.ratings.length > 0 ? null : (
      <p className="text-xs text-[var(--muted)]">notas ainda não reveladas</p>
    )}

    <button
      onClick={() => setIsLogOpen((open) => !open)}
      className="inline-flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
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

  if (historyQuery.isLoading) return <p className="text-sm text-[var(--muted)]">Carregando...</p>

  const rounds = historyQuery.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Histórico</h1>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Cada rodada com quem estava na disputa, a chance de cada um e as notas.
        </p>
      </div>

      {rounds.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">Nenhum sorteio ainda.</p>
        </Card>
      ) : null}

      {rounds.map((round) => (
        <RoundCard key={round.drawId} round={round} />
      ))}
    </div>
  )
}
