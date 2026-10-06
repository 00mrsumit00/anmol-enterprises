'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle } from 'lucide-react'

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSTip, setShowIOSTip] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Check if already running in standalone PWA mode (already installed & opened from home screen)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // 2. Check if user dismissed the banner recently (within 3 days)
    const dismissedAt = localStorage.getItem('anmol_install_banner_dismissed')
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismiss < 3) {
        return
      }
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // 4. Capture native beforeinstallprompt event (Android Chrome, Edge, desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 5. Detect if app gets installed
    window.addEventListener('appinstalled', () => {
      setShowBanner(false)
      setIsInstalled(true)
      setDeferredPrompt(null)
    })

    // Show banner on mobile/desktop browsers even if prompt hasn't fired yet
    const timer = setTimeout(() => {
      setShowBanner(true)
    }, 1200)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSTip(true)
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    } else {
      // Fallback for browsers where beforeinstallprompt isn't available or already fired
      setShowIOSTip(true)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowIOSTip(false)
    try {
      localStorage.setItem('anmol_install_banner_dismissed', Date.now().toString())
    } catch {}
  }

  if (!showBanner || isInstalled) return null

  return (
    <>
      {/* Top Floating App Install Banner (Styled directly from user design) */}
      <div className="relative z-50 w-full bg-gradient-to-r from-[#142A63] via-[#1E40AF] to-[#2563EB] text-white shadow-md border-b border-blue-400/20 px-3 sm:px-6 py-2.5 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: App Logo & Information */}
          <div className="flex items-center gap-3 min-w-0">
            {/* High-res App Icon with Squircle Frame */}
            <div className="relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white p-1 shadow-md overflow-hidden ring-2 ring-white/30 flex items-center justify-center">
              <Image
                src="/icons/icon-192.png"
                alt="Anmol App Icon"
                width={48}
                height={48}
                className="w-full h-full object-contain rounded-lg"
                priority
              />
              <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-[8px] font-extrabold text-white text-center py-0.2 tracking-tighter uppercase leading-none">
                10-Min
              </span>
            </div>

            {/* App Title & Benefit Subtitle */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight truncate leading-tight">
                  Install Anmol Mobile App
                </h4>
                <span className="hidden sm:inline-flex items-center gap-1 bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  ⚡ Fast & Lite
                </span>
              </div>
              <p className="text-xs text-blue-100/90 truncate sm:whitespace-normal leading-snug">
                Access McCain frozen snacks, orders & live tracking instantly from your home screen.
              </p>
            </div>
          </div>

          {/* Right: Install CTA Button & Dismiss */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={handleInstallClick}
              type="button"
              className="group relative inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm px-3.5 sm:px-5 py-2 rounded-full shadow-lg hover:shadow-orange-500/30 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-y-0.5" />
              <span>Install Now</span>
            </button>

            <button
              onClick={handleDismiss}
              type="button"
              className="text-blue-200 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* iOS & Manual Install Instruction Modal */}
      {showIOSTip && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-800 shadow-2xl animate-in fade-in slide-in-from-bottom duration-300 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Install Anmol App</h3>
                  <p className="text-[11px] text-slate-500">Quick 2-step home screen setup</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSTip(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-sm">
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Tap the Share button</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    Look for <Share className="w-3.5 h-3.5 text-blue-600 inline" /> in Safari or your browser toolbar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Select &quot;Add to Home Screen&quot;</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-emerald-600 inline" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSTip(false)}
              className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md active:scale-98 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  )
}
