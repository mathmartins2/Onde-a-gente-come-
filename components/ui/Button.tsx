'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { classNames } from '@/lib/utilities/classNames'

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 rounded-pill text-button-cap transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary:
          'bg-[linear-gradient(140deg,var(--accent-hover),var(--accent)_58%,var(--accent-press))] text-on-accent shadow-[var(--elevation-accent)] hover:brightness-110 hover:-translate-y-px',
        secondary:
          'border border-hairline-strong bg-surface-2 text-ink hover:border-accent hover:text-accent-hover',
        ghost:
          'text-ink-muted hover:bg-accent-tint hover:text-ink',
        danger:
          'border border-[color-mix(in_srgb,var(--danger)_38%,transparent)] bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_26%,transparent)]',
      },
      size: {
        small: 'h-10 px-4',
        medium: 'h-12 px-6',
        large: 'h-14 px-8 text-[0.9375rem]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'medium' },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export const Button = ({ className, variant, size, ...properties }: ButtonProps) => (
  <button className={classNames(buttonVariants({ variant, size }), className)} {...properties} />
)
