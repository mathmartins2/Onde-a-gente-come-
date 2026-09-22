import { palette, withAlpha } from '@/lib/theme/palette'

export const storySize = { width: 1080, height: 1920 } as const

export const storyPhotoAreaHeight = 1040

export const storyColors = {
  canvas: palette.canvas,
  canvasDeep: palette.canvasDeep,
  surface: palette.surface,
  surfaceRaised: palette.surfaceRaised,
  hairline: palette.hairline,
  ink: palette.ink,
  inkMuted: palette.inkMuted,
  inkFaint: palette.inkFaint,
  accent: palette.accent,
  accentHover: palette.accentHover,
  accentPress: palette.accentPress,
  onAccent: palette.onAccent,
} as const

export const storyFontFamilies = {
  display: 'Bricolage Grotesque',
  body: 'Archivo',
} as const

export { withAlpha }
