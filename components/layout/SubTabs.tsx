'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { classNames } from '@/lib/utilities/classNames'

type SubTab = {
  href: string
  label: string
}

export const SubTabs = ({ tabs }: { tabs: readonly SubTab[] }) => {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Seções"
      className="-mx-4 mb-5 overflow-x-auto px-4 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex w-max gap-1 rounded-pill border border-hairline bg-surface-1 p-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={classNames(
                'flex min-h-9 items-center rounded-pill px-4 text-body-sm transition-colors',
                isActive
                  ? 'bg-accent-tint font-semibold text-accent'
                  : 'text-ink-muted hover:text-ink',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export const historyTabs = [
  { href: '/history', label: 'Rodadas' },
  { href: '/ranking', label: 'Ranking' },
  { href: '/statistics', label: 'Números' },
  { href: '/map', label: 'Mapa' },
  { href: '/retrospective', label: 'Retrospectiva' },
] as const

export const profileTabs = [
  { href: '/profile', label: 'Conta' },
  { href: '/rules', label: 'Regras' },
] as const
