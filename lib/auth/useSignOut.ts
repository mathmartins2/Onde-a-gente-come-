'use client'

import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/http/apiClient'

export const useSignOut = () => {
  const router = useRouter()
  return async () => {
    await apiClient.post('/auth/logout')
    router.replace('/login')
    router.refresh()
  }
}
