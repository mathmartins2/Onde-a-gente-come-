'use client'

import Link from 'next/link'
import { Sparkles, X } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { resolveMonthNumberInAppTimeZone, resolveYearInAppTimeZone } from '@/lib/utilities/appTimeZone'

const teaserMonthNumber = 12
const dismissalEventName = 'year-in-review-teaser-dismissed'

const buildDismissalKey = (year: number) => `year-in-review-teaser-dismissed-${year}`

const readDismissal = (year: number) => {
  try {
    return window.localStorage.getItem(buildDismissalKey(year)) === 'true'
  } catch {
    return false
  }
}

const subscribeToDismissal = (onChange: () => void) => {
  window.addEventListener(dismissalEventName, onChange)
  return () => window.removeEventListener(dismissalEventName, onChange)
}

const shouldShowTeaser = () => {
  const now = new Date()
  if (resolveMonthNumberInAppTimeZone(now) !== teaserMonthNumber) return false
  return !readDismissal(resolveYearInAppTimeZone(now))
}

const persistDismissal = (year: number) => {
  try {
    window.localStorage.setItem(buildDismissalKey(year), 'true')
    return true
  } catch {
    return false
  }
}

const dismissTeaser = () => {
  persistDismissal(resolveYearInAppTimeZone(new Date()))
  window.dispatchEvent(new Event(dismissalEventName))
}

export const YearInReviewTeaser = () => {
  const isVisible = useSyncExternalStore(subscribeToDismissal, shouldShowTeaser, () => false)
  if (!isVisible) return null

  const year = resolveYearInAppTimeZone(new Date())

  return (
    <div className="relative mb-4 flex items-center gap-3 overflow-hidden rounded-xl border border-accent/40 bg-[linear-gradient(120deg,rgba(255,107,53,0.2),rgba(255,61,120,0.12))] p-4">
      <Sparkles size={22} className="shrink-0 text-accent" />
      <Link href="/retrospective" className="min-w-0 flex-1">
        <p className="text-heading-sm">Sua retrospectiva {year} tá pronta</p>
        <p className="text-caption">O ano da mesa em stories, pronto pro Instagram.</p>
      </Link>
      <button
        type="button"
        onClick={dismissTeaser}
        aria-label="Dispensar aviso da retrospectiva"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-white/10"
      >
        <X size={16} />
      </button>
    </div>
  )
}
