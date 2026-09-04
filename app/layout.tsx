import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/providers/QueryProvider'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Onde a gente come',
  description: 'Sorteio de restaurante do grupo',
}

export const viewport: Viewport = {
  themeColor: '#0d0a09',
  width: 'device-width',
  initialScale: 1,
}

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="pt-BR">
    <body className={`${geistSans.variable} antialiased`}>
      <QueryProvider>{children}</QueryProvider>
      <Toaster theme="dark" position="top-center" richColors />
    </body>
  </html>
)

export default RootLayout
