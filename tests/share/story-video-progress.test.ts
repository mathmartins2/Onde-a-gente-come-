import { describe, expect, it } from 'vitest'
import {
  encodingProgress,
  parseFfmpegProgressSeconds,
  preparationShare,
  toProgressPercentage,
} from '@/lib/share/storyVideoProgress'

describe('story video progress', () => {
  it('reads the latest encoded time from the ffmpeg progress output', () => {
    const output = 'frame=10\nout_time_us=1250000\nprogress=continue\nframe=20\nout_time_us=2500000\nprogress=continue\n'

    expect(parseFfmpegProgressSeconds(output)).toBe(2.5)
  })

  it('ignores output chunks without a time report', () => {
    expect(parseFfmpegProgressSeconds('frame=10\nprogress=continue\n')).toBeNull()
  })

  it('starts encoding after the preparation share and never passes the finish line early', () => {
    expect(encodingProgress(0, 9)).toBe(preparationShare)
    expect(encodingProgress(4.5, 9)).toBeGreaterThan(encodingProgress(1, 9))
    expect(toProgressPercentage(encodingProgress(20, 9))).toBeLessThan(100)
  })

  it('keeps the percentage between 0 and 100', () => {
    expect(toProgressPercentage(-0.2)).toBe(0)
    expect(toProgressPercentage(1.7)).toBe(100)
    expect(toProgressPercentage(0.424)).toBe(42)
  })
})
