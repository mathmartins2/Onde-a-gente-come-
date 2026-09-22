'use client'

import { useSyncExternalStore } from 'react'
import {
  defaultThemePreference,
  parseThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from './themePreference'

const themeChangeEventName = 'theme-preference-change'
const darkSchemeQuery = '(prefers-color-scheme: dark)'

const readDocumentThemePreference = () => parseThemePreference(document.documentElement.dataset.theme)

const readResolvedTheme = (): ResolvedTheme =>
  resolveTheme(readDocumentThemePreference(), window.matchMedia(darkSchemeQuery).matches)

const subscribeToThemeChanges = (onChange: () => void) => {
  const schemeQuery = window.matchMedia(darkSchemeQuery)
  window.addEventListener(themeChangeEventName, onChange)
  schemeQuery.addEventListener('change', onChange)
  return () => {
    window.removeEventListener(themeChangeEventName, onChange)
    schemeQuery.removeEventListener('change', onChange)
  }
}

export const applyThemePreference = (preference: ThemePreference) => {
  document.documentElement.dataset.theme = preference
  window.dispatchEvent(new Event(themeChangeEventName))
}

export const useThemePreference = (serverPreference: ThemePreference = defaultThemePreference) =>
  useSyncExternalStore(subscribeToThemeChanges, readDocumentThemePreference, () => serverPreference)

export const useResolvedTheme = () =>
  useSyncExternalStore(subscribeToThemeChanges, readResolvedTheme, (): ResolvedTheme => 'dark')
