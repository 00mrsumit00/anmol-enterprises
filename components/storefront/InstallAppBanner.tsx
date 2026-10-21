'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Download, X, Share, PlusSquare, Smartphone, Monitor, CheckCircle, ChevronUp } from 'lucide-react'

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop')
  const [showTutorialModal, setShowTutorialModal] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  // Touch swipe handling
  const touchStartY = useRef<number | null>(null)
  const touchCurrentY = useRef<number | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Check if running in standalone PWA mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // 2. Check if user dismissed recently (within 2 days)
    const dismissedAt = localStorage.getItem('anmol_install_banner_dismissed')
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismiss < 2) {
        return
      }
    }

    // 3. Detect device type
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isAndroidDevice = /android/.test(userAgent)

    if (isIosDevice) {
      setDeviceType('ios')
    } else if (isAndroidDevice) {
      setDeviceType('android')
    } else {
      setDeviceType('desktop')
    }

    // 4. Capture native beforeinstallprompt event
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

    // Slide down gracefully from the top after 1.5 seconds
    const timer = setTimeout(() => {
      setShowBanner(true)
    }, 1500)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          setShowBanner(false)
          setIsInstalled(true)
        }
        setDeferredPrompt(null)
      } catch (err) {
        console.warn('Install prompt error:', err)
      }
      return
    }

    setShowTutorialModal(true)
  }

  const handleDismiss = () => {
    setIsDismissing(true)
    setTimeout(() => {
      setShowBanner(false)
      setIsDismissing(false)
      setShowTutorialModal(false)
      try {
        localStorage.setItem('anmol_install_banner_dismissed', Date.now().toString())
      } catch {}
    }, 300)
  }

  // Touch event handlers for swipe-up dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    touchCurrentY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return
    touchCurrentY.current = e.touches[0].clientY
    const diff = touchCurrentY.current - touchStartY.current
    if (diff < 0) {
      // Swiping up
      setSwipeOffset(diff)
    }
  }

  const handleTouchEnd = () => {
    if (touchStartY.current !== null && touchCurrentY.current !== null) {
      const diff = touchCurrentY.current - touchStartY.current
      if (diff < -35) {
        // Swiped up by more than 35px -> dismiss
        handleDismiss()
      } else {
        setSwipeOffset(0)
      }
    }
    touchStartY.current = null
    touchCurrentY.current = null
  }

  if (!showBanner || isInstalled) return null

  return (
    <>
      {/* 
        Top Push Notification Pop-up
        - Pops down from top of screen with smooth bounce/slide animation
        - Swipe or slide up gesture to dismiss immediately
      */}
      <aside
        aria-label="App Installation Notification"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isDismissing 
            ? 'translateY(-120%) scale(0.95)' 
            : swipeOffset < 0 
            ? `translateY(${swipeOffset}px)` 
            : 'translateY(0)',
          transition: isDismissing ? 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 250ms' : swipeOffset !== 0 ? 'none' : 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className={`fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-[390px] z-[999] select-none ${
          isDismissing ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-300`}
      >
        <div className="relative overflow-hidden rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_20px_45px_rgba(0,0,0,0.65),0_0_20px_rgba(16,185,129,0.25)] p-3.5 text-white">
          
          {/* Subtle Swipe-Up Indicator Bar at Top */}
          <div className="flex justify-center -mt-1 mb-1.5 opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-10 h-1 rounded-full bg-slate-600 flex items-center justify-center">
              <ChevronUp className="w-2.5 h-2.5 text-slate-400" />
            </div>
          </div>

          {/* Ambient Glowing Halo */}
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-cyan-500/15 rounded-full blur-xl pointer-events-none" />

          {/* Top Live Node Status Header */}
          <div className="relative flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-400">
                OFFICIAL APP &bull; LATUR EXPRESS
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                Latur City
              </span>
              <button
                onClick={handleDismiss}
                type="button"
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Dismiss app notification"
                title="Swipe up or click to dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Middle App Identity & Value Proposition */}
          <div className="relative flex items-center gap-3 mb-3">
            {/* 3D Glowing App Icon with Glass Frame using Official Brand Emblem */}
            <div className="relative shrink-0 w-12 h-12 rounded-xl shadow-[0_4px_16px_rgba(16,185,129,0.35)] flex items-center justify-center bg-slate-900 border border-emerald-500/30 p-1">
              <Image
                src="/icons/emblem.png"
                alt="Anmol Enterprises Emblem"
                width={44}
                height={44}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm font-extrabold text-white tracking-tight leading-tight">
                  Anmol Enterprises
                </h4>
                <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                McCain Foods • Fast Latur Delivery
              </p>
              <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-1 leading-tight">
                Live order tracking, instant updates & discounts.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs py-2 px-3 rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.35)] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Install App</span>
            </button>
            <button
              onClick={handleDismiss}
              type="button"
              className="px-3 py-2 text-[11px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
            >
              Later
            </button>
          </div>

          <p className="text-[9px] text-center text-slate-400 mt-2 font-medium">
            Swipe up to dismiss &uarr;
          </p>

        </div>
      </aside>

      {/* Device-tailored Installation Modal (Dark Cyber-Glassmorphism) */}
      {showTutorialModal && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="relative overflow-hidden bg-slate-950/95 border border-emerald-500/30 rounded-3xl max-w-sm w-full p-6 text-white shadow-2xl animate-in fade-in slide-in-from-bottom duration-300">
            
            {/* Ambient Modal Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  {deviceType === 'desktop' ? (
                    <Monitor className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {deviceType === 'ios'
                      ? 'Install on iPhone'
                      : deviceType === 'android'
                      ? 'Install on Android'
                      : 'Install on Computer / PC'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {deviceType === 'ios'
                      ? 'Quick 2-step Safari setup'
                      : deviceType === 'android'
                      ? 'Quick 2-step Chrome setup'
                      : 'Install via Chrome or Edge'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTutorialModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              {/* 1. iOS Safari Instructions */}
              {deviceType === 'ios' && (
                <>
                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-white">Tap the Share button</p>
                      <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                        Tap <Share className="w-3.5 h-3.5 text-emerald-400 inline" /> in your Safari bottom toolbar.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-white">Select &quot;Add to Home Screen&quot;</p>
                      <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                        Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> <strong>Add to Home Screen</strong>.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* 2. Android Chrome Instructions */}
              {deviceType === 'android' && (
                <>
                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-white">Open Chrome Browser Menu</p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Tap the <strong>three dots (⋮)</strong> at the top-right corner of your browser.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-white">Tap &quot;Install app&quot; or &quot;Add to Home screen&quot;</p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Select <strong>Install app</strong> from the menu to add Anmol Enterprises to your device.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* 3. Desktop PC / Mac Instructions */}
              {deviceType === 'desktop' && (
                <>
                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-white">Click Install in the Address Bar</p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Look at the right side of your Chrome/Edge top URL address bar for the <strong>Install app (⊕)</strong> icon.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-white">Or use Browser Menu (⋮)</p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Click the <strong>three dots (⋮)</strong> &rarr; <strong>Save and Share</strong> &rarr; <strong>Install Anmol Enterprises</strong>.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowTutorialModal(false)}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
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
