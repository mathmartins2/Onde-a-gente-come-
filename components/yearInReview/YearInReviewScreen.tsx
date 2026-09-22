'use client'

import { useQuery } from '@tanstack/react-query'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiClient } from '@/lib/http/apiClient'
import type { ClientYearInReview } from '@/lib/services/yearInReviewService'
import { YearInReviewStories } from './YearInReviewStories'

export const yearInReviewQueryKey = ['year-in-review'] as const

export const YearInReviewScreen = () => {
  const [isPlaying, setIsPlaying] = useState(false)

  const yearInReviewQuery = useQuery({
    queryKey: yearInReviewQueryKey,
    queryFn: async () => (await apiClient.get<ClientYearInReview>('/year-in-review')).data,
  })

  if (yearInReviewQuery.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  const yearInReview = yearInReviewQuery.data
  if (!yearInReview) return <p className="text-body-sm text-ink-muted">Não deu pra carregar a retrospectiva.</p>

  if (!yearInReview.isAvailable) {
    return (
      <Card>
        <EmptyState
          glyph="⏳"
          title="Volta quando tiver mais rolês"
          description={`A retrospectiva de ${yearInReview.year} abre com ${yearInReview.minimumOutingCount} saídas. Até agora foram ${yearInReview.outingCount}.`}
        />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="relative flex flex-col gap-5 overflow-hidden py-8">
        <span className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--accent)_45%,transparent),transparent_68%)]" />
        <div className="relative">
          <p className="text-micro-cap text-accent">retrospectiva</p>
          <h1 className="font-display mt-1 text-display-hero">{yearInReview.year}</h1>
          <p className="mt-2 max-w-prose text-body-md text-ink-muted">
            {yearInReview.outingCount} saídas até agora. {yearInReview.slides.length} telas sobre a mesa e uma só sua,
            e cada uma vira story pro Instagram.
          </p>
        </div>
        <Button size="large" onClick={() => setIsPlaying(true)} className="relative w-full sm:w-auto sm:self-start">
          <Play size={18} />
          Começar
        </Button>
      </Card>
      <p className="px-1 text-caption">
        Toque na direita pra avançar, na esquerda pra voltar, e segure pra pausar. O ano vai se atualizando até dezembro.
      </p>

      {isPlaying ? <YearInReviewStories yearInReview={yearInReview} onClose={() => setIsPlaying(false)} /> : null}
    </div>
  )
}
