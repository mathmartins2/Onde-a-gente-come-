'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export const visitQueryKey = (visitId: string) => ['rating-session', visitId]

export const useVisitStream = (visitId: string) => {
  const queryClient = useQueryClient()
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    const source = new EventSource(`/api/visits/${visitId}/stream`)

    const handleVisit = (event: MessageEvent<string>) => {
      queryClient.setQueryData(visitQueryKey(visitId), JSON.parse(event.data))
      setIsStreaming(true)
    }

    source.addEventListener('visit', handleVisit)
    source.addEventListener('open', () => setIsStreaming(true))
    source.addEventListener('error', () => setIsStreaming(false))

    return () => {
      source.removeEventListener('visit', handleVisit)
      source.close()
    }
  }, [queryClient, visitId])

  return { isStreaming }
}
