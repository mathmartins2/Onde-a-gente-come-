import type { ReactNode } from 'react'
import { classNames } from '@/lib/utilities/classNames'

type CardProps = {
  className?: string
  children: ReactNode
}

export const Card = ({ className, children }: CardProps) => (
  <div
    className={classNames(
      'relative overflow-hidden rounded-xl border border-hairline bg-surface-1 p-4',
      className,
    )}
  >
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent)_28%,transparent),transparent)]"
    />
    {children}
  </div>
)
