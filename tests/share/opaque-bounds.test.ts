import { describe, expect, it } from 'vitest'
import { findOpaqueBounds } from '@/lib/share/findOpaqueBounds'

const buildAlpha = (width: number, height: number, opaquePixels: Array<[number, number]>) => {
  const opaqueKeys = new Set(opaquePixels.map(([column, row]) => `${column}:${row}`))
  return Uint8Array.from({ length: width * height }, (_, pixelIndex) =>
    opaqueKeys.has(`${pixelIndex % width}:${Math.floor(pixelIndex / width)}`) ? 255 : 0,
  )
}

describe('opaque bounds', () => {
  it('finds the rectangle drawn by an outline', () => {
    const alpha = buildAlpha(10, 8, [
      [2, 1],
      [7, 1],
      [2, 5],
      [7, 5],
    ])

    expect(findOpaqueBounds(alpha, 10)).toEqual({ x: 2, y: 1, width: 6, height: 5 })
  })

  it('reports nothing when the mask is fully transparent', () => {
    expect(findOpaqueBounds(buildAlpha(4, 4, []), 4)).toBeNull()
  })
})
