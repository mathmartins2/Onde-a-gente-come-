import type { ReactNode } from 'react'

type EmptyStateProps = {
  glyph: string
  title: string
  description?: string
  action?: ReactNode
}

export const EmptyState = ({ glyph, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
    <p className="text-4xl">{glyph}</p>
    <p className="text-heading-md">{title}</p>
    {description ? <p className="text-body-sm max-w-xs text-ink-muted">{description}</p> : null}
    {action}
  </div>
)
