'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowDown,
  ArrowUp,
  Check,
  Dices,
  ExternalLink,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'
import { fetchSessionState, type SessionState } from '@/lib/http/sessionQueries'
import { DrawReveal, type DrawRevealData } from './DrawReveal'
import { PendingRatings } from './PendingRatings'
import { buildGoogleMapsUrl } from '@/lib/places/buildGoogleMapsUrl'
import { classNames } from '@/lib/utilities/classNames'

type CatalogRestaurant = {
  id: string
  name: string
  neighborhood: string | null
  cuisines: string[]
  createdByName: string | null
}

type DrawOutcome = DrawRevealData & {
  addedByMemberId: string
  visitId: string
}

const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`

const moveItem = (items: string[], fromIndex: number, toIndex: number) => {
  if (toIndex < 0 || toIndex >= items.length) return items
  const reordered = [...items]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)
  return reordered
}

const DrawOutcomeCard = ({ outcome }: { outcome: DrawOutcome }) => {
  const winner = outcome.contenders.find(
    (contender) => contender.restaurantId === outcome.restaurantId,
  )

  return (
    <div className="flex flex-col gap-3">
      <DrawReveal data={outcome} />

      <div className="flex flex-col gap-2">
        {winner ? (
          <a
            href={buildGoogleMapsUrl({ name: winner.name })}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-[var(--accent)] underline"
          >
            <ExternalLink size={12} />
            abrir no Google Maps
          </a>
        ) : null}

        <Link href={`/visits/${outcome.visitId}/rate`}>
          <Button variant="secondary" className="w-full">
            Dar as notas depois do rolê
          </Button>
        </Link>
      </div>
    </div>
  )
}

const ClosedSession = ({ isAdmin, onOpen, isOpening }: {
  isAdmin: boolean
  onOpen: () => void
  isOpening: boolean
}) => (
  <Card className="flex flex-col items-center gap-4 py-12 text-center">
    <p className="text-5xl">🍽️</p>
    <p className="text-lg font-semibold">Nenhum sorteio aberto</p>
    {isAdmin ? (
      <>
        <p className="text-xs text-[var(--muted)]">Abra a rodada pra galera entrar e ranquear.</p>
        <Button size="large" onClick={onOpen} disabled={isOpening} className="w-full">
          <Dices size={18} />
          Abrir sorteio
        </Button>
      </>
    ) : (
      <p className="text-xs text-[var(--muted)]">Espere o admin abrir a rodada.</p>
    )}
  </Card>
)

export const SessionScreen = () => {
  const queryClient = useQueryClient()
  const [draftRanking, setDraftRanking] = useState<string[] | null>(null)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [outcome, setOutcome] = useState<DrawOutcome | null>(null)

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: fetchSessionState,
    refetchInterval: 5000,
  })

  const catalogQuery = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const response = await apiClient.get<{ restaurants: CatalogRestaurant[] }>('/restaurants')
      return response.data.restaurants
    },
    enabled: isCatalogOpen,
  })

  const state: SessionState | undefined = sessionQuery.data
  const sessionId = state?.session?.id ?? null
  const ranking = draftRanking ?? state?.myRankedRestaurantIds ?? []

  const invalidateSession = () => queryClient.invalidateQueries({ queryKey: ['session'] })

  const openMutation = useMutation({
    mutationFn: () => apiClient.post('/sessions'),
    onSuccess: invalidateSession,
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível abrir')),
  })

  const addToPoolMutation = useMutation({
    mutationFn: (restaurantId: string) =>
      apiClient.post(`/sessions/${sessionId}/pool`, { restaurantId }),
    onSuccess: (_response, restaurantId) => {
      toast.success('Entrou na rodada e no seu rank')
      setDraftRanking((currentDraft) =>
        currentDraft === null || currentDraft.includes(restaurantId)
          ? currentDraft
          : [...currentDraft, restaurantId],
      )
      invalidateSession()
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível adicionar')),
  })

  const saveRankingMutation = useMutation({
    mutationFn: (rankedRestaurantIds: string[]) =>
      apiClient.put(`/sessions/${sessionId}/preferences`, { rankedRestaurantIds }),
    onSuccess: () => invalidateSession(),
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível salvar o rank')),
  })

  const persistRanking = (nextRanking: string[]) => {
    setDraftRanking(nextRanking)
    saveRankingMutation.mutate(nextRanking)
  }

  const readyMutation = useMutation({
    mutationFn: (isReady: boolean) => apiClient.post(`/sessions/${sessionId}/ready`, { isReady }),
    onSuccess: invalidateSession,
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível marcar')),
  })

  const banDecisionMutation = useMutation({
    mutationFn: (restaurantId: string | null) => apiClient.put('/vetoes', { restaurantId }),
    onSuccess: () => invalidateSession(),
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível votar')),
  })

  const startRunoffMutation = useMutation({
    mutationFn: () => apiClient.post(`/sessions/${sessionId}/ban-runoff`),
    onSuccess: () => {
      toast.info('Empate! Votação de desempate aberta.')
      invalidateSession()
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível desempatar')),
  })

  const clearBanDecisionMutation = useMutation({
    mutationFn: () => apiClient.delete('/vetoes'),
    onSuccess: () => invalidateSession(),
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível desfazer')),
  })

  const drawMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<DrawOutcome>(`/sessions/${sessionId}/draw`)
      return response.data
    },
    onSuccess: (data) => {
      setOutcome(data)
      invalidateSession()
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível sortear')),
  })

  if (sessionQuery.isLoading) return <p className="text-sm text-[var(--muted)]">Carregando...</p>
  if (!state) return <p className="text-sm text-[var(--muted)]">Não consegui carregar.</p>

  if (!state.session) {
    return (
      <div className="flex flex-col gap-5">
        {outcome ? <DrawOutcomeCard outcome={outcome} /> : null}
        <PendingRatings />
        <ClosedSession
          isAdmin={state.isAdmin}
          onOpen={() => openMutation.mutate()}
          isOpening={openMutation.isPending}
        />
      </div>
    )
  }

  const me = state.participants.find(
    (participant) => participant.memberId === state.currentMemberId,
  )
  const poolById = new Map(state.pool.map((item) => [item.restaurantId, item]))
  const availableToRank = state.pool.filter(
    (item) => !item.isBanned && !ranking.includes(item.restaurantId),
  )
  const alreadyInPool = new Set(state.pool.map((item) => item.restaurantId))
  const isRunoff = state.banRunoff.round > 1
  const runoffRestaurantIds = state.banRunoff.restaurantIds
  const votableForBan = runoffRestaurantIds
    ? state.pool.filter((item) => runoffRestaurantIds.includes(item.restaurantId))
    : state.pool

  return (
    <div className="flex flex-col gap-5">
      <PendingRatings />

      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold">Rodada {state.session.roundNumber}</h1>
        <span className="text-xs text-[var(--muted)]">
          {state.participants.filter((participant) => participant.isReady).length}/
          {state.participants.length} ready
        </span>
      </div>

      <Card
        className={classNames(
          'flex items-center justify-between gap-3 py-3',
          state.quorum.hasQuorum ? '' : 'border-[var(--warning)]',
        )}
      >
        <div>
          <p className="text-sm font-medium">
            {state.quorum.hasQuorum ? 'Quórum atingido' : 'Sem quórum'}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {state.quorum.presentCount} de {state.quorum.totalMemberCount} na sessão · precisa de{' '}
            {state.quorum.requiredCount}
          </p>
        </div>
        <span
          className={classNames(
            'shrink-0 text-lg font-semibold tabular-nums',
            state.quorum.hasQuorum ? 'text-[var(--success)]' : 'text-[var(--warning)]',
          )}
        >
          {state.quorum.presentCount}/{state.quorum.requiredCount}
        </span>
      </Card>

      <Card className="flex flex-col gap-2.5">
        {state.participants.map((participant) => (
          <div key={participant.memberId} className="flex items-center justify-between text-sm">
            <span className={classNames(participant.isReady ? '' : 'text-[var(--muted)]')}>
              {participant.isReady ? '✓' : '○'} {participant.displayName}
              {participant.memberId === state.currentMemberId ? (
                <span className="ml-1.5 text-[10px] uppercase text-[var(--accent)]">você</span>
              ) : null}
            </span>
            <span className="text-xs text-[var(--muted)]">
              {participant.rankedCount} lugar(es)
            </span>
          </div>
        ))}
      </Card>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Meu rank</h2>
          <Button variant="secondary" size="small" onClick={() => setIsCatalogOpen((open) => !open)}>
            {isCatalogOpen ? <X size={14} /> : <Plus size={14} />}
            {isCatalogOpen ? 'fechar' : 'adicionar'}
          </Button>
        </div>

        {ranking.length === 0 ? (
          <Card>
            <p className="text-xs text-[var(--muted)]">
              Você ainda não ranqueou nada. Sem rank você não participa do sorteio.
            </p>
          </Card>
        ) : null}

        {ranking.map((restaurantId, index) => {
          const item = poolById.get(restaurantId)
          if (!item) return null

          return (
            <Card key={restaurantId} className="flex items-center gap-3 py-3">
              <span className="w-5 text-center text-sm font-semibold text-[var(--accent)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.name}</p>
                <p className="truncate text-xs text-[var(--muted)]">
                  {[
                    item.cuisines.join(', ') || null,
                    item.neighborhood,
                    `indicação de ${item.addedByName}`,
                    item.putInRoundByName === item.addedByName
                      ? null
                      : `trazido por ${item.putInRoundByName}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => persistRanking(moveItem(ranking, index, index - 1))}
                  disabled={index === 0}
                >
                  <ArrowUp size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => persistRanking(moveItem(ranking, index, index + 1))}
                  disabled={index === ranking.length - 1}
                >
                  <ArrowDown size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() =>
                    persistRanking(ranking.filter((entry) => entry !== restaurantId))
                  }
                >
                  <X size={14} />
                </Button>
              </div>
            </Card>
          )
        })}

        {availableToRank.length > 0 ? (
          <Card className="flex flex-col gap-1.5">
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
              outros colocaram — toque pra entrar no seu rank
            </p>
            {availableToRank.map((item) => (
              <button
                key={item.restaurantId}
                onClick={() => persistRanking([...ranking, item.restaurantId])}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--surface-raised)]"
              >
                <span className="truncate">
                  {item.name}
                  <span className="ml-2 text-xs text-[var(--muted)]">{item.addedByName}</span>
                </span>
                <Plus size={14} />
              </button>
            ))}
          </Card>
        ) : null}

        {ranking.length > 0 ? (
          <p className="text-center text-[10px] uppercase tracking-wide text-[var(--muted)]">
            {saveRankingMutation.isPending ? 'salvando...' : 'salvo automaticamente'}
          </p>
        ) : null}
        {isCatalogOpen ? (
          <Card className="flex flex-col gap-2">
            <p className="text-xs text-[var(--muted)]">
              Toque num lugar pra colocar na rodada — ele já entra no fim do seu rank. Ou{' '}
              <Link href="/restaurants" className="text-[var(--accent)] underline">
                cadastre um novo
              </Link>
              .
            </p>
            {(catalogQuery.data ?? []).map((restaurant) => (
              <button
                key={restaurant.id}
                disabled={alreadyInPool.has(restaurant.id) || addToPoolMutation.isPending}
                onClick={() => addToPoolMutation.mutate(restaurant.id)}
                className="flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[var(--surface-raised)] disabled:opacity-40"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{restaurant.name}</span>
                  <span className="block truncate text-xs text-[var(--muted)]">
                    {[restaurant.cuisines.join(', ') || null, restaurant.neighborhood]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {restaurant.createdByName ? (
                    <span className="block truncate text-[10px] uppercase tracking-wide text-[var(--muted)]">
                      indicado por {restaurant.createdByName}
                    </span>
                  ) : null}
                </span>
                {alreadyInPool.has(restaurant.id) ? (
                  <Check size={14} className="shrink-0 text-[var(--success)]" />
                ) : (
                  <Plus size={14} className="shrink-0" />
                )}
              </button>
            ))}
          </Card>
        ) : null}
      </section>


      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">
            {isRunoff ? `Desempate · ${state.banRunoff.round}º turno` : 'Banir um lugar'}
          </h2>
          <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
            {state.banOutcome.decidedCount}/{state.banOutcome.participantCount} votaram
          </span>
        </div>

        <Card className="flex flex-col gap-2">
          {isRunoff ? (
            <p className="text-xs text-[var(--warning)]">
              Deu empate. Votem de novo, só entre os empatados. Se empatar outra vez, ninguém é
              banido.
            </p>
          ) : (
            <p className="text-xs text-[var(--muted)]">
              O mais votado fica fora do sorteio, e só 1 é banido por rodada. Votar é opcional, e o
              resultado só aparece depois do sorteio.
            </p>
          )}

          {votableForBan.map((item) => {
            const isMyVote = state.myBanVote === item.restaurantId

            return (
              <button
                key={item.restaurantId}
                onClick={() =>
                  banDecisionMutation.mutate(isMyVote ? null : item.restaurantId)
                }
                disabled={banDecisionMutation.isPending}
                className={classNames(
                  'flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                  item.isBanned
                    ? 'bg-red-500/15 text-red-300 line-through'
                    : isMyVote
                      ? 'bg-[var(--accent)]/15'
                      : 'bg-[var(--surface-raised)]',
                )}
              >
                <span className="min-w-0 truncate">
                  {item.name}
                  {isMyVote ? (
                    <span className="ml-2 text-[10px] uppercase text-[var(--accent)]">
                      seu voto
                    </span>
                  ) : null}
                  {item.isBanned ? (
                    <span className="ml-2 text-[10px] uppercase text-red-400">banido</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-[var(--muted)]">
                  {state.banOutcome.isRevealed && item.banVotes > 0
                    ? `${item.banVotes} voto(s)`
                    : ''}
                </span>
              </button>
            )
          })}

          {state.myBanVote ? (
            <button
              onClick={() => clearBanDecisionMutation.mutate()}
              className="text-[10px] uppercase tracking-wide text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              tirar meu voto
            </button>
          ) : null}

          {state.banOutcome.isRevealed ? null : (
            <p className="text-xs text-[var(--muted)]">
              Os votos ficam escondidos até o sorteio acontecer.
            </p>
          )}

          {state.banOutcome.isTied ? (
            <p className="text-xs text-[var(--warning)]">
              Empate na votação — ninguém foi banido nesta rodada.
            </p>
          ) : null}

          {state.banOutcome.isRevealed &&
          !state.banOutcome.isTied &&
          !state.banOutcome.bannedRestaurantId ? (
            <p className="text-xs text-[var(--muted)]">Ninguém quis banir nada nesta rodada.</p>
          ) : null}
        </Card>
      </section>

      {state.contenders.length > 0 ? (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Chances agora</h2>
            <Link href="/rules" className="text-[10px] uppercase tracking-wide text-[var(--accent)]">
              como é calculado
            </Link>
          </div>
          <Card className="flex flex-col gap-2.5">
            {state.contenders.map((contender) => (
              <div key={contender.restaurantId} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="truncate">{contender.name}</span>
                  <span className="tabular-nums">{formatPercentage(contender.chance)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                  <motion.div
                    className="h-full rounded-full bg-[var(--accent)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${contender.chance * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-[10px] text-[var(--muted)]">
                  {contender.supporters} quiseram · {contender.topChoiceCount} em 1º · indicação
                  de {contender.addedByName}
                </p>
                <p className="font-mono text-[10px] text-[var(--muted)]">
                  {contender.bordaPoints.toFixed(3)} pontos
                  {contender.ownerWeight !== 1
                    ? ` × ${contender.ownerWeight.toFixed(2)} (peso de ${contender.addedByName})`
                    : ''}
                  {contender.revisitWeight < 1
                    ? ` × ${contender.revisitWeight.toFixed(2)} (já foram)`
                    : ''}
                </p>
              </div>
            ))}
          </Card>
        </section>
      ) : null}

      <div className="flex gap-2">
        <Button
          variant={me?.isReady ? 'secondary' : 'primary'}
          size="large"
          className="flex-1"
          onClick={() => readyMutation.mutate(!me?.isReady)}
          disabled={readyMutation.isPending || ranking.length === 0}
        >
          <Check size={18} />
          {me?.isReady ? 'Cancelar ready' : 'Tô pronto'}
        </Button>
      </div>

      {state.needsBanRunoff ? (
        <Card className="flex flex-col items-center gap-3 border-[var(--warning)] py-6 text-center">
          <p className="text-2xl">🤝</p>
          <p className="text-sm font-medium">Empate na votação de banimento</p>
          <p className="text-xs text-[var(--muted)]">
            O sorteio fica travado até resolver. Todo mundo vota de novo, só entre os empatados.
          </p>
          <Button
            size="large"
            className="w-full"
            onClick={() => startRunoffMutation.mutate()}
            disabled={startRunoffMutation.isPending}
          >
            Abrir votação de desempate
          </Button>
        </Card>
      ) : null}

      <Button
        size="large"
        onClick={() => drawMutation.mutate()}
        disabled={
          !state.everyoneReady ||
          !state.quorum.hasQuorum ||
          state.needsBanRunoff ||
          drawMutation.isPending ||
          state.contenders.length === 0
        }
      >
        <motion.span
          animate={drawMutation.isPending ? { rotate: 1440 } : { rotate: 0 }}
          transition={{ duration: 2, ease: [0.2, 0.8, 0.3, 1] }}
          className="inline-flex"
        >
          <Dices size={20} />
        </motion.span>
        {drawMutation.isPending ? 'Sorteando...' : 'Sortear'}
      </Button>

      {state.quorum.hasQuorum ? null : (
        <p className="text-center text-xs text-[var(--warning)]">
          Faltam {state.quorum.requiredCount - state.quorum.presentCount} pessoa(s) entrarem na
          sessão para bater o quórum.
        </p>
      )}

      {state.quorum.hasQuorum && !state.everyoneReady ? (
        <p className="text-center text-xs text-[var(--muted)]">
          O sorteio destrava quando todo mundo der ready.
        </p>
      ) : null}

      {outcome ? <DrawOutcomeCard outcome={outcome} /> : null}
    </div>
  )
}
