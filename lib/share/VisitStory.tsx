import { ratingCriteria } from '@/lib/scoring/configuration'
import { formatHalfStarScore, roundToHalfStar } from '@/lib/scoring/roundToHalfStar'
import { scoreHexFor } from '@/lib/utilities/scoreTone'
import { StoryFrame } from './StoryFrame'
import { ForkScore, StoryAvatar } from './StoryGlyphs'
import { storyColors, storyFontFamilies, withAlpha } from './storyTheme'

export type VisitStoryData = {
  restaurantName: string
  neighborhood: string | null
  visitDayLabel: string
  photoDataUrl: string | null
  backgroundPhotoDataUrl: string | null
  dishPolaroidDataUrls: string[]
  logoAccentColor: string | null
  finalScore: number
  criteriaAverages: Record<string, number | null>
  ratings: Array<{ memberId: string; displayName: string; score: number; comment: string | null; avatarDataUrl: string | null }>
}

const restaurantNameFontSize = (restaurantName: string) => {
  if (restaurantName.length > 26) return 76
  if (restaurantName.length > 16) return 96
  return 120
}

const restaurantLogoSize = 164
const restaurantLogoFrameSize = 214
const receiptNotchSize = 36
const translucentSurface = 'rgba(23, 17, 14, 0.9)'
const scoreCardBorderWidth = 2
const outlineMaskBorderWidth = 5
const scoreCardRadius = 36

const ScoreCard = ({
  roundedFinalScore,
  finalScoreColor,
  criteriaLines,
  appearance,
}: {
  roundedFinalScore: number
  finalScoreColor: string
  criteriaLines: Array<Array<{ key: string; label: string; average: number }>>
  appearance: 'staticAccent' | 'animatedAccent' | 'outlineMask'
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      padding: '26px 44px 26px',
      borderRadius: scoreCardRadius,
      backgroundColor: appearance === 'outlineMask' ? 'transparent' : translucentSurface,
      border: appearance === 'outlineMask' ? `${outlineMaskBorderWidth}px solid ${storyColors.ink}` : `${scoreCardBorderWidth}px solid ${storyColors.hairline}`,
    }}
  >
    <div
      style={{
        display: appearance === 'staticAccent' ? 'flex' : 'none',
        position: 'absolute',
        top: 0,
        left: 80,
        right: 80,
        height: 3,
        backgroundImage: `linear-gradient(90deg, transparent, ${storyColors.accent}, transparent)`,
      }}
    />
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: appearance === 'outlineMask' ? 0 : 1,
      }}
    >
      <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, letterSpacing: 5, textTransform: 'uppercase', color: storyColors.accent }}>
        nota final
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 6 }}>
        <div style={{ display: 'flex', fontSize: 148, fontWeight: 600, lineHeight: 1, letterSpacing: -6, color: finalScoreColor }}>
          {formatHalfStarScore(roundedFinalScore)}
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: storyColors.inkFaint }}>/5</div>
      </div>
      <div style={{ display: 'flex', marginTop: 14 }}>
        <ForkScore score={roundedFinalScore} size={40} color={finalScoreColor} />
      </div>
    </div>
    {criteriaLines.length > 0 ? (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          alignSelf: 'stretch',
          gap: 10,
          marginTop: 24,
          paddingTop: 22,
          opacity: appearance === 'outlineMask' ? 0 : 1,
          borderTop: `2px solid ${storyColors.hairline}`,
        }}
      >
        {criteriaLines.map((line) => (
          <div key={line.map((criterion) => criterion.key).join('-')} style={{ display: 'flex', gap: 14 }}>
            {line.map((criterion, criterionIndex) => (
              <CriterionSummaryItem
                key={criterion.key}
                label={criterion.label}
                average={criterion.average}
                isLast={criterionIndex === line.length - 1}
              />
            ))}
          </div>
        ))}
      </div>
    ) : null}
  </div>
)

const ReceiptNotch = ({ side }: { side: 'left' | 'right' }) => (
  <div
    style={{
      display: 'flex',
      position: 'absolute',
      top: 82,
      [side]: -receiptNotchSize / 2,
      width: receiptNotchSize,
      height: receiptNotchSize,
      borderRadius: receiptNotchSize,
      backgroundColor: storyColors.canvas,
      border: `2px solid ${storyColors.hairline}`,
    }}
  />
)

