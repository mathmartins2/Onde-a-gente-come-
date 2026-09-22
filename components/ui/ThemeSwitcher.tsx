'use client'

import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { apiClient, extractErrorMessage } from '@/lib/http/apiClient'
import { applyThemePreference, useThemePreference } from '@/lib/theme/themeDocument'
import type { ThemePreference } from '@/lib/theme/themePreference'
import { classNames } from '@/lib/utilities/classNames'

const themeOptions: Array<{ preference: ThemePreference; label: string; icon: LucideIcon }> = [
  { preference: 'light', label: 'Claro', icon: Sun },
  { preference: 'dark', label: 'Escuro', icon: Moon },
  { preference: 'system', label: 'Automático', icon: Monitor },
]

type ThemeSwitcherProps = {
  initialPreference: ThemePreference
  isCompact?: boolean
  className?: string
}

const findNextOption = (preference: ThemePreference) => {
  const currentPosition = themeOptions.findIndex((option) => option.preference === preference)
  return themeOptions[(currentPosition + 1) % themeOptions.length]
}

export const ThemeSwitcher = ({ initialPreference, isCompact = false, className }: ThemeSwitcherProps) => {
  const router = useRouter()
  const currentPreference = useThemePreference(initialPreference)

  const selectPreference = async (preference: ThemePreference) => {
    if (preference === currentPreference) return
    const previousPreference = currentPreference
    applyThemePreference(preference)
    try {
      await apiClient.put('/members/me/theme', { themePreference: preference })
      router.refresh()
    } catch (error) {
      applyThemePreference(previousPreference)
      toast.error(extractErrorMessage(error, 'Não deu pra salvar o tema'))
    }
  }

  if (isCompact) {
    const currentOption = themeOptions.find((option) => option.preference === currentPreference) ?? themeOptions[1]
    const nextOption = findNextOption(currentPreference)
    const CurrentIcon = currentOption.icon
    return (
      <button
        type="button"
        aria-label={`Tema: ${currentOption.label}. Trocar para ${nextOption.label}`}
        title={`Tema: ${currentOption.label}`}
        onClick={() => selectPreference(nextOption.preference)}
        className={classNames(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink',
          className,
        )}
      >
        <CurrentIcon size={16} strokeWidth={2.2} />
      </button>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className={classNames('inline-flex items-center gap-0.5 rounded-pill border border-hairline bg-surface-1 p-0.5', className)}
    >
      {themeOptions.map((option) => {
        const isSelected = option.preference === currentPreference
        const Icon = option.icon
        return (
          <button
            key={option.preference}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            title={option.label}
            onClick={() => selectPreference(option.preference)}
            className={classNames(
              'flex h-8 w-8 items-center justify-center rounded-pill transition-colors',
              isSelected ? 'bg-accent text-on-accent' : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
            )}
          >
            <Icon size={15} strokeWidth={2.2} />
          </button>
        )
      })}
    </div>
  )
}
