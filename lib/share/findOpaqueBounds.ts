export type OpaqueBounds = { x: number; y: number; width: number; height: number }

type Extremes = { left: number; right: number; top: number; bottom: number }

const minimumOpaqueAlpha = 128

const includePixel = (extremes: Extremes | null, column: number, row: number): Extremes => ({
  left: Math.min(extremes?.left ?? column, column),
  right: Math.max(extremes?.right ?? column, column),
  top: Math.min(extremes?.top ?? row, row),
  bottom: Math.max(extremes?.bottom ?? row, row),
})

export const findOpaqueBounds = (alphaChannel: Uint8Array, imageWidth: number): OpaqueBounds | null => {
  const extremes = alphaChannel.reduce<Extremes | null>(
    (current, alpha, pixelIndex) =>
      alpha >= minimumOpaqueAlpha
        ? includePixel(current, pixelIndex % imageWidth, Math.floor(pixelIndex / imageWidth))
        : current,
    null,
  )
  if (!extremes) return null

  return {
    x: extremes.left,
    y: extremes.top,
    width: extremes.right - extremes.left + 1,
    height: extremes.bottom - extremes.top + 1,
  }
}
