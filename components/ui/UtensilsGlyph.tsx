import { brandMarkStrokeWidth, brandMarkUtensilPaths, brandUtensilsViewBox } from '@/lib/theme/brandMark'
import { classNames } from '@/lib/utilities/classNames'

type UtensilsGlyphProps = {
  size: number
  className?: string
}

export const UtensilsGlyph = ({ size, className }: UtensilsGlyphProps) => (
  <svg
    aria-hidden
    width={size}
    height={size}
    viewBox={brandUtensilsViewBox}
    className={classNames('shrink-0', className)}
  >
    {brandMarkUtensilPaths.map((utensil) => (
      <path
        key={utensil.key}
        d={utensil.path}
        fill={utensil.isFilled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={brandMarkStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ))}
  </svg>
)
