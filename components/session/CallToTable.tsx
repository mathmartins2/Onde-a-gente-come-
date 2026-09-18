'use client'

import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'

const joinQueryFlag = 'entrar'

export const buildJoinUrl = () => `${window.location.origin}/?${joinQueryFlag}=1`

export const CallToTable = ({ roundNumber }: { roundNumber: number }) => {
  const [hasCopied, setHasCopied] = useState(false)

  const invite = async () => {
    const url = buildJoinUrl()
    const text = `Rodada ${roundNumber} tá aberta. Entra pra ranquear antes do sorteio:`

    if (navigator.share) {
      await navigator.share({ title: 'Onde a gente come', text, url }).catch(() => undefined)
      return
    }

    await navigator.clipboard.writeText(`${text} ${url}`).catch(() => {
      toast.error('Não consegui copiar o link')
    })
    setHasCopied(true)
    toast.success('Link copiado — manda no grupo')
    setTimeout(() => setHasCopied(false), 2500)
  }

  return (
    <Button variant="secondary" size="small" onClick={invite} className="shrink-0 whitespace-nowrap">
      {hasCopied ? <Check size={14} /> : <Share2 size={14} />}
      {hasCopied ? 'copiado' : 'chamar'}
      <span className="hidden sm:inline">a galera</span>
    </Button>
  )
}
