import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { classNames } from '@/lib/utilities/classNames'

const badgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1 rounded-pill border px-2.5 text-micro-cap',
  {
    variants: {
      tone: {
        neutral: 'border-hairline-strong bg-surface-2 text-ink-muted',
        accent: 'border-accent/40 bg-accent-tint text-accent-hover',
        success: 'border-[color-mix(in_srgb,var(--success)_40%,transparent)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]',
        warning: 'border-[color-mix(in_srgb,var(--warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[var(--warning)]',
        danger: 'border-[color-mix(in_srgb,var(--danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[var(--danger)]',
        quiet: 'border-transparent bg-transparent px-0 text-ink-faint',
      },
      size: {
        small: 'h-6',
        medium: 'h-8',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'medium' },
  },
)

type BadgeProps = VariantProps<typeof badgeVariants> & {
  className?: string
  children: ReactNode
}

export const Badge = ({ className, tone, size, children }: BadgeProps) => (
  <span className={classNames(badgeVariants({ tone, size }), className)}>{children}</span>
)
