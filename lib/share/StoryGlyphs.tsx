import {
  brandMarkPinPath,
  brandMarkStrokeWidth,
  brandMarkUtensilPaths,
  brandMarkViewBox,
  brandUtensilsViewBox,
} from '@/lib/theme/brandMark'
import { storyColors, withAlpha } from './storyTheme'

export const UtensilsGlyph = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox={brandUtensilsViewBox}>
    {brandMarkUtensilPaths.map((utensil) => (
      <path
        key={utensil.key}
        d={utensil.path}
        fill={utensil.isFilled ? color : 'none'}
        stroke={color}
        strokeWidth={brandMarkStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ))}
  </svg>
)

export const AppMark = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox={brandMarkViewBox}>
    <path d={brandMarkPinPath} fill={storyColors.accent} />
    {brandMarkUtensilPaths.map((utensil) => (
      <path
        key={utensil.key}
        d={utensil.path}
        fill={utensil.isFilled ? storyColors.canvas : 'none'}
        stroke={storyColors.canvas}
        strokeWidth={brandMarkStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ))}
  </svg>
)

const forkPositions = [0, 1, 2, 3, 4]

export const ForkScore = ({ score, size, color }: { score: number; size: number; color: string }) => (
  <div style={{ display: 'flex', gap: size * 0.28 }}>
    {forkPositions.map((position) => {
      const fillRatio = Math.min(Math.max(score - position, 0), 1)
      return (
        <div key={position} style={{ display: 'flex', position: 'relative', width: size, height: size }}>
          <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0 }}>
            <UtensilsGlyph size={size} color={storyColors.hairline} />
          </div>
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 0,
              left: 0,
              width: size * fillRatio,
              height: size,
              overflow: 'hidden',
            }}
          >
            <UtensilsGlyph size={size} color={color} />
          </div>
        </div>
      )
    })}
  </div>
)

export const StoryAvatar = ({ name, imageDataUrl, size }: { name: string; imageDataUrl: string | null; size: number }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: size,
      overflow: 'hidden',
      border: `3px solid ${storyColors.hairline}`,
      backgroundColor: withAlpha(storyColors.accent, 0.16),
      color: storyColors.accentHover,
      fontSize: size * 0.4,
      fontWeight: 600,
    }}
  >
    {imageDataUrl ? (
      <img src={imageDataUrl} width={size} height={size} style={{ objectFit: 'cover' }} alt="" />
    ) : (
      name.trim().charAt(0).toUpperCase()
    )}
  </div>
)
