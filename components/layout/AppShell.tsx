'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Dices, History, LogOut, User, UtensilsCrossed } from 'lucide-react'
import { apiClient } from '@/lib/http/apiClient'
import { Avatar } from '@/components/ui/Avatar'
import { BrandMark } from '@/components/ui/BrandMark'
import { BrandWordmark } from '@/components/ui/BrandWordmark'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import type { ThemePreference } from '@/lib/theme/themePreference'
import { classNames } from '@/lib/utilities/classNames'

const homeHref = '/'

const destinations = [
  { href: homeHref, label: 'Sorteio', icon: Dices, routes: [homeHref] },
  {
    href: '/restaurants',
    label: 'Lugares',
    icon: UtensilsCrossed,
    routes: ['/restaurants'],
  },
  {
    href: '/history',
    label: 'Histórico',
    icon: History,
    routes: ['/history', '/ranking', '/statistics', '/map', '/retrospective'],
  },
  { href: '/profile', label: 'Perfil', icon: User, routes: ['/profile', '/rules'] },
]

const matchesRoute = (pathname: string, route: string) => {
  if (route === homeHref) return pathname === homeHref
  return pathname === route || pathname.startsWith(`${route}/`)
}

const isDestinationActive = (pathname: string, routes: readonly string[]) =>
  routes.some((route) => matchesRoute(pathname, route))

type AppShellProps = {
  displayName: string
  avatarUrl: string | null
  themePreference: ThemePreference
  children: React.ReactNode
}

export const AppShell = ({ displayName, avatarUrl, themePreference, children }: AppShellProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    await apiClient.post('/auth/logout')
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="min-h-dvh lg:flex">
      <nav
        aria-label="Navegação principal"
        className="hidden shrink-0 border-r border-hairline lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:flex-col lg:gap-1 lg:p-4"
      >
        <Link href={homeHref} className="mb-6 flex flex-col gap-2 px-2">
          <BrandMark size={40} className="shrink-0" />
          <span>
            <span className="font-display block text-heading-lg leading-tight">
              <BrandWordmark isStacked />
            </span>
            <span className="mt-1 block text-micro-cap text-ink-faint">Recife · mesa pra seis</span>
          </span>
        </Link>

        {destinations.map((destination) => {
          const Icon = destination.icon
          const isActive = isDestinationActive(pathname, destination.routes)

          return (
            <Link
              key={destination.href}
              href={destination.href}
              aria-current={isActive ? 'page' : undefined}
              className={classNames(
                'flex min-h-11 items-center gap-3 rounded-lg px-3 text-body-md transition-colors',
                isActive
                  ? 'bg-accent-tint font-semibold text-accent'
                  : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.4 : 1.9} />
              {destination.label}
            </Link>
          )
        })}

        <div className="mt-auto flex items-center gap-1 rounded-xl border border-hairline bg-surface-1 p-1">
          <button
            onClick={signOut}
            className="flex min-h-10 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 text-body-md text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Avatar name={displayName} imageUrl={avatarUrl} size="small" />
            Sair
          </button>
          <span aria-hidden className="h-6 w-px shrink-0 bg-hairline" />
          <ThemeSwitcher initialPreference={themePreference} className="border-0 bg-transparent p-0" />
        </div>
      </nav>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-hairline bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <Link href={homeHref} className="flex min-w-0 items-center gap-2.5">
              <BrandMark size={34} className="shrink-0" />
              <span className="min-w-0">
                <span className="font-display block truncate text-heading-md">
                  <BrandWordmark />
                </span>
                <span className="block text-micro-cap text-ink-faint">Recife · mesa pra seis</span>
              </span>
            </Link>

            <div className="flex h-11 shrink-0 items-center gap-1 rounded-pill border border-hairline bg-surface-1 p-1">
              <ThemeSwitcher initialPreference={themePreference} isCompact />
              <span aria-hidden className="h-5 w-px shrink-0 bg-hairline" />
              <button
                onClick={signOut}
                aria-label={`Sair da conta de ${displayName}`}
                className="group flex h-9 shrink-0 items-center gap-1.5 rounded-pill pl-0.5 pr-2.5 transition-colors hover:bg-surface-2"
              >
                <Avatar name={displayName} imageUrl={avatarUrl} size="small" className="h-8 w-8" />
                <LogOut
                  size={14}
                  strokeWidth={2.2}
                  className="text-ink-muted transition-colors group-hover:text-accent"
                />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 pb-[calc(var(--navigation-height)+var(--navigation-inset)*2+env(safe-area-inset-bottom)+1.5rem)] pt-6 lg:max-w-5xl lg:px-8 lg:pb-12">
          {children}
        </main>
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-28 bg-[linear-gradient(to_top,var(--canvas),transparent)] lg:hidden"
      />

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(var(--navigation-inset)+env(safe-area-inset-bottom))] pt-1 lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-stretch gap-1 rounded-2xl border border-hairline-strong bg-[color-mix(in_srgb,var(--surface-1)_92%,transparent)] p-1.5 shadow-[var(--elevation-3)] backdrop-blur-xl">
          {destinations.map((destination) => {
            const Icon = destination.icon
            const isActive = isDestinationActive(pathname, destination.routes)

            return (
              <Link
                key={destination.href}
                href={destination.href}
                aria-current={isActive ? 'page' : undefined}
                className={classNames(
                  'flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-1 rounded-lg transition-colors duration-200',
                  isActive
                    ? 'bg-accent-tint text-accent'
                    : 'text-ink-muted active:bg-surface-2',
                )}
              >
                <Icon size={19} strokeWidth={isActive ? 2.5 : 1.9} />
                <span
                  className={classNames(
                    'text-[11px] leading-none',
                    isActive ? 'font-bold' : 'font-medium',
                  )}
                >
                  {destination.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
