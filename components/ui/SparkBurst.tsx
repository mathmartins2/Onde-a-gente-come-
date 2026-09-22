import type { CSSProperties } from 'react'
import { classNames } from '@/lib/utilities/classNames'

const sparkCount = 12
const sparkColors = ['var(--accent)', 'var(--herb)', 'var(--accent-hover)', 'var(--berry)']
const sparkReaches = ['4.5rem', '3.25rem', '5.25rem']

const sparks = Array.from({ length: sparkCount }, (_, position) => ({
  angle: `${(360 / sparkCount) * position}deg`,
  color: sparkColors[position % sparkColors.length],
  reach: sparkReaches[position % sparkReaches.length],
  delay: `${(position % 3) * 220}ms`,
}))

type SparkBurstProps = {
  className?: string
}

export const SparkBurst = ({ className = 'left-1/2 top-1/2' }: SparkBurstProps) => (
  <span aria-hidden className={classNames('pointer-events-none absolute h-0 w-0', className)}>
    {sparks.map((spark) => (
      <span
        key={spark.angle}
        className="spark absolute -left-[1.5px] bottom-0 h-4 w-[3px] rounded-pill"
        style={
          {
            background: spark.color,
            animationDelay: spark.delay,
            '--spark-angle': spark.angle,
            '--spark-reach': spark.reach,
          } as CSSProperties
        }
      />
    ))}
  </span>
)
