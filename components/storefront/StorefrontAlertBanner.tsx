'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, X, ArrowRight, Flame, AlertTriangle, Bell, Info } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useCart } from '@/hooks/useCart'
import Link from 'next/link'

export default function StorefrontAlertBanner() {
  const [dismissedAlertId, setDismissedAlertId] = useState<string | null>(null)
  const { open } = useCart()

  // Query active store alert
  const { data } = useQuery({
    queryKey: ['active-store-alert'],
    queryFn: async () => {
      const res = await fetch('/api/store-alerts/active')
      if (!res.ok) return { alert: null }
      return res.json()
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Re-check every minute for live emergency or offer updates
  })

  const alert = data?.alert

  useEffect(() => {
    if (alert?.id && typeof window !== 'undefined') {
      const isDismissed = sessionStorage.getItem(`dismissed_alert_${alert.id}`)
      if (isDismissed) {
        setDismissedAlertId(alert.id)
      }
    }
  }, [alert?.id])

  const handleDismiss = () => {
    if (alert?.id) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`dismissed_alert_${alert.id}`, 'true')
      }
      setDismissedAlertId(alert.id)
    }
  }

  if (!alert || !alert.isActive || dismissedAlertId === alert.id) return null

  // Determine theme styling and icons based on alertType
  const alertType = alert.alertType || 'OFFER'

  let bgClasses = 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 border-amber-400/40 text-white'
  let glowClasses = 'shadow-[0_2px_18px_rgba(245,158,11,0.45)]'
  let badgeBg = 'bg-white/20 text-white'
  let btnClasses = 'bg-white text-orange-600 hover:bg-amber-50'
  let icon = <Flame className="w-4 h-4 text-amber-200 fill-amber-300 animate-pulse shrink-0" />

  if (alertType === 'WARNING') {
    bgClasses = 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 border-rose-500/50 text-white'
    glowClasses = 'shadow-[0_2px_18px_rgba(225,29,72,0.5)]'
    badgeBg = 'bg-black/25 text-rose-100 border border-white/20'
    btnClasses = 'bg-white text-rose-700 hover:bg-rose-50'
    icon = <AlertTriangle className="w-4 h-4 text-rose-200 animate-bounce shrink-0" />
  } else if (alertType === 'INFO') {
    bgClasses = 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 border-blue-400/40 text-white'
    glowClasses = 'shadow-[0_2px_18px_rgba(37,99,235,0.45)]'
    badgeBg = 'bg-white/20 text-white'
    btnClasses = 'bg-white text-blue-700 hover:bg-blue-50'
    icon = <Info className="w-4 h-4 text-blue-200 shrink-0" />
  } else if (alertType === 'ANNOUNCEMENT') {
    bgClasses = 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border-emerald-400/40 text-white'
    glowClasses = 'shadow-[0_2px_18px_rgba(16,185,129,0.45)]'
    badgeBg = 'bg-white/20 text-white'
    btnClasses = 'bg-white text-emerald-800 hover:bg-emerald-50'
    icon = <Bell className="w-4 h-4 text-emerald-200 animate-pulse shrink-0" />
  }

  const hasCta = Boolean(alert.ctaText)
  const isExternalLink = alert.ctaLink?.startsWith('http')

  return (
    <aside
      aria-label="Store Alert Announcement"
      className={`relative ${bgClasses} text-xs font-bold py-2.5 px-4 z-[95] border-b transition-all duration-300 ${alert.isGlowing !== false ? glowClasses : 'shadow-xs'}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Icon, Title / Message, Badge */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon}

          <div className="flex items-center gap-2 truncate">
            {alert.title && (
              <span className="font-black tracking-tight shrink-0 hidden sm:inline">
                {alert.title} —
              </span>
            )}
            <span className="truncate font-bold">
              {alert.message || alert.title}
            </span>
          </div>

          {alert.badgeText && (
            <span className={`hidden md:inline-flex items-center text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shrink-0 shadow-2xs ${badgeBg}`}>
              {alert.badgeText}
            </span>
          )}
        </div>

        {/* Right: Optional Action Button + Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          {hasCta && (
            alert.ctaLink ? (
              isExternalLink ? (
                <a
                  href={alert.ctaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`hidden xs:flex items-center gap-1 font-black text-[11px] px-3 py-1 rounded-xl shadow-xs transition-all active:scale-95 ${btnClasses}`}
                >
                  <span>{alert.ctaText}</span>
                  <ArrowRight className="w-3 h-3 stroke-[3]" />
                </a>
              ) : (
                <Link
                  href={alert.ctaLink}
                  className={`hidden xs:flex items-center gap-1 font-black text-[11px] px-3 py-1 rounded-xl shadow-xs transition-all active:scale-95 ${btnClasses}`}
                >
                  <span>{alert.ctaText}</span>
                  <ArrowRight className="w-3 h-3 stroke-[3]" />
                </Link>
              )
            ) : (
              <button
                type="button"
                onClick={open}
                className={`hidden xs:flex items-center gap-1 font-black text-[11px] px-3 py-1 rounded-xl shadow-xs transition-all active:scale-95 ${btnClasses}`}
              >
                <span>{alert.ctaText}</span>
                <ArrowRight className="w-3 h-3 stroke-[3]" />
              </button>
            )
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 hover:bg-black/15 rounded-lg text-white/90 hover:text-white transition-colors"
            title="Dismiss alert"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </aside>
  )
}
