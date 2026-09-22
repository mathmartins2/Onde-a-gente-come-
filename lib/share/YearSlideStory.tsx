import { scoreHexFor } from '@/lib/utilities/scoreTone'
import type { YearSlide } from '@/lib/yearInReview/types'
import { StoryFrame } from './StoryFrame'
import { StoryAvatar } from './StoryGlyphs'
import { storyColors, storyFontFamilies } from './storyTheme'

export type YearSlideStoryImages = {
  photoDataUrl: string | null
  avatarDataUrl: string | null
  entryAvatarDataUrls: Array<string | null>
}

const LearnMorePrompt = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 16,
      marginTop: 'auto',
      marginBottom: 44,
      padding: '18px 32px',
      borderRadius: 999,
      backgroundColor: storyColors.accent,
      color: storyColors.canvas,
      fontSize: 32,
      fontWeight: 600,
    }}
  >
    saiba mais no link
    <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={storyColors.canvas} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  </div>
)

const titleFontSize = (title: string) => {
  if (title.length > 48) return 72
  if (title.length > 32) return 84
  return 96
}

export const YearSlideStory = ({ year, slide, images }: { year: number; slide: YearSlide; images: YearSlideStoryImages }) => {
  const heroColor = slide.heroScore === null ? storyColors.accentHover : scoreHexFor(slide.heroScore)

  return (
    <StoryFrame eyebrow={`retrospectiva ${year}`} backgroundPhotoDataUrl={images.photoDataUrl}>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: images.photoDataUrl ? 300 : 150 }}>
        {slide.avatar ? (
          <div style={{ display: 'flex', marginBottom: 36 }}>
            <StoryAvatar name={slide.avatar.name} imageDataUrl={images.avatarDataUrl} size={150} />
          </div>
        ) : null}
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 5, textTransform: 'uppercase', color: storyColors.accent, fontWeight: 600 }}>
          {slide.eyebrow}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 20,
            fontFamily: storyFontFamilies.display,
            fontWeight: 900,
            fontSize: titleFontSize(slide.title),
            lineHeight: 1.02,
            letterSpacing: -2,
          }}
        >
          {slide.title}
        </div>
      </div>

      {slide.heroValue ? (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 48 }}>
          <div style={{ display: 'flex', fontSize: 200, fontWeight: 600, lineHeight: 1, letterSpacing: -6, color: heroColor }}>
            {slide.heroValue}
          </div>
          {slide.heroCaption ? (
            <div style={{ display: 'flex', marginTop: 12, fontSize: 34, color: storyColors.inkMuted }}>{slide.heroCaption}</div>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 56 }}>
        {slide.entries.map((entry, entryIndex) => (
          <div
            key={`${entry.label}-${entryIndex}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              padding: '22px 30px',
              borderRadius: 28,
              backgroundColor: storyColors.surface,
              border: `2px solid ${storyColors.hairline}`,
            }}
          >
            {entry.avatar ? (
              <StoryAvatar name={entry.avatar.name} imageDataUrl={images.entryAvatarDataUrls[entryIndex] ?? null} size={64} />
            ) : null}
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', fontSize: 32 }}>{entry.label}</div>
              {entry.detail ? (
                <div style={{ display: 'flex', fontSize: 26, color: storyColors.inkFaint }}>{entry.detail}</div>
              ) : null}
            </div>
            <div
              style={{
                display: 'flex',
                flexShrink: 0,
                fontSize: 40,
                fontWeight: 600,
                color: entry.valueScore === null ? storyColors.ink : scoreHexFor(entry.valueScore),
              }}
            >
              {entry.value}
            </div>
          </div>
        ))}
      </div>

      {slide.quote ? (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 40, paddingLeft: 28, borderLeft: `6px solid ${storyColors.accent}` }}>
          <div style={{ display: 'flex', fontSize: 34, fontStyle: 'normal', color: storyColors.ink }}>“{slide.quote.text}”</div>
          <div style={{ display: 'flex', marginTop: 10, fontSize: 26, color: storyColors.inkFaint }}>— {slide.quote.author}</div>
        </div>
      ) : null}

      {slide.restaurantId ? <LearnMorePrompt /> : null}
    </StoryFrame>
  )
}
