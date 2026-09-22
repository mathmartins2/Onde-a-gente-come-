export const themePreferences = ['dark', 'light', 'system'] as const

export type ThemePreference = (typeof themePreferences)[number]

export type ResolvedTheme = Exclude<ThemePreference, 'system'>

export const defaultThemePreference: ThemePreference = 'dark'

const isThemePreference = (value: unknown): value is ThemePreference =>
  themePreferences.some((preference) => preference === value)

export const parseThemePreference = (value: unknown): ThemePreference =>
  isThemePreference(value) ? value : defaultThemePreference

export const resolveTheme = (preference: ThemePreference, prefersDarkScheme: boolean): ResolvedTheme => {
  if (preference !== 'system') return preference
  return prefersDarkScheme ? 'dark' : 'light'
}
