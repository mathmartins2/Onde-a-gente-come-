export const responsiveImageWidths = [160, 320, 480, 640, 960, 1280] as const

export type ResponsiveImageWidth = (typeof responsiveImageWidths)[number]

const largestResponsiveWidth = responsiveImageWidths[responsiveImageWidths.length - 1]

export const pickResponsiveWidth = (requestedWidth: number): ResponsiveImageWidth =>
  responsiveImageWidths.find((allowedWidth) => allowedWidth >= requestedWidth) ?? largestResponsiveWidth

export const parseResponsiveWidth = (value: string | null): ResponsiveImageWidth | null =>
  responsiveImageWidths.find((allowedWidth) => String(allowedWidth) === value) ?? null
