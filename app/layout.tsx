import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { getCurrentMember } from '@/lib/auth/currentMember'
import { lightPalette, palette } from '@/lib/theme/palette'
import { defaultThemePreference, type ThemePreference } from '@/lib/theme/themePreference'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Onde a gente come',
  description: 'Sorteio de restaurante do grupo',
}

const themeColorByPreference: Record<ThemePreference, Viewport['themeColor']> = {
  dark: palette.canvas,
  light: lightPalette.canvas,
  system: [
    { media: '(prefers-color-scheme: light)', color: lightPalette.canvas },
    { media: '(prefers-color-scheme: dark)', color: palette.canvas },
  ],
}

const loadThemePreference = async () => {
  const member = await getCurrentMember()
  return member?.themePreference ?? defaultThemePreference
}

export const generateViewport = async (): Promise<Viewport> => ({
  themeColor: themeColorByPreference[await loadThemePreference()],
  width: 'device-width',
  initialScale: 1,
})

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const themePreference = await loadThemePreference()

  return (
    <html lang="pt-BR" data-theme={themePreference}>
      <body className={`${geistSans.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
        <Toaster theme={themePreference} position="top-center" richColors />
      </body>
    </html>
  )
}

export default RootLayout
