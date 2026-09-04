import type { ReactNode } from 'react'
import { classNames } from '@/lib/utilities/classNames'

type CardProps = {
  className?: string
  children: ReactNode
}

export const Card = ({ className, children }: CardProps) => (
  <div
    className={classNames(
      'relative rounded-[var(--radius-large)] border border-[var(--border)] bg-[linear-gradient(160deg,var(--surface-raised),var(--surface)_46%,var(--surface-sunken))] p-5 shadow-[var(--shadow-raised)]',
      className,
    )}
  >
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent)_30%,transparent),transparent)]"
    />
    {children}
  </div>
)
