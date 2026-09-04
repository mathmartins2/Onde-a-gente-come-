'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Ban, Dices, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'
import { fetchBoardState, runDrawRequest } from '@/lib/http/queries'
import { classNames } from '@/lib/utilities/classNames'
import { ShareCard } from './ShareCard'

const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`

const spinDurationInMilliseconds = 2200

type DrawBoardProps = {
  currentMemberId: string
}

export const DrawBoard = ({ currentMemberId }: DrawBoardProps) => {
  const queryClient = useQueryClient()

  const boardQuery = useQuery({ queryKey: ['board'], queryFn: fetchBoardState })

  const drawMutation = useMutation({
    mutationFn: runDrawRequest,
    onSuccess: async () => {
      await new Promise((resolve) => setTimeout(resolve, spinDurationInMilliseconds))
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível sortear')),
  })

  const vetoMutation = useMutation({
    mutationFn: (nominationId: string) => apiClient.post('/vetoes', { nominationId }),
    onSuccess: () => {
      toast.success('Veto registrado')
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível vetar')),
  })

  const board = boardQuery.data
  const isSpinning = drawMutation.isPending
  const result = drawMutation.data
  const winnerName = result
    ? board?.memberChances.find((member) => member.memberId === result.winnerMemberId)?.displayName
    : null
  const winningNomination = result
    ? board?.history.find((entry) => entry.roundNumber === result.roundNumber)
    : null
  const winnerRestaurant = winningNomination?.restaurantName ?? null

  if (boardQuery.isLoading) {
    return <p className="text-sm text-[var(--muted)]">Carregando a roda...</p>
  }

  if (!board) return <p className="text-sm text-[var(--muted)]">Não consegui carregar o sorteio.</p>

  const hasEligibleMember = board.memberChances.some((member) => member.isEligible)

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Rodada {board.roundNumber}</h2>
          <span className="text-xs text-[var(--muted)]">chance de cada um agora</span>
        </div>

        <Card className="flex flex-col gap-3">
          {board.memberChances.map((member) => (
            <div key={member.memberId} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className={classNames(!member.isEligible && 'text-[var(--muted)]')}>
                  {member.displayName}
                  {member.memberId === currentMemberId ? (
                    <span className="ml-1.5 text-[10px] uppercase text-[var(--accent)]">você</span>
                  ) : null}
                </span>
                <span
                  className={classNames(
                    'tabular-nums',
                    member.isEligible ? 'text-[var(--foreground)]' : 'text-[var(--muted)]',
                  )}
                >
                  {member.isEligible ? formatPercentage(member.chance) : 'sem indicação'}
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                <motion.div
                  className="h-full rounded-full bg-[var(--accent)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${member.chance * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>

              <div className="flex gap-3 text-[10px] text-[var(--muted)]">
                <span>{member.roundsSinceLastWin} rodada(s) sem ganhar</span>
                {member.isEligible && member.qualityMultiplier !== 1 ? (
                  <span
                    className={
                      member.qualityMultiplier > 1 ? 'text-[var(--success)]' : 'text-[var(--warning)]'
                    }
                  >
                    histórico {member.qualityMultiplier > 1 ? '+' : ''}
                    {((member.qualityMultiplier - 1) * 100).toFixed(0)}%
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Na roda</h2>
        <div className="flex flex-col gap-2">
          {board.nominations.length === 0 ? (
            <Card>
              <p className="text-sm text-[var(--muted)]">
                Ninguém indicou nada ainda.{' '}
                <Link href="/restaurants" className="text-[var(--accent)] underline">
                  Indique um lugar
                </Link>
                .
              </p>
            </Card>
          ) : null}

          {board.nominations.map((nomination) => (
            <Card
              key={nomination.id}
              className={classNames(
                'flex items-center justify-between gap-3 py-3.5',
                nomination.vetoedBy && 'opacity-50',
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {nomination.restaurantName}
                  {nomination.vetoedBy ? (
                    <span className="ml-2 text-[10px] uppercase text-red-400">
                      vetado por {nomination.vetoedBy}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                  {nomination.memberName}
                  {nomination.cuisines.length > 0 ? ` · ${nomination.cuisines.join(', ')}` : ''}
                  {nomination.neighborhood ? ` · ${nomination.neighborhood}` : ''}
                </p>
              </div>

              {nomination.memberId !== currentMemberId && !nomination.vetoedBy ? (
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => vetoMutation.mutate(nomination.id)}
                  disabled={vetoMutation.isPending}
                >
                  <Ban size={14} />
                  vetar
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      </section>

      <Button
        size="large"
        onClick={() => drawMutation.mutate()}
        disabled={isSpinning || !hasEligibleMember}
        className="w-full"
      >
        <motion.span
          animate={isSpinning ? { rotate: 1440 } : { rotate: 0 }}
          transition={{ duration: spinDurationInMilliseconds / 1000, ease: [0.2, 0.8, 0.3, 1] }}
          className="inline-flex"
        >
          <Dices size={20} />
        </motion.span>
        {isSpinning ? 'Sorteando...' : 'Sortear o rolê'}
      </Button>

      <AnimatePresence>
        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-[var(--accent)] bg-gradient-to-b from-[var(--accent)]/12 to-transparent text-center">
              <Sparkles className="mx-auto text-[var(--accent)]" size={22} />
              <p className="mt-2 text-xs uppercase tracking-widest text-[var(--muted)]">
                vai ser em
              </p>
              <p className="mt-1 text-2xl font-semibold">{winnerRestaurant ?? 'Restaurante'}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">indicação de {winnerName}</p>

              {result.previousVisits.visitCount > 0 ? (
                <p className="mt-3 rounded-lg bg-[var(--surface-raised)] px-3 py-2 text-xs text-[var(--muted)]">
                  já foram {result.previousVisits.visitCount}x
                  {result.previousVisits.lastVisitedAt
                    ? `, última em ${format(new Date(result.previousVisits.lastVisitedAt), "MMM 'de' yyyy", { locale: ptBR })}`
                    : ''}
                  {result.previousVisits.lastScore !== null
                    ? ` · nota ${result.previousVisits.lastScore.toFixed(1)}`
                    : ''}
                </p>
              ) : null}

              <div className="mt-4 flex flex-col gap-3">
                <ShareCard
                  restaurantName={winnerRestaurant ?? 'Restaurante'}
                  nominatedBy={winnerName ?? ''}
                  roundNumber={result.roundNumber}
                  neighborhood={null}
                  cuisines={[]}
                />

                <Link href={`/visits/${result.visitId}/rate`}>
                  <Button variant="secondary" className="w-full">
                    Dar as notas depois do rolê
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {board.history.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Histórico</h2>
          <Card className="flex flex-col gap-2.5">
            {board.history.map((entry) => (
              <div key={entry.id} className="flex items-baseline justify-between text-sm">
                <span>
                  <span className="text-[var(--muted)]">#{entry.roundNumber}</span>{' '}
                  {entry.restaurantName}
                </span>
                <span className="text-xs text-[var(--muted)]">{entry.winnerName}</span>
              </div>
            ))}
          </Card>
        </section>
      ) : null}
    </div>
  )
}
