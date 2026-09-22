import { formatHalfStarScore, roundToHalfStar } from '@/lib/scoring/roundToHalfStar'
import { scoreHexFor } from '@/lib/utilities/scoreTone'
import { memberCardCanvasSize } from './buildStoryVideoFilterGraph'
import { StoryAvatar } from './StoryGlyphs'
import { storyColors, storyFontFamilies } from './storyTheme'

export type MemberScoreCardData = {
  displayName: string
  score: number
  comment: string | null
  avatarDataUrl: string | null
  dishPhotoDataUrl: string | null
  tiltDegrees: number
}

const cardPhotoWidth = 400
const cardPhotoHeight = 300
const maximumCommentLength = 60

const shortenComment = (comment: string) =>
  comment.length > maximumCommentLength ? `${comment.slice(0, maximumCommentLength - 1).trimEnd()}…` : comment

const CardPicture = ({ card }: { card: MemberScoreCardData }) => {
  if (card.dishPhotoDataUrl) {
    return (
      <img
        src={card.dishPhotoDataUrl}
        width={cardPhotoWidth}
        height={cardPhotoHeight}
        style={{ objectFit: 'cover', borderRadius: 8 }}
        alt=""
      />
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: cardPhotoWidth,
        height: cardPhotoHeight,
        borderRadius: 8,
        backgroundImage: `linear-gradient(145deg, ${storyColors.surfaceRaised}, ${storyColors.canvas})`,
      }}
    >
      <StoryAvatar name={card.displayName} imageDataUrl={card.avatarDataUrl} size={170} />
    </div>
  )
}

export const MemberScoreCard = ({ card }: { card: MemberScoreCardData }) => {
  const roundedScore = roundToHalfStar(card.score)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: memberCardCanvasSize.width,
        height: memberCardCanvasSize.height,
        backgroundColor: 'transparent',
        fontFamily: storyFontFamilies.body,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: '16px 16px 18px',
          backgroundColor: storyColors.ink,
          borderRadius: 16,
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.55)',
          transform: `rotate(${card.tiltDegrees}deg)`,
        }}
      >
        <CardPicture card={card} />
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: 30,
            right: 30,
            padding: '6px 22px',
            borderRadius: 999,
            backgroundColor: 'rgba(13, 10, 9, 0.88)',
            border: `3px solid ${scoreHexFor(roundedScore)}`,
            color: scoreHexFor(roundedScore),
            fontSize: 56,
            fontWeight: 600,
            lineHeight: 1.1,
          }}
        >
          {formatHalfStarScore(roundedScore)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
          <StoryAvatar name={card.displayName} imageDataUrl={card.avatarDataUrl} size={48} />
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 600, color: storyColors.canvas }}>{card.displayName}</div>
        </div>
        {card.comment ? (
          <div style={{ display: 'flex', maxWidth: cardPhotoWidth, marginTop: 8, fontSize: 22, color: '#5b4d44' }}>
            “{shortenComment(card.comment)}”
          </div>
        ) : null}
      </div>
    </div>
  )
}
