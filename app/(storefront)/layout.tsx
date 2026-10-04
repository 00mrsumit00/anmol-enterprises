'use client'

import React, { Suspense } from 'react'
import Navbar from '@/components/storefront/Navbar'
import BottomNav from '@/components/storefront/BottomNav'
import CartDrawer from '@/components/storefront/CartDrawer'
import FloatingCartBar from '@/components/storefront/FloatingCartBar'
import SplashScreen from '@/components/storefront/SplashScreen'

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Cold Launch Brand Splash Screen (5 seconds) */}
      <SplashScreen />

      {/* Sticky Top Header */}
      <Suspense fallback={<header className="sticky top-0 z-[100] w-full bg-white h-16 shadow-xs border-b border-gray-100" />}>
        <Navbar />
      </Suspense>

      {/* Main Storefront Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* Floating Bottom Cart Bar (Blinkit/Zepto Style) */}
      <FloatingCartBar />

      {/* PWA Mobile Bottom Tab Navigation */}
      <BottomNav />

      {/* Side Slide Cart Drawer */}
      <CartDrawer />
    </div>
  )
}