const MemberReceipt = ({ ratings }: { ratings: VisitStoryData['ratings'] }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      marginTop: 32,
      padding: '28px 44px 30px',
      borderRadius: 36,
      backgroundColor: translucentSurface,
      border: `2px solid ${storyColors.hairline}`,
    }}
  >
    <ReceiptNotch side="left" />
    <ReceiptNotch side="right" />
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingBottom: 24,
        marginBottom: 14,
        borderBottom: `3px dashed ${storyColors.hairline}`,
        fontSize: 24,
        letterSpacing: 5,
        textTransform: 'uppercase',
        color: storyColors.inkFaint,
      }}
    >
      <div style={{ display: 'flex' }}>comanda da mesa</div>
      <div style={{ display: 'flex' }}>{ratings.length === 1 ? '1 voto' : `${ratings.length} votos`}</div>
    </div>
    {ratings.map((rating) => (
      <div key={rating.memberId} style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 8, paddingBottom: 8 }}>
        <StoryAvatar name={rating.displayName} imageDataUrl={rating.avatarDataUrl} size={52} />
        <div style={{ display: 'flex', fontSize: 32 }}>{rating.displayName}</div>
        <div style={{ display: 'flex', flexGrow: 1, height: 2, marginTop: 14, borderBottom: `2px dashed ${storyColors.hairline}` }} />
        <div style={{ display: 'flex', fontSize: 36, fontWeight: 600, color: scoreHexFor(roundToHalfStar(rating.score)) }}>
          {formatHalfStarScore(rating.score)}
        </div>
      </div>
    ))}
  </div>
)


const storyCriterionLabels: Partial<Record<string, string>> = { waitTime: 'espera' }
const criteriaPerLine = 3

const splitIntoLines = <T,>(items: T[]) =>
  Array.from({ length: Math.ceil(items.length / criteriaPerLine) }, (_, lineIndex) =>
    items.slice(lineIndex * criteriaPerLine, (lineIndex + 1) * criteriaPerLine),
  )

const CriterionSummaryItem = ({ label, average, isLast }: { label: string; average: number; isLast: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 30 }}>
    <div style={{ display: 'flex', color: storyColors.inkMuted }}>{label}</div>
    <div style={{ display: 'flex', fontWeight: 600, color: scoreHexFor(average) }}>{formatHalfStarScore(average)}</div>
    {isLast ? null : <div style={{ display: 'flex', marginLeft: 4, color: storyColors.inkFaint }}>·</div>}
  </div>
)

const polaroidPlacements = [
  { top: 0, right: 0, rotation: 8 },
  { top: 60, right: 170, rotation: -8 },
  { top: 170, right: 60, rotation: 3 },
]
const polaroidPhotoSize = 170

const DishPolaroids = ({ photoDataUrls }: { photoDataUrls: string[] }) => (
  <div style={{ display: 'flex', position: 'absolute', top: 40, right: -20, width: 480, height: 420 }}>
    {photoDataUrls.map((photoDataUrl, photoIndex) => {
      const placement = polaroidPlacements[photoIndex % polaroidPlacements.length]
      return (
        <div
          key={photoDataUrl.slice(-32)}
          style={{
            display: 'flex',
            position: 'absolute',
            top: placement.top,
            right: placement.right,
            padding: '12px 12px 38px',
            backgroundColor: storyColors.ink,
            borderRadius: 10,
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.55)',
            transform: `rotate(${placement.rotation}deg)`,
          }}
        >
          <img
            src={photoDataUrl}
            width={polaroidPhotoSize}
            height={polaroidPhotoSize}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            alt=""
          />
        </div>
      )
    })}
  </div>
)

const RestaurantLogoFace = ({ restaurantName, photoDataUrl }: { restaurantName: string; photoDataUrl: string | null }) => {
  if (photoDataUrl) {
    return <img src={photoDataUrl} width={restaurantLogoSize} height={restaurantLogoSize} style={{ objectFit: 'contain' }} alt="" />
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: restaurantLogoSize,
        height: restaurantLogoSize,
        backgroundImage: `linear-gradient(145deg, ${storyColors.accentHover}, ${storyColors.accentPress})`,
        color: storyColors.onAccent,
        fontFamily: storyFontFamilies.display,
        fontSize: 96,
        fontWeight: 900,
      }}
    >
      {restaurantName.trim().charAt(0).toUpperCase()}
    </div>
  )
}

