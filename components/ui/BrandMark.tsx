import { brandMarkPinPath, brandMarkStrokeWidth, brandMarkUtensilPaths, brandMarkViewBox } from '@/lib/theme/brandMark'

type BrandMarkProps = {
  size: number
  className?: string
}

export const BrandMark = ({ size, className }: BrandMarkProps) => (
  <svg aria-hidden width={size} height={size} viewBox={brandMarkViewBox} className={className}>
    <path d={brandMarkPinPath} fill="var(--accent)" />
    {brandMarkUtensilPaths.map((utensil) => (
      <path
        key={utensil.key}
        d={utensil.path}
        fill={utensil.isFilled ? 'var(--on-accent)' : 'none'}
        stroke="var(--on-accent)"
        strokeWidth={brandMarkStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ))}
  </svg>
)
