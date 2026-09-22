export const brandMarkViewBox = '3 4.5 42 42'

export const brandMarkPinPath = 'M24 46c-1.4 0-15.5-13.2-15.5-26a15.5 15.5 0 0 1 31 0c0 12.8-14.1 26-15.5 26Z'

export const brandMarkStrokeWidth = 2.6

export const brandMarkUtensilPaths = [
  { key: 'fork-tines', path: 'M17 10.5v5.5M20 10.5v5.5M23 10.5v5.5', isFilled: false },
  { key: 'fork-head', path: 'M17 16c0 2.2 1.3 3.4 3 3.4s3-1.2 3-3.4', isFilled: false },
  { key: 'fork-handle', path: 'M20 19.4V31', isFilled: false },
  { key: 'knife', path: 'M28.5 31V10.5c2.7 1.4 3.8 5.2 3.8 9.8h-3.8', isFilled: true },
] as const

type BrandMarkColors = {
  accent: string
  canvas: string
}

export const buildBrandMarkSvgMarkup = ({ accent, canvas }: BrandMarkColors) => {
  const utensilMarkup = brandMarkUtensilPaths
    .map(
      (utensil) =>
        `<path d="${utensil.path}" fill="${utensil.isFilled ? canvas : 'none'}" stroke="${canvas}" stroke-width="${brandMarkStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${brandMarkViewBox}"><path d="${brandMarkPinPath}" fill="${accent}"/>${utensilMarkup}</svg>`
}
