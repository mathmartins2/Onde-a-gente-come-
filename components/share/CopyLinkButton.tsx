'use client'

import { useMutation } from '@tanstack/react-query'
import { Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { compactButtonClassName } from '@/components/share/ShareStoryButton'
import { Button } from '@/components/ui/Button'
import { classNames } from '@/lib/utilities/classNames'

const plainTextType = 'text/plain'

class ClipboardUnavailableError extends Error {}

const writeTextToClipboard = (pendingUrl: Promise<string>) =>
  pendingUrl.then((url) => {
    if (!navigator.clipboard?.writeText) throw new ClipboardUnavailableError()
    return navigator.clipboard.writeText(url)
  })

const writeUrlToClipboard = (pendingUrl: Promise<string>) => {
  const canWriteClipboardItem = typeof ClipboardItem !== 'undefined' && Boolean(navigator.clipboard?.write)
  if (!canWriteClipboardItem) return writeTextToClipboard(pendingUrl)

  return navigator.clipboard
    .write([new ClipboardItem({ [plainTextType]: pendingUrl.then((url) => new Blob([url], { type: plainTextType })) })])
    .catch(() => writeTextToClipboard(pendingUrl))
}

const showManualCopyFallback = (pendingUrl: Promise<string>) =>
  pendingUrl
    .then((url) => toast.error('Não deu pra copiar sozinho. Copia o link:', { description: url, duration: 20_000 }))
    .catch(() => toast.error('Não consegui gerar o link agora'))

export const CopyLinkButton = ({
  loadPath,
  label,
  successMessage,
  isCompact = false,
  className,
}: {
  loadPath: () => Promise<string>
  label: string
  successMessage: string
  isCompact?: boolean
  className?: string
}) => {
  const copyMutation = useMutation({
    mutationFn: ({ pendingCopy }: { pendingUrl: Promise<string>; pendingCopy: Promise<void> }) => pendingCopy,
    onSuccess: () => toast.success(successMessage),
    onError: (_error, { pendingUrl }) => showManualCopyFallback(pendingUrl),
  })

  const startCopy = () => {
    const pendingUrl = loadPath().then((path) => new URL(path, window.location.origin).toString())
    copyMutation.mutate({ pendingUrl, pendingCopy: writeUrlToClipboard(pendingUrl) })
  }

  if (isCompact) {
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        disabled={copyMutation.isPending}
        onClick={startCopy}
        className={classNames(compactButtonClassName, className)}
      >
        <Link2 size={18} />
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="small"
      disabled={copyMutation.isPending}
      onClick={startCopy}
      className={className}
    >
      <Link2 size={16} />
      {label}
    </Button>
  )
}
