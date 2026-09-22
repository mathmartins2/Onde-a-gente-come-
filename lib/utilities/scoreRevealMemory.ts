const storageKeyFor = (visitId: string) => `score-reveal-seen:${visitId}`

export const hasSeenScoreReveal = (visitId: string | undefined) => {
  if (!visitId || typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(storageKeyFor(visitId)) === 'true'
  } catch {
    return false
  }
}

export const rememberScoreReveal = (visitId: string | undefined) => {
  if (!visitId) return
  try {
    window.localStorage.setItem(storageKeyFor(visitId), 'true')
  } catch {
    return
  }
}
