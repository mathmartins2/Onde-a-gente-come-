import { setTimeout as sleep } from 'node:timers/promises'
import { and, eq, sql } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { resolveImageStorage } from '@/lib/images/resolveImageStorage'
import { decideStoryRenderStep, staleRenderAfterMilliseconds, type StoryRenderRecord } from '@/lib/share/decideStoryRenderStep'
import { storySize } from '@/lib/share/storyTheme'

export type StoryRenderKind = 'image' | 'video'

export type RenderedStory = { bytes: Buffer; contentType: string }

const pollIntervalInMilliseconds = 1000
const maximumWaitInMilliseconds = 110_000

const matchesRender = (visitId: string, kind: StoryRenderKind) =>
  and(eq(schema.storyRenders.visitId, visitId), eq(schema.storyRenders.kind, kind))

const readRenderRecord = async (visitId: string, kind: StoryRenderKind): Promise<StoryRenderRecord | null> => {
  const rows = await database
    .select({
      fingerprint: schema.storyRenders.fingerprint,
      status: schema.storyRenders.status,
      imageKey: schema.storyRenders.imageKey,
      startedAt: schema.storyRenders.startedAt,
    })
    .from(schema.storyRenders)
    .where(matchesRender(visitId, kind))
    .limit(1)
  return rows.at(0) ?? null
}

const claimRender = async (visitId: string, kind: StoryRenderKind, fingerprint: string) => {
  const staleSeconds = staleRenderAfterMilliseconds / 1000
  const result = await database.execute(sql`
    insert into story_renders (visit_id, kind, fingerprint, status, started_at)
    values (${visitId}, ${kind}, ${fingerprint}, 'rendering', now())
    on conflict (visit_id, kind) do update
      set fingerprint = excluded.fingerprint, status = 'rendering', started_at = now()
      where story_renders.fingerprint <> excluded.fingerprint
         or story_renders.status = 'failed'
         or (story_renders.status = 'ready' and story_renders.image_key is null)
         or (story_renders.status = 'rendering' and story_renders.started_at < now() - make_interval(secs => ${staleSeconds}))
    returning id
  `)
  return result.rows.length > 0
}

const markRender = (visitId: string, kind: StoryRenderKind, fingerprint: string, values: { status: string; imageKey?: string | null }) =>
  database
    .update(schema.storyRenders)
    .set(values)
    .where(and(matchesRender(visitId, kind), eq(schema.storyRenders.fingerprint, fingerprint)))

const produceAndStore = async (input: {
  visitId: string
  kind: StoryRenderKind
  fingerprint: string
  previousImageKey: string | null
  render: () => Promise<RenderedStory>
}) => {
  const storage = resolveImageStorage()
  try {
    const rendered = await input.render()
    const imageKey = await storage.saveImage({ ...rendered, ...storySize })
    await markRender(input.visitId, input.kind, input.fingerprint, { status: 'ready', imageKey })
    if (input.previousImageKey && input.previousImageKey !== imageKey) await storage.removeImage(input.previousImageKey)
    return rendered
  } catch (error) {
    await markRender(input.visitId, input.kind, input.fingerprint, { status: 'failed' })
    throw error
  }
}

const readStoredRender = async (imageKey: string): Promise<RenderedStory | null> => {
  const stored = await resolveImageStorage().readImage(imageKey)
  return stored ? { bytes: stored.bytes, contentType: stored.contentType } : null
}

export const renderStoryOnce = async (input: {
  visitId: string
  kind: StoryRenderKind
  fingerprint: string
  render: () => Promise<RenderedStory>
}): Promise<RenderedStory> => {
  const attempt = async (elapsedMilliseconds: number): Promise<RenderedStory> => {
    const record = await readRenderRecord(input.visitId, input.kind)
    const step = decideStoryRenderStep(record, input.fingerprint, new Date())

    const stored = step === 'serve' && record?.imageKey ? await readStoredRender(record.imageKey) : null
    if (stored) return stored
    if (step === 'serve') await markRender(input.visitId, input.kind, input.fingerprint, { status: 'failed' })

    const hasClaimed = step !== 'wait' && (await claimRender(input.visitId, input.kind, input.fingerprint))
    if (hasClaimed) return produceAndStore({ ...input, previousImageKey: record?.imageKey ?? null })

    if (elapsedMilliseconds >= maximumWaitInMilliseconds) throw new Error('Timed out waiting for the story render')
    await sleep(pollIntervalInMilliseconds)
    return attempt(elapsedMilliseconds + pollIntervalInMilliseconds)
  }

  return attempt(0)
}
