export type AccentColorPick = { kind: 'vibrant'; color: string } | { kind: 'monochrome' }

const hueBucketCount = 12
const minimumSaturation = 0.35
const minimumBrightness = 0.25
const minimumVibrantShare = 0.04
const displayBrightness = 0.92
const minimumDisplaySaturation = 0.55
const maximumDisplaySaturation = 0.9

type HsvColor = { hue: number; saturation: number; brightness: number }

const toHsv = (red: number, green: number, blue: number): HsvColor => {
  const maximum = Math.max(red, green, blue)
  const minimum = Math.min(red, green, blue)
  const chroma = maximum - minimum
  const brightness = maximum / 255
  const saturation = maximum === 0 ? 0 : chroma / maximum
  if (chroma === 0) return { hue: 0, saturation, brightness }
  if (maximum === red) return { hue: (((green - blue) / chroma + 6) % 6) * 60, saturation, brightness }
  if (maximum === green) return { hue: ((blue - red) / chroma + 2) * 60, saturation, brightness }
  return { hue: ((red - green) / chroma + 4) * 60, saturation, brightness }
}

const toHexChannel = (value: number) => Math.round(value * 255).toString(16).padStart(2, '0')

const hsvToHex = ({ hue, saturation, brightness }: HsvColor) => {
  const chroma = brightness * saturation
  const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const offset = brightness - chroma
  const sector = Math.floor(hue / 60) % 6
  const channelsBySector: Array<[number, number, number]> = [
    [chroma, secondary, 0],
    [secondary, chroma, 0],
    [0, chroma, secondary],
    [0, secondary, chroma],
    [secondary, 0, chroma],
    [chroma, 0, secondary],
  ]
  const [red, green, blue] = channelsBySector[sector]
  return `#${toHexChannel(red + offset)}${toHexChannel(green + offset)}${toHexChannel(blue + offset)}`
}

const averageHue = (hues: Array<{ hue: number; weight: number }>) => {
  const vector = hues.reduce(
    (sum, entry) => ({
      x: sum.x + Math.cos((entry.hue * Math.PI) / 180) * entry.weight,
      y: sum.y + Math.sin((entry.hue * Math.PI) / 180) * entry.weight,
    }),
    { x: 0, y: 0 },
  )
  return ((Math.atan2(vector.y, vector.x) * 180) / Math.PI + 360) % 360
}

export const pickAccentColor = (rgbPixels: Uint8Array): AccentColorPick => {
  const pixelCount = Math.floor(rgbPixels.length / 3)
  if (pixelCount === 0) return { kind: 'monochrome' }

  const vibrantPixels = Array.from({ length: pixelCount }, (_, pixelIndex) =>
    toHsv(rgbPixels[pixelIndex * 3], rgbPixels[pixelIndex * 3 + 1], rgbPixels[pixelIndex * 3 + 2]),
  ).filter((pixel) => pixel.saturation >= minimumSaturation && pixel.brightness >= minimumBrightness)

  if (vibrantPixels.length / pixelCount < minimumVibrantShare) return { kind: 'monochrome' }

  const buckets = vibrantPixels.reduce((grouped, pixel) => {
    const bucketIndex = Math.floor(pixel.hue / (360 / hueBucketCount)) % hueBucketCount
    return grouped.set(bucketIndex, [...(grouped.get(bucketIndex) ?? []), pixel])
  }, new Map<number, HsvColor[]>())

  const weightOf = (pixels: HsvColor[]) => pixels.reduce((sum, pixel) => sum + pixel.saturation * pixel.brightness, 0)
  const dominantPixels = [...buckets.values()].sort((first, second) => weightOf(second) - weightOf(first))[0]

  const hue = averageHue(dominantPixels.map((pixel) => ({ hue: pixel.hue, weight: pixel.saturation * pixel.brightness })))
  const saturation = dominantPixels.reduce((sum, pixel) => sum + pixel.saturation, 0) / dominantPixels.length

  return {
    kind: 'vibrant',
    color: hsvToHex({
      hue,
      saturation: Math.min(Math.max(saturation, minimumDisplaySaturation), maximumDisplaySaturation),
      brightness: displayBrightness,
    }),
  }
}
