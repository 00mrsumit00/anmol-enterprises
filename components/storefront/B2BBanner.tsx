'use client'

import React from 'react'
import { Building2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/ui/Toast'

export default function B2BBanner() {
  const { isB2BMode, toggleB2B } = useCart()
  const { showToast } = useToast()

  const handleToggle = () => {
    toggleB2B()
    showToast(
      isB2BMode
        ? '🛒 B2C retail pricing activated!'
        : '💼 B2B wholesale pricing activated! Box/Carton savings applied.',
      'success'
    )
  }

  return (
    <div className="relative w-full rounded-card overflow-hidden bg-gradient-to-r from-brand-charcoal via-brand-charcoal-soft to-slate-900 border border-white/5 p-5 md:p-6 shadow-xl no-print">
      
      {/* Absolute Decorative Icon */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
        <Building2 className="w-40 h-40 text-white" />
      </div>

      <div className="max-w-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        
        {/* Left Side */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-brand-yellow text-brand-charcoal font-black tracking-widest uppercase px-2 py-0.5 rounded-card">
              Wholesale Pricing
            </span>
            {isB2BMode && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-extrabold tracking-wide uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            )}
          </div>
          <h3 className="font-display text-base sm:text-lg font-bold text-white tracking-tight">
            Buying Bulk for a Hotel, Cafe, or Retail Store?
          </h3>
          <p className="font-body text-xs text-gray-400 max-w-lg leading-relaxed">
            Order in Box or Carton packs and save up to 20% on all McCain frozen products. Toggle B2B mode to see live wholesale pricing!
          </p>
        </div>

        {/* Right Side CTA Button */}
        <button
          onClick={handleToggle}
          className={`self-start md:self-auto px-5 py-2.5 rounded-pill font-body text-xs font-bold tracking-wide transition-all flex items-center gap-2 tap-scale shadow-lg ${
            isB2BMode
              ? 'bg-white text-brand-charcoal hover:bg-gray-100'
              : 'bg-brand-yellow hover:bg-yellow-400 text-brand-charcoal shadow-brand-yellow/10'
          }`}
        >
          <span>{isB2BMode ? 'Switch to Retail' : 'Activate B2B Pricing'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  )
}
