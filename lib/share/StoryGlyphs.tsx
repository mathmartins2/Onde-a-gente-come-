import { storyColors } from './storyTheme'

const utensilsPaths = [
  'm16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8',
  'M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7',
  'M2.1 21.8 13 11',
  'm9 11 3 3',
]

export const UtensilsGlyph = ({ size, color, strokeWidth = 2.2 }: { size: number; color: string; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {utensilsPaths.map((path) => (
      <path key={path} d={path} />
    ))}
  </svg>
)

export const AppMark = ({ size }: { size: number }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: size * 0.25,
      transform: 'rotate(-6deg)',
      backgroundImage: `linear-gradient(140deg, #ff9c63, ${storyColors.accent} 58%, ${storyColors.accentPress})`,
    }}
  >
    <UtensilsGlyph size={size * 0.56} color={storyColors.onAccent} strokeWidth={2.4} />
  </div>
)

const forkPositions = [0, 1, 2, 3, 4]

export const ForkScore = ({ score, size, color }: { score: number; size: number; color: string }) => (
  <div style={{ display: 'flex', gap: size * 0.28 }}>
    {forkPositions.map((position) => {
      const fillRatio = Math.min(Math.max(score - position, 0), 1)
      return (
        <div key={position} style={{ display: 'flex', position: 'relative', width: size, height: size }}>
          <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0 }}>
            <UtensilsGlyph size={size} color={storyColors.hairline} strokeWidth={2.4} />
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
            <UtensilsGlyph size={size} color={color} strokeWidth={2.4} />
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
      backgroundColor: 'rgba(255, 107, 53, 0.16)',
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
