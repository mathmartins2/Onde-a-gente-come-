'use client'

import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { classNames } from '@/lib/utilities/classNames'

type CollapsibleProps = {
  title: string
  summary?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

export const Collapsible = ({ title, summary, defaultOpen = false, children }: CollapsibleProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <section className="overflow-hidden rounded-xl border border-hairline bg-surface-1">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
      >
        <span className="text-heading-sm">{title}</span>
        <span className="flex items-center gap-2">
          {summary ? <span className="text-micro-cap text-ink-faint">{summary}</span> : null}
          <ChevronDown
            size={16}
            className={classNames(
              'shrink-0 text-ink-faint transition-transform duration-200',
              isOpen ? 'rotate-180' : '',
            )}
          />
        </span>
      </button>

      <div id={panelId} className={isOpen ? 'border-t border-hairline px-4 py-4' : 'hidden'}>
        {children}
      </div>
    </section>
  )
}
