import type { ResolvedTheme } from './themePreference'

export const palette = {
  canvas: '#0b0c10',
  canvasDeep: '#06070a',
  surface: '#14151b',
  surfaceRaised: '#1c1e26',
  surfaceOverlay: '#262833',
  hairline: '#2a2c37',
  hairlineStrong: '#3a3d4b',
  ink: '#f2f2f5',
  inkMuted: '#a3a4b3',
  inkFaint: '#80818f',
  accent: '#ff4d6d',
  accentHover: '#ff7189',
  accentPress: '#c9184a',
  onAccent: '#1f0508',
  herb: '#a8dd52',
  berry: '#b98cff',
} as const

export const lightPalette: Record<keyof typeof palette, string> = {
  canvas: '#f6f6f8',
  canvasDeep: '#ecedf1',
  surface: '#ffffff',
  surfaceRaised: '#f1f2f5',
  surfaceOverlay: '#e7e8ed',
  hairline: '#e0e1e7',
  hairlineStrong: '#c9cbd4',
  ink: '#14151b',
  inkMuted: '#555766',
  inkFaint: '#636573',
  accent: '#d81b47',
  accentHover: '#c4153f',
  accentPress: '#b0103a',
  onAccent: '#ffffff',
  herb: '#3f7410',
  berry: '#7c4dd6',
}

export const paletteFor = (theme: ResolvedTheme) => (theme === 'light' ? lightPalette : palette)

export const withAlpha = (hexColor: string, alpha: number) => {
  const red = Number.parseInt(hexColor.slice(1, 3), 16)
  const green = Number.parseInt(hexColor.slice(3, 5), 16)
  const blue = Number.parseInt(hexColor.slice(5, 7), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
