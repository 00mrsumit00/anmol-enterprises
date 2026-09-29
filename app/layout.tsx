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
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${dmSans.variable} ${baloo2.variable}`}>
      <body className="antialiased min-h-screen bg-brand-orange-light/20 text-brand-charcoal">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
