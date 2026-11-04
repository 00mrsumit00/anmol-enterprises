'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, X, ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useCart } from '@/hooks/useCart'

export default function StorefrontFestiveBanner() {
  const [isDismissed, setIsDismissed] = useState(false)
  const { open } = useCart()

  // Query active campaign from server
  const { data } = useQuery({
    queryKey: ['active-festive-campaign'],
    queryFn: async () => {
      const res = await fetch('/api/campaigns/active')
      if (!res.ok) return { campaign: null }
      return res.json()
    },
    staleTime: 60 * 1000,
  })

  const campaign = data?.campaign

  if (!campaign || !campaign.isActive || isDismissed) return null

  return (
    <aside aria-label="Festive Promotion" className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs font-bold py-2 px-4 shadow-sm z-[95] border-b border-amber-400/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base select-none">🪔</span>
          <span className="truncate">
            {campaign.bannerText}
          </span>
          <span className="hidden sm:inline-block bg-white/20 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shrink-0">
            {campaign.discountType === 'PERCENTAGE'
              ? `${campaign.discountValue}% OFF AT CHECKOUT`
              : `₹${campaign.discountValue} OFF AT CHECKOUT`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={open}
            className="hidden xs:flex items-center gap-1 bg-white text-orange-600 hover:bg-amber-50 font-black text-[11px] px-2.5 py-0.5 rounded-lg shadow-2xs transition"
          >
            <span>View Offers</span>
            <ArrowRight className="w-3 h-3 stroke-[3]" />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-white/10 rounded-md text-amber-100 hover:text-white transition"
            title="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
