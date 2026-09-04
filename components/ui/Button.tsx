'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { classNames } from '@/lib/utilities/classNames'

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold tracking-[-0.01em] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary:
          'bg-[linear-gradient(140deg,var(--accent-soft),var(--accent)_58%,var(--accent-deep))] text-[#20100a] shadow-[var(--shadow-accent)] hover:brightness-110 hover:-translate-y-px',
        secondary:
          'border border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--foreground)] shadow-[var(--shadow-raised)] hover:border-[var(--accent)] hover:text-[var(--accent-soft)]',
        ghost:
          'text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] hover:text-[var(--foreground)]',
        danger:
          'border border-[color-mix(in_srgb,var(--danger)_38%,transparent)] bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_26%,transparent)]',
      },
      size: {
        small: 'h-10 px-4 text-[13px]',
        medium: 'h-12 px-6 text-sm',
        large: 'h-14 px-8 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'medium' },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export const Button = ({ className, variant, size, ...properties }: ButtonProps) => (
  <button className={classNames(buttonVariants({ variant, size }), className)} {...properties} />
)
