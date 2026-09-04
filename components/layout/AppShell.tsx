'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  Dices,
  BookOpen,
  History,
  LogOut,
  MapPin,
  Trophy,
  User,
  UtensilsCrossed,
} from 'lucide-react'
import { apiClient } from '@/lib/http/apiClient'
import { classNames } from '@/lib/utilities/classNames'

const navigationItems = [
  { href: '/', label: 'Sorteio', icon: Dices },
  { href: '/restaurants', label: 'Lugares', icon: UtensilsCrossed },
  { href: '/history', label: 'Rodadas', icon: History },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/statistics', label: 'Números', icon: BarChart3 },
  { href: '/map', label: 'Mapa', icon: MapPin },
  { href: '/rules', label: 'Regras', icon: BookOpen },
  { href: '/profile', label: 'Perfil', icon: User },
]

const homeHref = '/'

const isRouteActive = (pathname: string, href: string) =>
  href === homeHref
    ? pathname === homeHref
    : pathname === href || pathname.startsWith(`${href}/`)

const initialLetterOf = (displayName: string) => displayName.trim().charAt(0).toUpperCase() || '?'

type AppShellProps = {
  displayName: string
  children: React.ReactNode
}

export const AppShell = ({ displayName, children }: AppShellProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    await apiClient.post('/auth/logout')
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_82%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href={homeHref} className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 -rotate-6 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(140deg,var(--accent-soft),var(--accent-deep))] text-[#20100a] shadow-[var(--shadow-accent)]">
              <UtensilsCrossed size={17} strokeWidth={2.4} />
            </span>
            <span className="min-w-0">
              <span className="font-display block truncate text-[17px] font-semibold leading-tight">
                Onde a gente <span className="text-[var(--accent)]">come</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Recife · mesa pra seis
              </span>
            </span>
          </Link>

          <button
            onClick={signOut}
            aria-label={`Sair da conta de ${displayName}`}
            className="group flex shrink-0 items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface)] py-1 pl-1 pr-3 transition-colors hover:border-[var(--accent)]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[11px] font-bold text-[var(--accent-soft)]">
              {initialLetterOf(displayName)}
            </span>
            <LogOut
              size={13}
              strokeWidth={2.2}
              className="text-[var(--muted)] transition-colors group-hover:text-[var(--accent)]"
            />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-[calc(var(--navigation-height)+var(--navigation-inset)*2+env(safe-area-inset-bottom)+1.5rem)] pt-6">
        {children}
      </main>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-28 bg-[linear-gradient(to_top,var(--background),transparent)]"
      />

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(var(--navigation-inset)+env(safe-area-inset-bottom))] pt-1"
      >
        <div className="mx-auto flex max-w-md items-stretch gap-0.5 rounded-[var(--radius-large)] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] p-1.5 shadow-[var(--shadow-lifted)] backdrop-blur-xl">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = isRouteActive(pathname, item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={classNames(
                  'flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-medium)] px-0 transition-colors duration-200',
                  isActive
                    ? 'bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]'
                    : 'text-[var(--muted)] active:bg-[var(--surface-raised)]',
                )}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.9} />
                <span
                  className={classNames(
                    'text-[9px] leading-none tracking-[0.01em]',
                    isActive ? 'font-bold' : 'font-medium',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
