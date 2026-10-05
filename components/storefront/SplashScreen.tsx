'use client'

import React, { useState, useEffect, useCallback } from 'react'
import AnimatedLogo from './AnimatedLogo'

const SPLASH_DURATION_MS = 5000 // 5 seconds display

export default function SplashScreen() {
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const handleDismiss = useCallback(() => {
    setIsFadingOut(true)
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('anmol_pwa_splash_seen', 'true')
        document.documentElement.classList.remove('pwa-standalone-launch')
      } catch {}
    }
    setTimeout(() => {
      setIsDismissed(true)
    }, 700)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Verify if this is active PWA standalone launch
    const isPWALaunch = document.documentElement.classList.contains('pwa-standalone-launch')
    
    // If not a PWA standalone launch (e.g. normal website visitor), dismiss immediately
    if (!isPWALaunch) {
      setIsDismissed(true)
      return
    }

    // Run splash animation for 5 seconds, then smoothly fade out
    const timer = setTimeout(() => {
      handleDismiss()
    }, SPLASH_DURATION_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [handleDismiss])

  if (isDismissed) {
    return null
  }

  return (
    <div
      id="pwa-instant-splash"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[999999] bg-white flex flex-col items-center justify-center select-none transition-opacity duration-700 ease-out cursor-default ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Anmol PWA Launch Screen"
    >
      {/* Pure, Minimalist Brand Launch Centerpiece */}
      <div className="relative flex items-center justify-center transform scale-110 sm:scale-125 px-4">
        <AnimatedLogo
          asDiv={true}
          showSubtext={true}
          svgClassName="h-16 sm:h-20 md:h-24 w-auto max-w-[280px] sm:max-w-[340px] drop-shadow-sm"
        />
      </div>
    </div>
  )
}
