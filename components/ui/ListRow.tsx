import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { classNames } from '@/lib/utilities/classNames'

const listRowVariants = cva(
  'flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
  {
    variants: {
      state: {
        idle: 'bg-surface-2 hover:bg-surface-3',
        selected: 'bg-accent-tint text-ink',
        struck: 'bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[var(--danger)] line-through',
        plain: 'bg-transparent hover:bg-surface-2',
      },
    },
    defaultVariants: { state: 'idle' },
  },
)

type ListRowProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof listRowVariants> & {
    leading?: ReactNode
    trailing?: ReactNode
  }

export const ListRow = ({
  className,
  state,
  leading,
  trailing,
  children,
  ...properties
}: ListRowProps) => (
  <button className={classNames(listRowVariants({ state }), className)} {...properties}>
    <span className="flex min-w-0 items-center gap-2.5">
      {leading}
      <span className="min-w-0 truncate text-body-md">{children}</span>
    </span>
    {trailing ? <span className="flex shrink-0 items-center gap-2">{trailing}</span> : null}
  </button>
)
