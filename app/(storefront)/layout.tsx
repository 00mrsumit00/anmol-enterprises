'use client'

import React, { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/storefront/Navbar'
import BottomNav from '@/components/storefront/BottomNav'
import CartDrawer from '@/components/storefront/CartDrawer'
import FloatingCartBar from '@/components/storefront/FloatingCartBar'
import SplashScreen from '@/components/storefront/SplashScreen'
import InstallAppBanner from '@/components/storefront/InstallAppBanner'
import OrderNotificationListener from '@/components/storefront/OrderNotificationListener'

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isChat = pathname?.startsWith('/chat')
  const isOrderAgain = pathname?.startsWith('/order-again')
  const isProductPage = pathname?.startsWith('/product/')

  return (
    <div className="flex flex-col min-h-screen">
      {/* Real-time Step-by-Step Delivery Notifications & Post-Delivery Review Modal */}
      <OrderNotificationListener />

      {/* Cold Launch Brand Splash Screen (5 seconds) */}
      <SplashScreen />

      {/* Top Mobile & Desktop PWA Install Banner */}
      <InstallAppBanner />

      {/* Sticky Top Header */}
      <Suspense fallback={<header className="sticky top-0 z-[100] w-full bg-white h-16 shadow-xs border-b border-gray-100" />}>
        <Navbar />
      </Suspense>

      {/* Main Storefront Area */}
      <main className={
        isChat
          ? "flex-1 w-full p-0 flex flex-col"
          : isOrderAgain
          ? "flex-1 w-full mx-auto p-0 pb-20 md:pb-12"
          : isProductPage
          ? "flex-1 max-w-7xl w-full mx-auto px-4 py-4 md:py-6 pb-20 md:pb-12"
          : "flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-24 md:pb-12"
      }>
        {children}
      </main>

      {/* Floating Bottom Cart Bar (Blinkit/Zepto Style) - hidden on chat and product detail pages */}
      {!isChat && !isProductPage && <FloatingCartBar />}

      {/* PWA Mobile Bottom Tab Navigation - hidden on chat and product detail pages */}
      {!isChat && !isProductPage && <BottomNav />}

      {/* Side Slide Cart Drawer */}
      <CartDrawer />
    </div>
  )
}
