'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { ArrowRight, Delete, Eye, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'
import { classNames } from '@/lib/utilities/classNames'

type SessionState = {
  visitId: string
  restaurantName: string
  recommendedByMemberId: string | null
  isRevealed: boolean
  pendingMembers: Array<{ id: string; displayName: string; hasRatingPin: boolean }>
  ratedMemberIds: string[]
}

type RevealResult = {
  revealed: true
  finalScore: number | null
  ratings: Array<{
    memberId: string
    displayName: string
    score: number
    comment: string | null
    isRecommender: boolean
  }>
}

type Stage = 'picking' | 'pin' | 'scoring' | 'handoff' | 'revealed'

type ActiveRating = {
  memberId: string
  pin: string
  score: number | null
}

const scoreOptions = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

const pinLength = 4

const resolveStage = (
  activeRating: ActiveRating | null,
  hasReveal: boolean,
  hasJustSubmitted: boolean,
): Stage => {
  if (hasReveal) return 'revealed'
  if (activeRating === null && hasJustSubmitted) return 'handoff'
  if (activeRating === null) return 'picking'
  if (activeRating.pin.length < pinLength) return 'pin'
  return 'scoring'
}

export const BlindRatingSession = ({ visitId }: { visitId: string }) => {
  const queryClient = useQueryClient()
  const commentRef = useRef<HTMLTextAreaElement>(null)
  const [activeRating, setActiveRating] = useState<ActiveRating | null>(null)

  const sessionQuery = useQuery({
    queryKey: ['rating-session', visitId],
    queryFn: async () => {
      const response = await apiClient.get<SessionState>(`/visits/${visitId}`)
      return response.data
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (submission: {
      memberId: string
      pin: string
      score: number
      comment: string
    }) => apiClient.post(`/visits/${visitId}/ratings`, submission),
    onSuccess: () => {
      const commentField = commentRef.current
      if (commentField) commentField.value = ''
      setActiveRating(null)
      queryClient.invalidateQueries({ queryKey: ['rating-session', visitId] })
    },
    onError: (error) => {
      setActiveRating((current) => (current ? { ...current, pin: '', score: null } : current))
      toast.error(extractErrorMessage(error, 'Não foi possível salvar a nota'))
    },
  })

  const revealMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<RevealResult>(`/visits/${visitId}/reveal`)
      return response.data
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Ainda não dá pra revelar')),
  })

  const session = sessionQuery.data
  const reveal = revealMutation.data
  const stage = resolveStage(activeRating, Boolean(reveal), submitMutation.isSuccess)

  if (sessionQuery.isLoading) return <p className="text-sm text-[var(--muted)]">Carregando...</p>
  if (!session) return <p className="text-sm text-[var(--muted)]">Visita não encontrada.</p>

  const activeMember = session.pendingMembers.find(
    (member) => member.id === activeRating?.memberId,
  )
  const everyoneRated = session.pendingMembers.length === 0

  const startRating = (memberId: string) => {
    submitMutation.reset()
    setActiveRating({ memberId, pin: '', score: null })
  }

  const leaveRating = () => {
    submitMutation.reset()
    setActiveRating(null)
  }

  const pressDigit = (digit: string) => {
    setActiveRating((current) =>
      current ? { ...current, pin: `${current.pin}${digit}`.slice(0, pinLength) } : current,
    )
  }

  const eraseDigit = () => {
    setActiveRating((current) => (current ? { ...current, pin: current.pin.slice(0, -1) } : current))
  }

  const selectScore = (option: number) => {
    setActiveRating((current) => (current ? { ...current, score: option } : current))
  }

  const submitRating = () => {
    if (!activeRating || activeRating.score === null) return
    submitMutation.mutate({
      memberId: activeRating.memberId,
      pin: activeRating.pin,
      score: activeRating.score,
      comment: commentRef.current?.value ?? '',
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-[var(--muted)]">avaliando</p>
        <h1 className="mt-1 text-xl font-semibold">{session.restaurantName}</h1>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {session.ratedMemberIds.length} de{' '}
          {session.ratedMemberIds.length + session.pendingMembers.length} já deram nota
        </p>
      </div>

      <AnimatePresence mode="wait">
        {stage === 'picking' && !everyoneRated ? (
          <motion.div key="picking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="flex flex-col gap-3">
              <p className="text-center text-sm text-[var(--muted)]">Quem está com o celular?</p>
              {session.pendingMembers.map((member) => (
                <Button
                  key={member.id}
                  variant="secondary"
                  size="large"
                  disabled={!member.hasRatingPin}
                  onClick={() => startRating(member.id)}
                >
                  {member.displayName}
                  {member.hasRatingPin ? null : ' (sem PIN)'}
                </Button>
              ))}
            </Card>
          </motion.div>
        ) : null}

        {stage === 'pin' && activeRating ? (
          <motion.div key="pin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="flex flex-col items-center gap-5">
              <div className="text-center">
                <Lock size={18} className="mx-auto text-[var(--muted)]" />
                <p className="mt-2 text-sm">Sua vez, {activeMember?.displayName}</p>
                <p className="text-xs text-[var(--muted)]">digite seu PIN</p>
              </div>

              <div className="flex gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={classNames(
                      'h-3.5 w-3.5 rounded-full border transition-colors',
                      index < activeRating.pin.length
                        ? 'border-[var(--accent)] bg-[var(--accent)]'
                        : 'border-[var(--border)]',
                    )}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <Button key={digit} variant="secondary" size="large" onClick={() => pressDigit(digit)}>
                    {digit}
                  </Button>
                ))}
                <Button variant="ghost" size="large" onClick={leaveRating}>
                  voltar
                </Button>
                <Button variant="secondary" size="large" onClick={() => pressDigit('0')}>
                  0
                </Button>
                <Button variant="ghost" size="large" onClick={eraseDigit}>
                  <Delete size={16} />
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : null}

        {stage === 'scoring' && activeRating ? (
          <motion.div key={`scoring-${activeRating.memberId}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="flex flex-col gap-4">
              <p className="text-center text-sm">
                {activeMember?.displayName}, que nota você dá?
              </p>

              <div className="text-center">
                <span className="text-5xl font-semibold tabular-nums">
                  {activeRating.score === null ? '—' : activeRating.score.toFixed(1)}
                </span>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5">
                {scoreOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => selectScore(option)}
                    className={classNames(
                      'h-10 w-12 rounded-lg border text-sm tabular-nums transition-colors',
                      activeRating.score === option
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                        : 'border-[var(--border)] bg-[var(--surface-raised)]',
                    )}
                  >
                    {option.toFixed(1)}
                  </button>
                ))}
              </div>

              <textarea
                ref={commentRef}
                placeholder="comentário (opcional)"
                maxLength={400}
                rows={2}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
              />

              <Button
                size="large"
                disabled={activeRating.score === null || submitMutation.isPending}
                onClick={submitRating}
              >
                Confirmar e passar
                <ArrowRight size={16} />
              </Button>
            </Card>
          </motion.div>
        ) : null}

        {stage === 'handoff' ? (
          <motion.div
            key="handoff"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="flex flex-col items-center gap-4 py-12 text-center">
              <motion.p
                animate={{ x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="text-5xl"
              >
                📱
              </motion.p>
              <p className="text-lg font-medium">Passe pro próximo</p>
              <p className="text-xs text-[var(--muted)]">a nota ficou guardada, ninguém viu</p>

              {everyoneRated ? (
                <Button size="large" onClick={() => revealMutation.mutate()} className="mt-2 w-full">
                  <Eye size={18} />
                  Revelar a nota final
                </Button>
              ) : (
                <Button variant="secondary" onClick={leaveRating} className="mt-2 w-full">
                  Próxima pessoa
                </Button>
              )}
            </Card>
          </motion.div>
        ) : null}

        {stage === 'picking' && everyoneRated ? (
          <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="text-4xl">🥁</p>
              <p className="text-sm">Todo mundo já deu nota</p>
              <Button size="large" onClick={() => revealMutation.mutate()} className="w-full">
                <Eye size={18} />
                Revelar a nota final
              </Button>
            </Card>
          </motion.div>
        ) : null}

        {stage === 'revealed' && reveal ? (
          <motion.div key="revealed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
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
                        <span className="ml-2 text-[10px] uppercase text-[var(--muted)]">
                          indicou
                        </span>
                      ) : null}
                    </p>
                    {rating.comment ? (
                      <p className="mt-0.5 text-xs text-[var(--muted)]">{rating.comment}</p>
                    ) : null}
                  </div>
                  <span className="text-xl font-semibold tabular-nums">
                    {rating.score.toFixed(1)}
                  </span>
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
                <p className="mt-2 text-xs text-[var(--muted)]">
                  quem não indicou pesou mais nessa conta
                </p>
              </Card>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
