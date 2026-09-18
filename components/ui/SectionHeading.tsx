import type { ReactNode } from 'react'

type SectionHeadingProps = {
  title: string
  hint?: ReactNode
}

export const SectionHeading = ({ title, hint }: SectionHeadingProps) => (
  <div className="mb-2 flex items-baseline justify-between gap-3">
    <h2 className="text-heading-sm">{title}</h2>
    {hint ? <span className="text-micro-cap text-ink-faint">{hint}</span> : null}
  </div>
)
