import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { Providers } from '@/components/providers'
import { ToastProvider } from '@/components/toast'
import { CookieConsent } from '@/components/cookie-consent'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'TradeAI — IA de trading',
  description: 'Analyse de graphiques par IA avec gestion du risque.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon.svg', type: 'image/svg+xml', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#030712',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} ${inter.variable} ${display.variable}`}>
        <Providers>
          <ToastProvider>
            {children}
            <CookieConsent />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}
