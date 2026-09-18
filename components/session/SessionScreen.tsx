'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Check,
  Dices,
  ExternalLink,
  Plus,
  Trophy,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ActionBar } from '@/components/ui/ActionBar'
import { Badge } from '@/components/ui/Badge'
import { Collapsible } from '@/components/ui/Collapsible'
import { Meter } from '@/components/ui/Meter'
import { ListRow } from '@/components/ui/ListRow'
import { StatTile } from '@/components/ui/StatTile'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'
import {
  fetchSessionState,
  type SessionRevealView,
  type SessionState,
} from '@/lib/http/sessionQueries'
import { sessionQueryKey, useSessionStream } from '@/lib/http/useSessionStream'
import { DrawReveal } from './DrawReveal'
import { PendingRatings } from './PendingRatings'
import { fetchHistory } from '@/lib/http/historyQueries'
import { formatDrawMoment, formatVisitDay } from '@/lib/utilities/formatDate'
import { scoreTextClassFor } from '@/lib/utilities/scoreTone'
import { CallToTable } from './CallToTable'
import { buildGoogleMapsUrl } from '@/lib/places/buildGoogleMapsUrl'
import { classNames } from '@/lib/utilities/classNames'

type CatalogRestaurant = {
  id: string
  name: string
  neighborhood: string | null
  cuisines: string[]
  createdByName: string | null
  isMine: boolean
}

