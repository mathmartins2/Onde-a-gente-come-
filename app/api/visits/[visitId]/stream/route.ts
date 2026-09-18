import { getCurrentMember } from '@/lib/auth/currentMember'
import { unauthorizedResponse } from '@/lib/http/routeHelpers'
import { listRatingParticipants, loadRatingSession } from '@/lib/services/ratingService'
import { subscribeToVisitChanges } from '@/lib/realtime/sessionChannel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const heartbeatIntervalInMilliseconds = 25000

export const GET = async (_request: Request, context: { params: Promise<{ visitId: string }> }) => {
  const member = await getCurrentMember()
  if (!member) return unauthorizedResponse()

  const { visitId } = await context.params
  const encoder = new TextEncoder()
  let releaseSubscription = () => {}
  let stopHeartbeat = () => {}
  let isClosed = false

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (chunk: string) => {
        if (isClosed) return
        controller.enqueue(encoder.encode(chunk))
      }

      const pushState = async () => {
        const session = await loadRatingSession(visitId).catch(() => null)
        if (!session) return
        const participants = await listRatingParticipants(visitId).catch(() => [])
        enqueue(`event: visit\ndata: ${JSON.stringify({ ...session, participants })}\n\n`)
      }

      const unsubscribe = subscribeToVisitChanges((changedVisitId) => {
        if (changedVisitId !== visitId) return
        void pushState()
      })
      const heartbeat = setInterval(
        () => enqueue(': keep-alive\n\n'),
        heartbeatIntervalInMilliseconds,
      )

      releaseSubscription = unsubscribe
      stopHeartbeat = () => clearInterval(heartbeat)

      void pushState()
    },
    cancel() {
      isClosed = true
      stopHeartbeat()
      releaseSubscription()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
