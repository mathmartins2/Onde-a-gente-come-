'use client'

import { useMutation } from '@tanstack/react-query'
import { Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'

const plainTextType = 'text/plain'

const writeToClipboard = (pendingText: Promise<string>) => {
  if (typeof ClipboardItem === 'undefined') return pendingText.then((text) => navigator.clipboard.writeText(text))
  return navigator.clipboard.write([
    new ClipboardItem({ [plainTextType]: pendingText.then((text) => new Blob([text], { type: plainTextType })) }),
  ])
}

export const CopyLinkButton = ({
  loadPath,
  label,
  successMessage,
  className,
}: {
  loadPath: () => Promise<string>
  label: string
  successMessage: string
  className?: string
}) => {
  const copyMutation = useMutation({
    mutationFn: () => writeToClipboard(loadPath().then((path) => new URL(path, window.location.origin).toString())),
    onSuccess: () => toast.success(successMessage),
    onError: () => toast.error('Não consegui copiar o link'),
  })

  return (
    <Button
      type="button"
      variant="secondary"
      size="small"
      disabled={copyMutation.isPending}
      onClick={() => copyMutation.mutate()}
      className={className}
    >
      <Link2 size={16} />
      {label}
    </Button>
  )
}