const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`

const moveItem = (items: string[], fromIndex: number, toIndex: number) => {
  if (toIndex < 0 || toIndex >= items.length) return items
  const reordered = [...items]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)
  return reordered
}

const RevealCard = ({
  reveal,
  onClose,
  isClosing,
}: {
  reveal: SessionRevealView
  onClose: () => void
  isClosing: boolean
}) => {
  const [hasRevealFinished, setHasRevealFinished] = useState(false)
  const winner = reveal.contenders.find(
    (contender) => contender.restaurantId === reveal.restaurantId,
  )
  const revealData = useMemo(
    () => ({
      restaurantId: reveal.restaurantId,
      fallbackRestaurantId: reveal.fallbackRestaurantId,
      bannedRestaurantName: reveal.bannedRestaurantName,
      tiedRestaurantNames: reveal.banTiebreak.tiedRestaurantNames,
      wasBanDecidedByTiebreak: reveal.banTiebreak.wasDecidedByTiebreak,
      contenders: reveal.contenders,
    }),
    [
      reveal.restaurantId,
      reveal.fallbackRestaurantId,
      reveal.bannedRestaurantName,
      reveal.banTiebreak.tiedRestaurantNames,
      reveal.banTiebreak.wasDecidedByTiebreak,
      reveal.contenders,
    ],
  )
  const markRevealFinished = useCallback(() => setHasRevealFinished(true), [])

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col justify-center gap-4 lg:min-h-[calc(100dvh-6rem)]">
      <DrawReveal data={revealData} onFinished={markRevealFinished} />

      <div className={hasRevealFinished ? 'flex flex-col gap-2' : 'hidden'}>
        {winner ? (
          <a
            href={buildGoogleMapsUrl({ name: winner.name })}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-accent underline"
          >
            <ExternalLink size={12} />
            abrir no Google Maps
          </a>
        ) : null}

        {reveal.visitId ? (
          <Link href={`/visits/${reveal.visitId}/rate`}>
            <Button variant="secondary" className="w-full">
              Dar as notas depois do rolê
            </Button>
          </Link>
        ) : null}

        {reveal.canClose ? (
          <Button size="large" onClick={onClose} disabled={isClosing} className="w-full">
            Beleza, fechar a rodada
          </Button>
        ) : (
          <p className="text-center text-xs text-ink-muted">
            Quem sorteou encerra a revelação.
          </p>
        )}
      </div>
    </div>
  )
}

const ClosedSession = ({ isAdmin, onOpen, isOpening }: {
  isAdmin: boolean
  onOpen: () => void
  isOpening: boolean
}) => {
  const historyQuery = useQuery({ queryKey: ['history'], queryFn: fetchHistory })
  const rounds = historyQuery.data ?? []
  const lastRound = rounds.at(0)
  const ratedRounds = rounds.filter((round) => round.finalScore !== null)
  const averageScore =
    ratedRounds.length === 0
      ? null
      : ratedRounds.reduce((sum, round) => sum + (round.finalScore ?? 0), 0) / ratedRounds.length

  return (
    <div className="flex flex-col gap-4">
      <section className="relative overflow-hidden rounded-2xl border border-hairline bg-[linear-gradient(150deg,var(--surface-2),var(--surface-1)_55%,var(--canvas))] px-5 py-8 text-center">
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-32 w-56 -translate-x-1/2 rounded-full bg-accent opacity-[0.12] blur-3xl"
        />
        <p className="relative text-micro-cap text-accent">entre rodadas</p>
        <h1 className="font-display relative mt-1 text-display-large">
          Ninguém decidiu nada ainda
        </h1>
        <p className="relative mx-auto mt-2 max-w-sm text-body-sm text-ink-muted">
          {isAdmin
            ? 'Abra a rodada pra galera entrar, colocar lugar e ranquear.'
            : 'Quando o admin abrir a rodada, ela aparece aqui.'}
        </p>

        {isAdmin ? (
          <Button size="large" onClick={onOpen} disabled={isOpening} className="relative mt-5">
            <Dices size={19} />
            {isOpening ? 'Abrindo...' : 'Abrir sorteio'}
          </Button>
        ) : null}
      </section>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="rodadas" value={String(rounds.length)} />
        <StatTile
          label="média"
          value={averageScore === null ? '—' : averageScore.toFixed(2)}
          tone={averageScore !== null && averageScore >= 4 ? 'good' : 'neutral'}
        />
        <StatTile label="avaliadas" value={String(ratedRounds.length)} />
      </div>

      {lastRound ? (
        <Link href="/history" className="block">
          <Card className="flex items-center gap-3 transition-colors hover:border-accent">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-tint">
              <Trophy size={18} className="text-accent" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-micro-cap text-ink-faint">último rolê · rodada {lastRound.roundNumber}</p>
              <p className="truncate text-heading-md">{lastRound.winnerRestaurantName}</p>
              <p className="truncate text-caption">
                indicação de {lastRound.winnerNominatedByName} ·{' '}
                {lastRound.visitDateConfirmedAt && lastRound.visitedAt
                  ? formatVisitDay(lastRound.visitedAt)
                  : formatDrawMoment(lastRound.drawnAt)}
              </p>
            </div>
            {lastRound.finalScore === null ? (
              <Badge tone="quiet" size="small">
                sem nota
              </Badge>
            ) : (
              <span
                className={`text-numeric shrink-0 text-heading-lg ${scoreTextClassFor(lastRound.finalScore)}`}
              >
                {lastRound.finalScore.toFixed(2)}
              </span>
            )}
          </Card>
        </Link>
      ) : null}
    </div>
  )
}

export const SessionScreen = () => {
  const queryClient = useQueryClient()
  const [draftRanking, setDraftRanking] = useState<string[] | null>(null)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const { isStreaming } = useSessionStream()

  const sessionQuery = useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSessionState,
    refetchInterval: isStreaming ? false : 5000,
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

  const invalidateSession = () => queryClient.invalidateQueries({ queryKey: sessionQueryKey })

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

  const clearBanDecisionMutation = useMutation({
    mutationFn: () => apiClient.delete('/vetoes'),
    onSuccess: () => invalidateSession(),
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível desfazer')),
  })

  const drawMutation = useMutation({
    mutationFn: () => apiClient.post(`/sessions/${sessionId}/draw`),
    onSuccess: invalidateSession,
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível sortear')),
  })

  const joinMutation = useMutation({
    mutationFn: () => apiClient.post(`/sessions/${sessionId}/join`),
    onSuccess: () => {
      toast.success('Você entrou na rodada')
      invalidateSession()
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível entrar')),
  })

  const closeRevealMutation = useMutation({
    mutationFn: () => apiClient.post(`/sessions/${sessionId}/close`),
    onSuccess: invalidateSession,
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível encerrar')),
  })

  const canAutoJoin = Boolean(sessionId) && state?.hasJoined === false
  const joinRequested = joinMutation.isPending || joinMutation.isSuccess

  useEffect(() => {
    if (!canAutoJoin || joinRequested) return
    if (new URLSearchParams(window.location.search).get('entrar') !== '1') return
    joinMutation.mutate()
  }, [canAutoJoin, joinRequested, joinMutation])

  if (sessionQuery.isLoading) return <p className="text-body-sm text-ink-muted">Carregando...</p>
  if (!state) return <p className="text-sm text-ink-muted">Não consegui carregar.</p>

  if (!state.session) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col justify-center gap-4 lg:min-h-[calc(100dvh-6rem)]">
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
  const votableForBan = state.pool.filter((item) => !item.isMine)
  const hasAbstainedFromBan = state.hasDecidedBan && !state.myBanVote

  if (state.reveal) {
    return (
      <RevealCard
        key={state.reveal.drawId ?? state.session.id}
        reveal={state.reveal}
        onClose={() => closeRevealMutation.mutate()}
        isClosing={closeRevealMutation.isPending}
      />
    )
  }

  const readyCount = state.participants.filter((participant) => participant.isReady).length
  const canDraw =
    state.everyoneReady && state.quorum.hasQuorum && state.contenders.length > 0

  return (
    <div className="flex min-h-[calc(100dvh-8.5rem)] flex-col gap-4 lg:min-h-[calc(100dvh-5.5rem)]">
      <PendingRatings />

      <header className="relative overflow-hidden rounded-2xl border border-hairline bg-[linear-gradient(150deg,var(--surface-2),var(--surface-1)_55%,var(--canvas))] px-5 py-5">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full bg-accent opacity-[0.14] blur-3xl"
        />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-micro-cap text-accent">rodada aberta</p>
            <h1 className="font-display mt-1 text-display-large">
              Rodada {state.session.roundNumber}
            </h1>
          </div>
          <CallToTable roundNumber={state.session.roundNumber} />
        </div>

        {state.hasJoined ? null : (
          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent-tint px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body-sm">
              Você ainda não está na mesa desta rodada.
            </p>
            <Button
              size="small"
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
            >
              Entrar na rodada
            </Button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatTile
            label="mesa"
            value={`${state.quorum.presentCount}/${state.quorum.totalMemberCount}`}
            tone={state.quorum.hasQuorum ? 'good' : 'warn'}
          />
          <StatTile
            label="prontos"
            value={`${readyCount}/${state.participants.length}`}
            tone={state.everyoneReady ? 'good' : 'neutral'}
          />
          <StatTile label="disputa" value={String(state.pool.length)} tone="neutral" />
        </div>
      </header>

      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
        <div className="flex flex-col gap-3">
          <Collapsible
            title="Meu rank"
            summary={ranking.length === 0 ? 'vazio' : `${ranking.length} lugar(es)`}
            defaultOpen={ranking.length === 0 || !me?.isReady}
          >
            <div className="flex flex-col gap-2">
              {ranking.length === 0 ? (
                <p className="text-body-sm text-ink-muted">
                  Você ainda não ranqueou nada. Sem rank você não participa do sorteio.
                </p>
              ) : null}

              {ranking.map((restaurantId, index) => {
                const item = poolById.get(restaurantId)
                if (!item) return null

                return (
                  <div
                    key={restaurantId}
                    className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-2 px-3 py-2.5"
                  >
                    <span className="text-numeric flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-tint text-body-sm font-bold text-accent">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-md font-medium">{item.name}</p>
                      <p className="truncate text-caption">
                        {[item.cuisines.join(', ') || null, item.neighborhood]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      {item.isPreviousWinner ? (
                        <Badge tone="warning" size="small" className="mt-1">
                          foi o último · fora desta rodada
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col">
                      <button
                        aria-label="Subir"
                        onClick={() => persistRanking(moveItem(ranking, index, index - 1))}
                        disabled={index === 0}
                        className="flex h-6 w-8 items-center justify-center rounded text-ink-muted transition-colors hover:text-accent disabled:opacity-30"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        aria-label="Descer"
                        onClick={() => persistRanking(moveItem(ranking, index, index + 1))}
                        disabled={index === ranking.length - 1}
                        className="flex h-6 w-8 items-center justify-center rounded text-ink-muted transition-colors hover:text-accent disabled:opacity-30"
                      >
                        <ArrowDown size={15} />
                      </button>
                    </div>
                    <button
                      aria-label={`Tirar ${item.name} do rank`}
                      onClick={() => persistRanking(ranking.filter((entry) => entry !== restaurantId))}
                      className="flex h-11 w-9 shrink-0 items-center justify-center rounded text-ink-faint transition-colors hover:text-[var(--danger)]"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )
              })}

              {availableToRank.length > 0 ? (
                <div className="flex flex-col gap-1 rounded-lg border border-dashed border-hairline-strong p-2">
                  <p className="px-1 text-micro-cap text-ink-faint">
                    outros colocaram — toque pra entrar no seu rank
                  </p>
                  {availableToRank.map((item) => (
                    <ListRow
                      key={item.restaurantId}
                      state="plain"
                      onClick={() => persistRanking([...ranking, item.restaurantId])}
                      trailing={<Plus size={15} className="text-accent" />}
                    >
                      {item.name}
                    </ListRow>
                  ))}
                </div>
              ) : null}

              <Button
                variant="secondary"
                size="small"
                onClick={() => setIsCatalogOpen((open) => !open)}
                className="self-start"
              >
                {isCatalogOpen ? <X size={14} /> : <Plus size={14} />}
                {isCatalogOpen ? 'fechar catálogo' : 'adicionar lugar'}
              </Button>

              {isCatalogOpen ? (
                <div className="flex flex-col gap-1 rounded-lg border border-hairline bg-surface-sunken p-2">
                  <p className="px-1 text-caption">
                    Toque num lugar pra colocar na rodada. Ou{' '}
                    <Link href="/restaurants" className="text-accent underline">
                      cadastre um novo
                    </Link>
                    .
                  </p>
                  {(catalogQuery.data ?? []).map((restaurant) => (
                    <ListRow
                      key={restaurant.id}
                      state="plain"
                      disabled={alreadyInPool.has(restaurant.id) || addToPoolMutation.isPending}
                      onClick={() => addToPoolMutation.mutate(restaurant.id)}
                      className="disabled:opacity-40"
                      trailing={
                        alreadyInPool.has(restaurant.id) ? (
                          <Check size={15} className="text-[var(--success)]" />
                        ) : (
                          <Plus size={15} />
                        )
                      }
                    >
                      {restaurant.name}
                    </ListRow>
                  ))}
                </div>
              ) : null}

              {ranking.length > 0 ? (
                <p className="text-micro-cap text-ink-faint">
                  {saveRankingMutation.isPending ? 'salvando...' : 'salvo automaticamente'}
                </p>
              ) : null}
            </div>
          </Collapsible>

          <Collapsible
            title="Banir um lugar"
            summary={`${state.banOutcome.decidedCount}/${state.banOutcome.participantCount}`}
            defaultOpen={!state.hasDecidedBan}
          >
            <div className="flex flex-col gap-2">
              <p className="text-caption">
                O mais votado fica fora do sorteio, e só 1 é banido por rodada. Votar é opcional e o
                resultado só aparece depois do sorteio. Empatou? A gente sorteia quem cai na hora.
              </p>

              {votableForBan.map((item) => {
                const isMyVote = state.myBanVote === item.restaurantId

                return (
                  <ListRow
                    key={item.restaurantId}
                    state={item.isBanned ? 'struck' : isMyVote ? 'selected' : 'idle'}
                    disabled={banDecisionMutation.isPending}
                    onClick={() => banDecisionMutation.mutate(isMyVote ? null : item.restaurantId)}
                    trailing={
                      <>
                        {isMyVote ? (
                          <Badge tone="accent" size="small">
                            seu voto
                          </Badge>
                        ) : null}
                        {item.banVotes > 0 ? (
                          <span className="text-numeric text-caption">{item.banVotes}</span>
                        ) : null}
                      </>
                    }
                  >
                    {item.name}
                  </ListRow>
                )
              })}

              <ListRow
                state={hasAbstainedFromBan ? 'selected' : 'idle'}
                disabled={banDecisionMutation.isPending}
                onClick={() => banDecisionMutation.mutate(null)}
                leading={<Ban size={15} className="text-ink-faint" />}
                trailing={
                  hasAbstainedFromBan ? (
                    <Badge tone="accent" size="small">
                      seu voto
                    </Badge>
                  ) : null
                }
              >
                Não banir ninguém
              </ListRow>

              {state.hasDecidedBan ? (
                <button
                  onClick={() => clearBanDecisionMutation.mutate()}
                  className="self-start text-micro-cap text-ink-faint transition-colors hover:text-ink"
                >
                  tirar meu voto
                </button>
              ) : null}
            </div>
          </Collapsible>
        </div>

        <div className="flex flex-col gap-3">
          <Collapsible
            title="Chances agora"
            summary={state.contenders.length === 0 ? 'sem ninguém' : 'sem contar o ban'}
            defaultOpen
          >
            <div className="flex flex-col gap-3">
              {state.contenders.length === 0 ? (
                <p className="text-body-sm text-ink-muted">
                  Ninguém ranqueou nada ainda — as chances aparecem quando o rank começar.
                </p>
              ) : null}

              {state.contenders.map((contender) => (
                <div key={contender.restaurantId} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-body-md">{contender.name}</span>
                    <span className="text-numeric shrink-0 text-body-sm text-accent">
                      {formatPercentage(contender.chance)}
                    </span>
                  </div>
                  <Meter value={contender.chance} />
                  <p className="text-caption">
                    {contender.supporters} quiseram
                    {contender.topChoiceCount > 0 ? ` · ${contender.topChoiceCount} em 1º` : ''}
                  </p>
                </div>
              ))}
            </div>
          </Collapsible>

          <Collapsible
            title="Quem tá na mesa"
            summary={`${readyCount}/${state.participants.length}`}
            defaultOpen={!state.quorum.hasQuorum}
          >
            <div className="flex flex-col gap-2">
              {state.participants.map((participant) => (
                <div
                  key={participant.memberId}
                  className="flex items-center justify-between gap-3 text-body-md"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={classNames(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]',
                        participant.isReady
                          ? 'bg-[color-mix(in_srgb,var(--success)_20%,transparent)] text-[var(--success)]'
                          : 'bg-surface-3 text-ink-faint',
                      )}
                    >
                      {participant.isReady ? '✓' : '·'}
                    </span>
                    <span className="truncate">{participant.displayName}</span>
                    {participant.memberId === state.currentMemberId ? (
                      <Badge tone="accent" size="small">
                        você
                      </Badge>
                    ) : null}
                  </span>
                  <span className="text-caption shrink-0">{participant.rankedCount} lugar(es)</span>
                </div>
              ))}

              {state.quorum.hasQuorum ? null : (
                <p className="text-body-sm text-[var(--warning)]">
                  Faltam {state.quorum.requiredCount - state.quorum.presentCount} pessoa(s) pra bater
                  o quórum.
                </p>
              )}
            </div>
          </Collapsible>
        </div>
      </div>

      {state.quorum.hasQuorum && !state.everyoneReady ? (
        <p className="text-center text-caption">O sorteio destrava quando todo mundo der ready.</p>
      ) : null}

      <div className="mt-auto" />

      <ActionBar>
        <Button
          variant={me?.isReady ? 'secondary' : 'primary'}
          size="large"
          className="flex-1"
          onClick={() => readyMutation.mutate(!me?.isReady)}
          disabled={readyMutation.isPending || ranking.length === 0}
        >
          <Check size={18} />
          {me?.isReady ? 'Cancelar' : 'Tô pronto'}
        </Button>

        <Button
          size="large"
          className="flex-[1.4]"
          onClick={() => drawMutation.mutate()}
          disabled={!canDraw || drawMutation.isPending}
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
      </ActionBar>
    </div>
  )
}
