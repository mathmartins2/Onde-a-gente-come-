'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { Download, Share2, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { canShareStoryFile, downloadStoryFile, fetchStoryFile, shareStoryFile } from '@/lib/share/shareStoryImage'
import { classNames } from '@/lib/utilities/classNames'

export const compactButtonClassName =
  'flex h-10 w-10 items-center justify-center rounded-full border border-hairline-strong bg-surface-2 text-ink transition-colors hover:border-accent hover:text-accent-hover disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]'

const menuItemClassName =
  'flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-body-sm text-ink transition-colors hover:bg-accent-tint hover:text-accent-hover focus-visible:bg-accent-tint focus-visible:outline-none'

export const ShareStoryButton = ({
  imagePath,
  fileName,
  label = 'Postar nos stories',
  variant = 'primary',
  preparingLabel = 'Preparando imagem…',
  icon: Icon = Share2,
  isCompact = false,
  className,
}: {
  imagePath: string
  fileName: string
  label?: string
  variant?: 'primary' | 'secondary'
  preparingLabel?: string
  icon?: LucideIcon
  isCompact?: boolean
  className?: string
}) => {
  const [isChoosing, setIsChoosing] = useState(false)
  const menuReference = useRef<HTMLDivElement>(null)

  const storyFileQuery = useQuery({
    queryKey: ['story-image', imagePath],
    queryFn: () => fetchStoryFile(imagePath, fileName),
    staleTime: 60_000,
    retry: 1,
  })

  const shareMutation = useMutation({
    mutationFn: ({ pendingShare }: { pendingShare: ReturnType<typeof shareStoryFile> }) => pendingShare,
    onSuccess: (outcome) => {
      if (outcome === 'downloaded') toast.success('Arquivo baixado. É só postar nos stories.')
    },
    onError: () => toast.error('Não consegui compartilhar agora'),
  })

  useEffect(() => {
    if (!isChoosing) return

    const closeWhenOutside = (event: PointerEvent) => {
      if (menuReference.current?.contains(event.target as Node)) return
      setIsChoosing(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsChoosing(false)
    }
    document.addEventListener('pointerdown', closeWhenOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeWhenOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isChoosing])

  const storyFile = storyFileQuery.data
  const isPreparing = storyFileQuery.isLoading || shareMutation.isPending
  const canShareDirectly = storyFile ? canShareStoryFile(storyFile) : false

  const shareDirectly = () => {
    setIsChoosing(false)
    if (!storyFile) return
    shareMutation.mutate({ pendingShare: shareStoryFile(storyFile) })
  }

  const download = () => {
    setIsChoosing(false)
    if (!storyFile) return
    downloadStoryFile(storyFile)
    toast.success('Arquivo baixado. É só postar nos stories.')
  }

  return (
    <div ref={menuReference} className={classNames('relative', className)}>
      {isCompact ? (
        <button
          type="button"
          disabled={isPreparing || !storyFile}
          aria-haspopup="menu"
          aria-expanded={isChoosing}
          aria-label={isPreparing ? preparingLabel : label}
          title={isPreparing ? preparingLabel : label}
          onClick={() => setIsChoosing((isOpen) => !isOpen)}
          className={classNames(compactButtonClassName, isPreparing ? 'animate-pulse' : '')}
        >
          <Icon size={18} />
        </button>
      ) : (
        <Button
          type="button"
          variant={variant}
          disabled={isPreparing || !storyFile}
          aria-haspopup="menu"
          aria-expanded={isChoosing}
          onClick={() => setIsChoosing((isOpen) => !isOpen)}
          className="w-full"
        >
          <Icon size={17} />
          {isPreparing ? preparingLabel : label}
        </Button>
      )}

      {isChoosing ? (
        <div
          role="menu"
          className={classNames(
            'absolute z-20 flex min-w-48 flex-col gap-0.5 rounded-xl border border-hairline-strong bg-surface-2 p-1.5 shadow-[var(--elevation-3)]',
            isCompact ? 'right-0 top-full mt-2' : 'inset-x-0 bottom-full mb-2',
          )}
        >
          {canShareDirectly ? (
            <button type="button" role="menuitem" onClick={shareDirectly} className={menuItemClassName}>
              <Share2 size={16} className="text-accent" />
              Compartilhar direto
            </button>
          ) : null}
          <button type="button" role="menuitem" onClick={download} className={menuItemClassName}>
            <Download size={16} className="text-accent" />
            Baixar arquivo
          </button>
        </div>
      ) : null}
    </div>
  )
}
