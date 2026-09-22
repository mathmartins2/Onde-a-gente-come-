import { ratingCriteria } from '@/lib/scoring/configuration'
import { formatHalfStarScore, roundToHalfStar } from '@/lib/scoring/roundToHalfStar'
import { scoreHexFor } from '@/lib/utilities/scoreTone'
import { StoryFrame } from './StoryFrame'
import { LearnMorePrompt } from './LearnMorePrompt'
import { ForkScore, StoryAvatar } from './StoryGlyphs'
import { storyColors, storyFontFamilies } from './storyTheme'

export type VisitStoryData = {
  restaurantName: string
  neighborhood: string | null
  visitDayLabel: string
  photoDataUrl: string | null
  finalScore: number
  criteriaAverages: Record<string, number | null>
  ratings: Array<{ memberId: string; displayName: string; score: number; avatarDataUrl: string | null }>
}

const restaurantNameFontSize = (restaurantName: string) => {
  if (restaurantName.length > 26) return 76
  if (restaurantName.length > 16) return 96
  return 120
}

const CriterionBar = ({ label, average }: { label: string; average: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
    <div style={{ display: 'flex', width: 300, flexShrink: 0, fontSize: 30, color: storyColors.inkMuted }}>{label}</div>
    <div
      style={{
        display: 'flex',
        flexGrow: 1,
        flexShrink: 1,
        minWidth: 0,
        height: 16,
        borderRadius: 16,
        backgroundColor: storyColors.surfaceRaised,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: `${(average / 5) * 100}%`,
          height: 16,
          borderRadius: 16,
          backgroundImage: `linear-gradient(90deg, ${storyColors.accentPress}, ${storyColors.accentHover})`,
        }}
      />
    </div>
    <div style={{ display: 'flex', width: 84, flexShrink: 0, justifyContent: 'flex-end', fontSize: 32, fontWeight: 600, color: scoreHexFor(average) }}>
      {formatHalfStarScore(average)}
    </div>
  </div>
)

export const VisitStory = ({ data }: { data: VisitStoryData }) => {
  const roundedFinalScore = roundToHalfStar(data.finalScore)
  const finalScoreColor = scoreHexFor(roundedFinalScore)
  const criteriaWithAverages = ratingCriteria.flatMap((criterion) => {
    const average = data.criteriaAverages[criterion.key]
    return average === null || average === undefined ? [] : [{ ...criterion, average: roundToHalfStar(average) }]
  })

  return (
    <StoryFrame eyebrow="nota da mesa" backgroundPhotoDataUrl={data.photoDataUrl}>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: data.photoDataUrl ? 360 : 200 }}>
        <div
          style={{
            display: 'flex',
            fontFamily: storyFontFamilies.display,
            fontSize: restaurantNameFontSize(data.restaurantName),
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: -2,
          }}
        >
          {data.restaurantName}
        </div>
        <div style={{ display: 'flex', marginTop: 22, fontSize: 34, color: storyColors.inkMuted }}>
          {[data.neighborhood, data.visitDayLabel].filter(Boolean).join('  ·  ')}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 44, marginTop: 56 }}>
        <div
          style={{
            display: 'flex',
            fontSize: 230,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: -8,
            color: finalScoreColor,
          }}
        >
          {formatHalfStarScore(roundedFinalScore)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', fontSize: 28, letterSpacing: 5, textTransform: 'uppercase', color: storyColors.inkFaint }}>
            de 5
          </div>
          <ForkScore score={roundedFinalScore} size={58} color={finalScoreColor} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 60 }}>
        {criteriaWithAverages.map((criterion) => (
          <CriterionBar key={criterion.key} label={criterion.label} average={criterion.average} />
        ))}
      </div>

      <div style={{ display: 'flex', marginTop: 56 }}>
        <LearnMorePrompt />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 'auto', marginBottom: 48 }}>
        {data.ratings.map((rating) => (
          <div
            key={rating.memberId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '14px 28px 14px 14px',
              borderRadius: 999,
              backgroundColor: storyColors.surface,
              border: `2px solid ${storyColors.hairline}`,
            }}
          >
            <StoryAvatar name={rating.displayName} imageDataUrl={rating.avatarDataUrl} size={64} />
            <div style={{ display: 'flex', fontSize: 32 }}>{rating.displayName}</div>
            <div style={{ display: 'flex', fontSize: 32, fontWeight: 600, color: scoreHexFor(roundToHalfStar(rating.score)) }}>
              {formatHalfStarScore(rating.score)}
            </div>
          </div>
        ))}
      </div>
    </StoryFrame>
  )
}
