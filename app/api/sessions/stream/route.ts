import { getCurrentMember } from '@/lib/auth/currentMember'
import { unauthorizedResponse } from '@/lib/http/routeHelpers'
import { buildSessionPayload } from '@/lib/services/sessionPayload'
import { subscribeToSessionChanges } from '@/lib/realtime/sessionChannel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const heartbeatIntervalInMilliseconds = 25000

export const GET = async () => {
  const member = await getCurrentMember()
  if (!member) return unauthorizedResponse()

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
        const payload = await buildSessionPayload(member).catch(() => null)
        if (!payload) return
        enqueue(`event: session\ndata: ${JSON.stringify(payload)}\n\n`)
      }

      const unsubscribe = subscribeToSessionChanges(() => {
        void pushState()
      })
      const heartbeat = setInterval(() => enqueue(': keep-alive\n\n'), heartbeatIntervalInMilliseconds)

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
