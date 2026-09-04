'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Check, Eye, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'
import { ratingCriteria } from '@/lib/scoring/configuration'
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
  const commentRef = useRef<HTMLTextAreaElement>(null)
  const [scores, setScores] = useState<CriteriaScores>(emptyCriteriaScores)
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false)

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
        comment: commentRef.current?.value ?? '',
      }),
  })

  useEffect(() => {
    if (hasLoadedDraft || draftQuery.isLoading) return

    const draft = draftQuery.data
    if (draft) {
      const restored = emptyCriteriaScores()
      ratingCriteria.forEach((criterion) => {
        const value = draft[criterion.key]
        if (value !== null && value !== undefined) restored[criterion.key] = value
      })
      setScores(restored)
      if (commentRef.current && draft.comment) commentRef.current.value = draft.comment
    }

    setHasLoadedDraft(true)
  }, [hasLoadedDraft, draftQuery.isLoading, draftQuery.data])

  const updateScores = (nextScores: CriteriaScores) => {
    setScores(nextScores)
    saveDraftMutation.mutate(nextScores)
  }

  const sessionQuery = useQuery({
    queryKey: ['rating-session', visitId],
    queryFn: async () => {
      const response = await apiClient.get<SessionState>(`/visits/${visitId}`)
      return response.data
    },
    refetchInterval: 5000,
  })

  const submitMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/visits/${visitId}/my-rating`, {
        ...scores,
        comment: commentRef.current?.value ?? '',
      }),
    onSuccess: () => {
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
  if (sessionQuery.isLoading) return <p className="text-sm text-[var(--muted)]">Carregando...</p>
  if (!session) return <p className="text-sm text-[var(--muted)]">Visita não encontrada.</p>

  const memberById = new Map(allMembers.map((member) => [member.id, member]))
  const hasRated = session.ratedMemberIds.includes(currentMemberId)
  const everyoneRated = session.pendingMembers.length === 0
  const reveal = revealMutation.data

  if (reveal) {
    return (
      <div className="flex flex-col gap-3">
        {reveal.ratings.map((rating, index) => (
          <motion.div
            key={rating.memberId}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.35 }}
          >
            <Card className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-sm">
                  {rating.displayName}
                  {rating.isRecommender ? (
                    <span className="ml-2 text-[10px] uppercase text-[var(--muted)]">colocou</span>
                  ) : null}
                </p>
                {rating.comment ? (
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{rating.comment}</p>
                ) : null}
              </div>
              <span className="text-xl font-semibold tabular-nums">{rating.score.toFixed(2)}</span>
            </Card>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: reveal.ratings.length * 0.35 + 0.3, type: 'spring' }}
        >
          <Card className="border-[var(--accent)] bg-gradient-to-b from-[var(--accent)]/15 to-transparent py-8 text-center">
            <p className="text-xs uppercase tracking-widest text-[var(--muted)]">nota final</p>
            <p className="mt-2 text-6xl font-semibold tabular-nums">
              {reveal.finalScore === null ? '—' : reveal.finalScore.toFixed(2)}
            </p>
            <div className="mt-4 flex flex-col gap-1.5 text-left">
              {ratingCriteria.map((criterion) => {
                const average = reveal.criteriaAverages[criterion.key]
                if (average === null || average === undefined) return null

                return (
                  <div
                    key={criterion.key}
                    className="flex items-baseline justify-between rounded-lg bg-[var(--surface-raised)] px-2.5 py-1.5 text-sm"
                  >
                    <span>{criterion.label}</span>
                    <span className="tabular-nums">{average.toFixed(1)}</span>
                  </div>
                )
              })}
            </div>

            <p className="mt-3 text-xs text-[var(--muted)]">
              quem não colocou o lugar pesou mais nessa conta
            </p>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-2.5">
        <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">quem já deu nota</p>
        {allMembers.map((member) => {
          const done = session.ratedMemberIds.includes(member.id)
          return (
            <div key={member.id} className="flex items-center justify-between text-sm">
              <span className={done ? '' : 'text-[var(--muted)]'}>
                {done ? '✓' : '○'} {member.displayName}
              </span>
              <span className="text-xs text-[var(--muted)]">
                {done ? 'guardada' : 'faltando'}
              </span>
            </div>
          )
        })}
      </Card>

      {hasRated ? (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <Lock size={20} className="text-[var(--muted)]" />
          <p className="text-sm">Sua nota está guardada</p>
          <p className="text-xs text-[var(--muted)]">
            {everyoneRated
              ? 'Todo mundo já deu. Pode revelar.'
              : `Faltam ${session.pendingMembers.length} pessoa(s).`}
          </p>
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
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-[var(--muted)]">sua nota</p>
            <span className="text-5xl font-semibold tabular-nums">
              {calculateAverage(scores).toFixed(2)}
            </span>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
              média dos {ratingCriteria.length} critérios
            </p>
          </div>

          <CriteriaForm scores={scores} onChange={updateScores} />

          {saveDraftMutation.isPending ? (
            <p className="text-center font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
              salvando rascunho...
            </p>
          ) : draftQuery.data ? (
            <p className="text-center font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
              rascunho salvo · só você vê
            </p>
          ) : null}

          <textarea
            ref={commentRef}
            placeholder="comentário (opcional)"
            maxLength={400}
            rows={2}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            onBlur={() => saveDraftMutation.mutate(scores)}
          />

          <Button
            size="large"
            disabled={submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            <Check size={18} />
            Guardar minha nota
          </Button>
        </Card>
      )}
    </div>
  )
}
