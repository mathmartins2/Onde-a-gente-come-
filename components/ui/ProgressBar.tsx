import { classNames } from '@/lib/utilities/classNames'

const minimumVisiblePercentage = 3

export const ProgressBar = ({ percentage, label, className }: { percentage: number; label: string; className?: string }) => {
  const visiblePercentage = Math.min(100, Math.max(percentage, minimumVisiblePercentage))

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
      className={classNames('relative h-2 w-full rounded-pill bg-surface-sunken', className)}
    >
      <div
        style={{ width: `${visiblePercentage}%` }}
        className="relative h-full overflow-hidden rounded-pill bg-[linear-gradient(90deg,var(--accent-press),var(--accent),var(--accent-hover))] shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_45%,transparent)] transition-[width] duration-700 ease-out"
      >
        <span
          aria-hidden
          className="progress-sheen absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)]"
        />
      </div>
      <span
        aria-hidden
        style={{ left: `calc(${visiblePercentage}% - 5px)` }}
        className="progress-tip pointer-events-none absolute top-1/2 h-2.5 w-2.5 rounded-full bg-[var(--accent-hover)] shadow-[0_0_10px_var(--accent)] transition-[left] duration-700 ease-out"
      />
    </div>
  )
}
