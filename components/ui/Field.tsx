import type { ComponentPropsWithRef, ReactNode } from 'react'
import { classNames } from '@/lib/utilities/classNames'

type FieldProps = {
  label: string
  error?: string
  hint?: ReactNode
  children: ReactNode
}

export const Field = ({ label, error, hint, children }: FieldProps) => (
  <label className="flex flex-col gap-2">
    <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
      {label}
    </span>
    {children}
    {hint ? <span className="text-xs leading-relaxed text-[var(--muted)]">{hint}</span> : null}
    {error ? (
      <span className="text-xs font-medium text-[var(--danger)]">{error}</span>
    ) : null}
  </label>
)

export const TextInput = ({ className, ...properties }: ComponentPropsWithRef<'input'>) => (
  <input
    className={classNames(
      'h-12 w-full rounded-[var(--radius-medium)] border border-[var(--border-strong)] bg-[var(--surface-sunken)] px-4 text-sm text-[var(--foreground)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)] transition-[border-color,box-shadow] duration-200 placeholder:text-[color-mix(in_srgb,var(--muted)_70%,transparent)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_22%,transparent)] focus:outline-none',
      className,
    )}
    {...properties}
  />
)
