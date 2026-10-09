import type { Metadata, Viewport } from 'next'
import { Providers } from '@/components/Providers'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#0c831f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Anmol Enterprises — Authorized McCain Foods Regional Distributor, Latur',
  description: 'Wholesale and retail McCain frozen snacks delivered directly to your home, restaurant, hotel or cafe in Latur. Fresh & frozen cold chain delivery.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/emblem.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Anmol Enterprises',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico?v=3" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png?v=3" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                                     window.matchMedia('(display-mode: fullscreen)').matches ||
                                     window.navigator.standalone === true ||
                                     new URLSearchParams(window.location.search).has('pwa_splash');
                  var hasSeen = sessionStorage.getItem('anmol_pwa_splash_seen');
                  if (isStandalone && !hasSeen) {
                    document.documentElement.classList.add('pwa-standalone-launch');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-brand-orange-light/20 text-brand-charcoal">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
