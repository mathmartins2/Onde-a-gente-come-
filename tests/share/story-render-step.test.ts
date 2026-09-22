import { describe, expect, it } from 'vitest'
import { decideStoryRenderStep } from '@/lib/share/decideStoryRenderStep'

const now = new Date('2026-09-22T20:00:00Z')
const secondsAgo = (seconds: number) => new Date(now.getTime() - seconds * 1000)

describe('story render step', () => {
  it('claims the render when nobody generated this round yet', () => {
    expect(decideStoryRenderStep(null, 'fingerprint', now)).toBe('claim')
  })

  it('serves the stored file when the round has not changed', () => {
    const record = { fingerprint: 'fingerprint', status: 'ready', imageKey: 'stored', startedAt: secondsAgo(300) }

    expect(decideStoryRenderStep(record, 'fingerprint', now)).toBe('serve')
  })

  it('waits while someone else is generating the same round', () => {
    const record = { fingerprint: 'fingerprint', status: 'rendering', imageKey: null, startedAt: secondsAgo(5) }

    expect(decideStoryRenderStep(record, 'fingerprint', now)).toBe('wait')
  })

  it('takes over a render that got stuck', () => {
    const record = { fingerprint: 'fingerprint', status: 'rendering', imageKey: null, startedAt: secondsAgo(180) }

    expect(decideStoryRenderStep(record, 'fingerprint', now)).toBe('claim')
  })

  it('renders again when scores, photos or the layout changed', () => {
    const record = { fingerprint: 'old', status: 'ready', imageKey: 'stored', startedAt: secondsAgo(10) }

    expect(decideStoryRenderStep(record, 'new', now)).toBe('claim')
  })

  it('retries after a failed render', () => {
    const record = { fingerprint: 'fingerprint', status: 'failed', imageKey: null, startedAt: secondsAgo(10) }

    expect(decideStoryRenderStep(record, 'fingerprint', now)).toBe('claim')
  })
})
