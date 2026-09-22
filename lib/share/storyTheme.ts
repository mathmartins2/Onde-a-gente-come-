export const storySize = { width: 1080, height: 1920 } as const

export const storyPhotoAreaHeight = 1040

export const storyColors = {
  canvas: '#0d0a09',
  canvasDeep: '#070505',
  surface: '#17110e',
  surfaceRaised: '#221913',
  hairline: '#34261f',
  ink: '#f8f0e7',
  inkMuted: '#b0a094',
  inkFaint: '#7e7168',
  accent: '#ff6b35',
  accentHover: '#ff8352',
  accentPress: '#d64a17',
  onAccent: '#1d0c04',
} as const

export const storyFontFamilies = {
  display: 'Fraunces',
  body: 'Archivo',
} as const

export const withAlpha = (hexColor: string, alpha: number) => {
  const red = Number.parseInt(hexColor.slice(1, 3), 16)
  const green = Number.parseInt(hexColor.slice(3, 5), 16)
  const blue = Number.parseInt(hexColor.slice(5, 7), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
