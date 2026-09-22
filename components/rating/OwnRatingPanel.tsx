'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Check, Eye, Lock, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'
import { ratingCriteria } from '@/lib/scoring/configuration'
import { ScoreReveal } from './ScoreReveal'
import { useVisitStream, visitQueryKey } from '@/lib/http/useVisitStream'
import {
  CriteriaForm,
  calculateAverage,
  emptyCriteriaScores,
  type CriteriaScores,
} from './CriteriaForm'

type SessionState = {
  visitId: string
  restaurantName: string
  isRevealed: boolean
  pendingMembers: Array<{ id: string; displayName: string }>
  ratedMemberIds: string[]
  reveal: (RevealResult & { revealed: true }) | null
}

type RevealResult = {
  finalScore: number | null
  criteriaAverages: Record<string, number | null>
  ratings: Array<{
    memberId: string
    displayName: string
    score: number
    flavor: number | null
    price: number | null
    service: number | null
    ambience: number | null
    menu: number | null
    waitTime: number | null
    comment: string | null
    isRecommender: boolean
  }>
}

type OwnRatingPanelProps = {
  visitId: string
  currentMemberId: string
  allMembers: Array<{ id: string; displayName: string }>
}

export const OwnRatingPanel = ({ visitId, currentMemberId, allMembers }: OwnRatingPanelProps) => {
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')
  const [scores, setScores] = useState<CriteriaScores>(emptyCriteriaScores)
  const [loadedDraftState, setLoadedDraftState] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const draftQuery = useQuery({
    queryKey: ['rating-draft', visitId],
    queryFn: async () => {
      const response = await apiClient.get<{
        draft: (CriteriaScores & { comment: string | null }) | null
      }>(`/visits/${visitId}/draft`)
      return response.data.draft
    },
    staleTime: Infinity,
  })

  const saveDraftMutation = useMutation({
    mutationFn: (nextScores: CriteriaScores) =>
      apiClient.put(`/visits/${visitId}/draft`, {
        ...nextScores,
        comment,
      }),
  })

  const draftState = draftQuery.isLoading ? null : draftQuery.data ? 'restored' : 'empty'

  if (draftState && draftState !== loadedDraftState) {
    const draft = draftQuery.data
    if (draft) {
      const restored = emptyCriteriaScores()
      ratingCriteria.forEach((criterion) => {
        const value = draft[criterion.key]
        if (value !== null && value !== undefined) restored[criterion.key] = value
      })
      setScores(restored)
      setComment(draft.comment ?? '')
    }
    setLoadedDraftState(draftState)
  }

  const updateScores = (nextScores: CriteriaScores) => {
    setScores(nextScores)
    saveDraftMutation.mutate(nextScores)
  }

  const { isStreaming } = useVisitStream(visitId)

  const sessionQuery = useQuery({
    queryKey: visitQueryKey(visitId),
    queryFn: async () => {
      const response = await apiClient.get<SessionState>(`/visits/${visitId}`)
      return response.data
    },
    refetchInterval: isStreaming ? false : 5000,
  })

  const submitMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/visits/${visitId}/my-rating`, {
        ...scores,
        comment,
      }),
    onSuccess: () => {
      setIsEditing(false)
      toast.success('Nota guardada. Ninguém vê até todo mundo dar.')
      queryClient.invalidateQueries({ queryKey: ['rating-session', visitId] })
      queryClient.invalidateQueries({ queryKey: ['rating-draft', visitId] })
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Não foi possível salvar')),
  })

  const revealMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<RevealResult>(`/visits/${visitId}/reveal`)
      return response.data
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Ainda não dá pra revelar')),
  })

  const session = sessionQuery.data
  if (sessionQuery.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }
  if (!session) return <p className="text-body-sm text-ink-muted">Visita não encontrada.</p>

  const hasRated = session.ratedMemberIds.includes(currentMemberId)
  const everyoneRated = session.pendingMembers.length === 0
  const reveal = session?.reveal?.revealed ? session.reveal : null

  if (reveal) {
    return <ScoreReveal data={reveal} shareImagePath={`/api/visits/${visitId}/story`} visitId={visitId} />
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-2.5">
        <p className="text-micro-cap text-ink-faint">quem já deu nota</p>
        {allMembers.map((member) => {
          const done = session.ratedMemberIds.includes(member.id)
          return (
            <div key={member.id} className="flex items-center justify-between text-sm">
              <span className={done ? '' : 'text-ink-muted'}>
                {done ? '✓' : '○'} {member.displayName}
              </span>
              <span className="text-caption">
                {done ? 'guardada' : 'faltando'}
              </span>
            </div>
          )
        })}
      </Card>

      {hasRated && !isEditing ? (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <Lock size={20} className="text-ink-muted" />
          <p className="text-sm">Sua nota está guardada</p>
          <p className="text-caption">
            {everyoneRated
              ? 'Todo mundo já deu. Pode revelar.'
              : `Faltam ${session.pendingMembers.length} pessoa(s).`}
          </p>

          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              setLoadedDraftState(null)
              setIsEditing(true)
            }}
          >
            <Pencil size={14} />
            Mudar minha nota
          </Button>

          {everyoneRated ? (
            <Button
              size="large"
              className="mt-2 w-full"
              onClick={() => revealMutation.mutate()}
              disabled={revealMutation.isPending}
            >
              <Eye size={18} />
              Revelar a nota final
            </Button>
          ) : null}
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          {isEditing ? (
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                mudando sua nota
              </span>
              <Button variant="ghost" size="small" onClick={() => setIsEditing(false)}>
                <X size={14} />
              </Button>
            </div>
          ) : null}

          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-ink-muted">sua nota</p>
            <span className="text-5xl font-semibold tabular-nums">
              {calculateAverage(scores).toFixed(2)}
            </span>
            <p className="mt-1 text-micro-cap text-ink-faint">
              média dos {ratingCriteria.length} critérios
            </p>
          </div>

          <CriteriaForm scores={scores} onChange={updateScores} />

          {saveDraftMutation.isPending ? (
            <p className="text-center font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted">
              salvando rascunho...
            </p>
          ) : draftQuery.data ? (
            <p className="text-center font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted">
              rascunho salvo · só você vê
            </p>
          ) : null}

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="comentário (opcional)"
            maxLength={400}
            rows={2}
            className="rounded-xl border border-hairline bg-surface-1 p-3 text-sm placeholder:text-ink-muted focus:border-[var(--accent)] focus:outline-none"
            onBlur={() => saveDraftMutation.mutate(scores)}
          />

          <Button
            size="large"
            disabled={submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            <Check size={18} />
            {isEditing ? 'Salvar a mudança' : 'Guardar minha nota'}
          </Button>
        </Card>
      )}
    </div>
  )
}
