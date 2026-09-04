'use client'

import { useMutation } from '@tanstack/react-query'
import { toPng } from 'html-to-image'
import { Share2 } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'

type ShareCardProps = {
  restaurantName: string
  nominatedBy: string
  roundNumber: number
  neighborhood: string | null
  cuisines: string[]
}

export const ShareCard = ({
  restaurantName,
  nominatedBy,
  roundNumber,
  neighborhood,
  cuisines,
}: ShareCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null)

  const shareMutation = useMutation({
    mutationFn: async () => {
      const cardElement = cardRef.current
      if (!cardElement) return

      const dataUrl = await toPng(cardElement, { pixelRatio: 2, backgroundColor: '#0b0b0f' })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `role-${roundNumber}.png`, { type: 'image/png' })

      const canShareFile =
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })

      if (canShareFile) {
        await navigator.share({ files: [file], title: 'Rolê sorteado' })
        return
      }

      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `role-${roundNumber}.png`
      link.click()
      toast.success('Imagem baixada')
    },
    onError: () => toast.error('Não consegui gerar a imagem'),
  })

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={cardRef}
        className="rounded-2xl border border-[var(--accent)] bg-[var(--surface)] p-7 text-center"
      >
        <p className="text-4xl">🍽️</p>
        <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
          rolê #{roundNumber} sorteado
        </p>
        <p className="mt-2 text-2xl font-semibold leading-tight">{restaurantName}</p>
        {cuisines.length > 0 || neighborhood ? (
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            {[cuisines.join(', ') || null, neighborhood].filter(Boolean).join(' · ')}
          </p>
        ) : null}
        <p className="mt-4 text-xs text-[var(--muted)]">indicação de {nominatedBy}</p>
      </div>

      <Button
        variant="secondary"
        onClick={() => shareMutation.mutate()}
        disabled={shareMutation.isPending}
      >
        <Share2 size={16} />
        {shareMutation.isPending ? 'Gerando...' : 'Mandar no zap'}
      </Button>
    </div>
  )
}
