'use client'

import React, { useState, useEffect } from 'react'
import AnimatedLogo from './AnimatedLogo'
import { Sparkles, Snowflake, Truck } from 'lucide-react'

const SPLASH_DURATION_MS = 5000 // 5 seconds minimum

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('Initializing Cold-Chain Express...')

  useEffect(() => {
    // Check if user has already seen splash screen in this browser session
    const hasSeen = typeof window !== 'undefined' ? sessionStorage.getItem('anmol_splash_seen') : null
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const forceShow = urlParams?.has('splash')

    if (hasSeen && !forceShow) {
      return
    }

    setIsVisible(true)

    // Dynamic status text sequence over 5 seconds
    const t1 = setTimeout(() => {
      setStatusMessage('Ensuring -18°C Sub-Zero Quality ❄️')
    }, 1600)

    const t2 = setTimeout(() => {
      setStatusMessage('Authorized McCain Express Delivery Ready ⚡')
    }, 3400)

    // Trigger smooth CSS progress bar to 100% on next tick
    const pTimer = setTimeout(() => {
      setProgress(100)
    }, 50)

    // Fade out after 5 seconds
    const dismissTimer = setTimeout(() => {
      triggerDismiss()
    }, SPLASH_DURATION_MS)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(pTimer)
      clearTimeout(dismissTimer)
    }
  }, [])

  const triggerDismiss = () => {
    setIsFadingOut(true)
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('anmol_splash_seen', 'true')
      } catch {}
    }
    setTimeout(() => {
      setIsVisible(false)
    }, 700) // matches transition duration
  }

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-white text-slate-800 transition-all duration-700 ease-out select-none px-6 py-8 sm:py-12 ${
        isFadingOut ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse 90% 70% at 50% 30%, #ecfdf5 0%, #ffffff 70%, #fffbeb 100%)',
      }}
      aria-label="Anmol Enterprises Launch Animation"
    >
      {/* Top Header Bar inside Splash */}
      <div className="w-full max-w-md flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800 tracking-wide uppercase shadow-xs">
          <Snowflake className="w-3.5 h-3.5 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Cold-Chain Express</span>
        </div>

        <button
          onClick={triggerDismiss}
          type="button"
          className="text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition-colors active:scale-95 cursor-pointer"
        >
          Skip &rarr;
        </button>
      </div>

      {/* Main Center Animation Stage */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg my-auto text-center">
        {/* Ambient Glow Aura */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-8 bg-gradient-to-r from-emerald-200/40 via-amber-200/30 to-emerald-200/40 rounded-full blur-2xl animate-pulse" />

          {/* Scaled High-Fidelity Anmol Logo with Delivery Scooter Animation */}
          <div className="relative transform scale-110 sm:scale-125 md:scale-135 py-6">
            <AnimatedLogo
              asDiv={true}
              showSubtext={true}
              svgClassName="h-16 sm:h-20 md:h-24 w-auto max-w-[290px] sm:max-w-[340px] drop-shadow-md"
            />
          </div>
        </div>

        {/* Distributor Badge & Tagline */}
        <div className="mt-8 space-y-1.5 animate-fadeIn">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Authorized McCain Regional Distributor &bull; Latur
          </p>
          <p className="text-sm font-semibold text-emerald-700">
            Fresh & Frozen Goodness Delivered at -18&deg;C
          </p>
        </div>
      </div>

      {/* Bottom Progress Bar & Real-time Status */}
      <div className="w-full max-w-sm flex flex-col items-center gap-3">
        {/* Dynamic Status Text */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 min-h-[20px]">
          <Truck className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
          <span className="transition-all duration-300">{statusMessage}</span>
        </div>

        {/* 5-Second Smooth Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600 rounded-full shadow-xs"
            style={{
              width: `${progress}%`,
              transition: `width ${SPLASH_DURATION_MS}ms linear`,
            }}
          />
        </div>

        {/* App Version & Footer */}
        <p className="text-[10px] text-slate-400 font-medium">
          Anmol Frozen Express &bull; Quick Delivery in Latur
        </p>
      </div>
    </div>
  )
}
