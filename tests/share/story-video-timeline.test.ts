import { describe, expect, it } from 'vitest'
import {
  buildCardHorizontalExpression,
  buildStoryVideoFilterGraph,
  planStoryVideoTimeline,
} from '@/lib/share/buildStoryVideoFilterGraph'

const evaluateFfmpegExpression = (expression: string, seconds: number) => {
  const javascriptExpression = expression
    .replace(/\bif\(/g, 'ffmpegIf(')
    .replace(/\blt\(/g, 'ffmpegLessThan(')
    .replace(/\bpow\(/g, 'Math.pow(')
  const ffmpegIf = (condition: number, whenTrue: number, whenFalse: number) => (condition ? whenTrue : whenFalse)
  const ffmpegLessThan = (first: number, second: number) => (first < second ? 1 : 0)
  return new Function('t', 'ffmpegIf', 'ffmpegLessThan', `return ${javascriptExpression}`)(
    seconds,
    ffmpegIf,
    ffmpegLessThan,
  ) as number
}

describe('story video timeline', () => {
  it('keeps a short video when there are no member cards', () => {
    expect(planStoryVideoTimeline(3, 0).totalSeconds).toBe(4.5)
  })

  it('shows every member card in turn, each one starting before the previous one leaves', () => {
    const { cardWindows, totalSeconds } = planStoryVideoTimeline(3, 4)

    expect(cardWindows).toHaveLength(4)
    cardWindows.slice(1).forEach((cardWindow, cardIndex) => {
      expect(cardWindow.startSeconds).toBeLessThan(cardWindows[cardIndex].endSeconds)
      expect(cardWindow.startSeconds).toBeGreaterThan(cardWindows[cardIndex].startSeconds)
    })
    expect(totalSeconds).toBeGreaterThan(cardWindows[3].endSeconds)
  })

  it('stretches the background photos so the slideshow lasts the whole video', () => {
    const { clipSeconds, totalSeconds } = planStoryVideoTimeline(3, 4)
    const crossfadeSeconds = 0.6

    expect(3 * clipSeconds - 2 * crossfadeSeconds).toBeCloseTo(totalSeconds)
  })

  it('overlays one animated card per member on top of the story', () => {
    const filterGraph = buildStoryVideoFilterGraph(2, 3)

    expect(filterGraph.match(/overlay=x=/g)).toHaveLength(3)
    expect(filterGraph).toContain('[3:v]overlay=x=')
    expect(filterGraph).toContain('[5:v]overlay=x=')
    expect(filterGraph.endsWith('[withCards]format=yuv420p[story]')).toBe(true)
  })
})

describe('member card flight', () => {
  const cardWindow = { startSeconds: 1, endSeconds: 3.4 }

  it('enters from beyond the right edge and leaves past the left edge', () => {
    const expression = buildCardHorizontalExpression(cardWindow)

    expect(evaluateFfmpegExpression(expression, 1)).toBeGreaterThanOrEqual(1080)
    expect(evaluateFfmpegExpression(expression, 2.2)).toBeGreaterThan(200)
    expect(evaluateFfmpegExpression(expression, 2.2)).toBeLessThan(300)
    expect(evaluateFfmpegExpression(expression, 3.4)).toBeCloseTo(-560)
  })
})
