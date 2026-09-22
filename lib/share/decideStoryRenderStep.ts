export const staleRenderAfterMilliseconds = 120_000

export type StoryRenderRecord = {
  fingerprint: string
  status: string
  imageKey: string | null
  startedAt: Date
}

export type StoryRenderStep = 'serve' | 'wait' | 'claim'

export const decideStoryRenderStep = (
  record: StoryRenderRecord | null,
  fingerprint: string,
  now: Date,
): StoryRenderStep => {
  if (!record || record.fingerprint !== fingerprint) return 'claim'
  if (record.status === 'ready' && record.imageKey) return 'serve'
  const isFreshRender = now.getTime() - record.startedAt.getTime() < staleRenderAfterMilliseconds
  if (record.status === 'rendering' && isFreshRender) return 'wait'
  return 'claim'
}
