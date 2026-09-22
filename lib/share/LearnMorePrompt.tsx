import { storyColors } from './storyTheme'

export const LearnMorePrompt = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
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
