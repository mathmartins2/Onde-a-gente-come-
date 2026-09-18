'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { SessionState } from './sessionQueries'

export const sessionQueryKey = ['session']

export const useSessionStream = () => {
  const queryClient = useQueryClient()
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    const source = new EventSource('/api/sessions/stream')

    const handleSession = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as SessionState
      queryClient.setQueryData(sessionQueryKey, payload)
      setIsStreaming(true)
    }

    source.addEventListener('session', handleSession)
    source.addEventListener('open', () => setIsStreaming(true))
    source.addEventListener('error', () => setIsStreaming(false))

    return () => {
      source.removeEventListener('session', handleSession)
      source.close()
    }
  }, [queryClient])

  return { isStreaming }
}
