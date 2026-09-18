import { classNames } from '@/lib/utilities/classNames'

const toneClasses = {
  good: 'text-[var(--success)]',
  warn: 'text-[var(--warning)]',
  neutral: 'text-ink',
}

type StatTileProps = {
  label: string
  value: string
  tone?: keyof typeof toneClasses
}

export const StatTile = ({ label, value, tone = 'neutral' }: StatTileProps) => (
  <div className="rounded-lg border border-hairline bg-surface-sunken px-3 py-2">
    <p className="truncate text-micro-cap text-ink-faint">{label}</p>
    <p className={classNames('text-numeric text-heading-md', toneClasses[tone])}>{value}</p>
  </div>
)
