import type { Metadata, Viewport } from 'next'
import { Poppins, DM_Sans, Baloo_2 } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const baloo2 = Baloo_2({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-baloo-2',
  display: 'swap',
})

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
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Anmol',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${dmSans.variable} ${baloo2.variable}`}>
      <head>
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
