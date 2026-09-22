import { buildBrandMarkSvgMarkup } from '@/lib/theme/brandMark'
import { palette } from '@/lib/theme/palette'

export const contentType = 'image/svg+xml'

const Icon = () =>
  new Response(buildBrandMarkSvgMarkup({ accent: palette.accent, canvas: palette.canvas }), {
    headers: { 'Content-Type': contentType },
  })

export default Icon
