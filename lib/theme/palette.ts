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

export const withAlpha = (hexColor: string, alpha: number) => {
  const red = Number.parseInt(hexColor.slice(1, 3), 16)
  const green = Number.parseInt(hexColor.slice(3, 5), 16)
  const blue = Number.parseInt(hexColor.slice(5, 7), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
