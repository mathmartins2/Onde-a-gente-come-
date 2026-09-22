import { classNames } from '@/lib/utilities/classNames'

type MeterProps = {
  value: number
  tone?: 'accent' | 'muted'
  className?: string
}

export const Meter = ({ value, tone = 'accent', className }: MeterProps) => {
  const percentage = Math.min(Math.max(value, 0), 1) * 100

  return (
    <div
      role="meter"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={classNames('h-1.5 w-full overflow-hidden rounded-pill bg-surface-sunken', className)}
    >
      <div
        style={{ width: `${percentage}%` }}
        className={classNames(
          'h-full rounded-pill transition-[width] duration-500 ease-out',
          tone === 'accent'
            ? 'bg-accent'
            : 'bg-hairline-strong',
        )}
      />
    </div>
  )
}
