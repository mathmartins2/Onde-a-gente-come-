import type { ReactNode } from 'react'
import { AppMark } from './StoryGlyphs'
import { storyColors, storyFontFamilies, storySize } from './storyTheme'

const photoHeight = 1040

export const StoryFrame = ({
  eyebrow,
  backgroundPhotoDataUrl,
  children,
}: {
  eyebrow: string
  backgroundPhotoDataUrl?: string | null
  children: ReactNode
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      width: storySize.width,
      height: storySize.height,
      backgroundColor: storyColors.canvas,
      color: storyColors.ink,
      fontFamily: storyFontFamilies.body,
    }}
  >
    {backgroundPhotoDataUrl ? (
      <img
        src={backgroundPhotoDataUrl}
        width={storySize.width}
        height={photoHeight}
        style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }}
        alt=""
      />
    ) : null}
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        top: 0,
        left: 0,
        width: storySize.width,
        height: photoHeight,
        backgroundImage: backgroundPhotoDataUrl
          ? `linear-gradient(180deg, rgba(13, 10, 9, 0.35) 0%, rgba(13, 10, 9, 0.3) 28%, rgba(13, 10, 9, 0.82) 58%, ${storyColors.canvas} 84%)`
          : `radial-gradient(circle at 78% 18%, rgba(255, 107, 53, 0.42) 0%, rgba(214, 74, 23, 0.14) 38%, ${storyColors.canvas} 72%)`,
      }}
    />

    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        flexGrow: 1,
        padding: '96px 80px 72px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignSelf: 'flex-start',
          padding: '12px 26px',
          borderRadius: 999,
          backgroundColor: 'rgba(13, 10, 9, 0.72)',
          border: `2px solid ${storyColors.hairline}`,
          color: storyColors.accentHover,
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: 5,
          textTransform: 'uppercase',
        }}
      >
        {eyebrow}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>{children}</div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          paddingTop: 44,
          borderTop: `2px solid ${storyColors.hairline}`,
        }}
      >
        <AppMark size={84} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontFamily: storyFontFamilies.display, fontSize: 50, fontWeight: 900 }}>
            Onde a gente&nbsp;<span style={{ color: storyColors.accent }}>come</span>
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: storyColors.inkFaint, letterSpacing: 4, textTransform: 'uppercase' }}>
            Recife · sorteio e nota da mesa
          </div>
        </div>
      </div>
    </div>
  </div>
)