const RestaurantLogo = ({
  restaurantName,
  photoDataUrl,
  accentColor,
}: {
  restaurantName: string
  photoDataUrl: string | null
  accentColor: string
}) => (
  <div style={{ display: 'flex', position: 'relative', width: restaurantLogoFrameSize, height: restaurantLogoFrameSize }}>
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        top: -250,
        left: -300,
        width: 760,
        height: 760,
        backgroundImage: `radial-gradient(circle, ${withAlpha(accentColor, 0.32)} 0%, ${withAlpha(accentColor, 0.1)} 40%, transparent 70%)`,
      }}
    />
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        top: 20,
        left: 36,
        width: restaurantLogoSize,
        height: restaurantLogoSize,
        borderRadius: 44,
        backgroundImage: `linear-gradient(145deg, ${withAlpha(accentColor, 0.75)}, ${withAlpha(accentColor, 0.3)})`,
        transform: 'rotate(10deg)',
      }}
    />
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        top: 6,
        left: 6,
        overflow: 'hidden',
        borderRadius: 44,
        border: `4px solid ${storyColors.ink}`,
        boxShadow: `0 24px 80px ${withAlpha(accentColor, 0.6)}`,
        transform: 'rotate(-6deg)',
      }}
    >
      <RestaurantLogoFace restaurantName={restaurantName} photoDataUrl={photoDataUrl} />
    </div>
  </div>
)

const resolveScoreCardAppearance = (variant: VisitStoryVariant) => {
  if (variant === 'scoreCardOutline') return 'outlineMask' as const
  if (variant === 'videoForeground') return 'animatedAccent' as const
  return 'staticAccent' as const
}

export type VisitStoryVariant = 'image' | 'videoForeground' | 'scoreCardOutline' | 'headerOutline'

export const VisitStory = ({ data, variant = 'image' }: { data: VisitStoryData; variant?: VisitStoryVariant }) => {
  const isVideoForeground = variant !== 'image'
  const isOutlineMask = variant === 'scoreCardOutline'
  const isHeaderMask = variant === 'headerOutline'
  const polaroidDataUrls = isVideoForeground ? [] : data.dishPolaroidDataUrls
  const roundedFinalScore = roundToHalfStar(data.finalScore)
  const finalScoreColor = scoreHexFor(roundedFinalScore)
  const criteriaWithAverages = ratingCriteria.flatMap((criterion) => {
    const average = data.criteriaAverages[criterion.key]
    if (average === null || average === undefined) return []
    const label = storyCriterionLabels[criterion.key] ?? criterion.label.toLowerCase()
    return [{ key: criterion.key, label, average: roundToHalfStar(average) }]
  })

  return (
    <StoryFrame
      eyebrow="nota da mesa"
      backgroundPhotoDataUrl={isVideoForeground ? null : data.backgroundPhotoDataUrl}
      leavesPhotoAreaTransparent={isVideoForeground && data.backgroundPhotoDataUrl !== null}
      isLayoutMask={isOutlineMask || isHeaderMask}
      glowColor={data.logoAccentColor ?? storyColors.accent}
    >
      {polaroidDataUrls.length > 0 ? <DishPolaroids photoDataUrls={polaroidDataUrls} /> : null}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          opacity: isOutlineMask ? 0 : 1,
          backgroundColor: isHeaderMask ? storyColors.ink : 'transparent',
          marginTop: polaroidDataUrls.length > 0 ? 196 : data.backgroundPhotoDataUrl ? 130 : 40,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', opacity: isHeaderMask ? 0 : 1 }}>
        <div style={{ display: 'flex', marginBottom: 34 }}>
          <RestaurantLogo
            restaurantName={data.restaurantName}
            photoDataUrl={data.photoDataUrl}
            accentColor={data.logoAccentColor ?? storyColors.accent}
          />
        </div>
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
        <div style={{ display: 'flex', marginTop: 20, fontSize: 32, color: storyColors.inkMuted }}>
          {[data.neighborhood, data.visitDayLabel].filter(Boolean).join('  ·  ')}
        </div>
        </div>
      </div>

      {isVideoForeground ? null : <MemberReceipt ratings={data.ratings} />}

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', marginBottom: 44, opacity: isHeaderMask ? 0 : 1 }}>
        <ScoreCard
          roundedFinalScore={roundedFinalScore}
          finalScoreColor={finalScoreColor}
          criteriaLines={splitIntoLines(criteriaWithAverages)}
          appearance={resolveScoreCardAppearance(variant)}
        />
      </div>
    </StoryFrame>
  )
}
