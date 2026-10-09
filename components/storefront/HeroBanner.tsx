'use client'

import React from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

export default function HeroBanner() {
  const { toggleB2B, isB2BMode } = useCart()

  return (
    <div className="flex flex-col gap-2.5 font-sans no-print">
      
      {/* 1. Sleek Cyber-Luxury Main Hero Banner */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-[#07360e] via-[#0c831f] to-[#084814] text-white py-5 sm:py-6 px-5 sm:px-8 shadow-xl flex items-center min-h-[175px] sm:min-h-[200px] border border-emerald-400/20">
        
        {/* Ambient Glowing Halo Orbs (vstechworks style) */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-400/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-40 h-40 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Seamless Integrated Image on the Right */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-5/12 lg:w-1/2 pointer-events-none overflow-hidden">
          <img
            src="/images/products/mccain-french-fries-bg.jpg"
            alt="Crispy McCain French Fries"
            className="w-full h-full object-cover object-center scale-105"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 15%, black 65%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 15%, black 65%)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c831f] via-[#0c831f]/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07360e]/50 via-transparent to-transparent" />
        </div>

        {/* Left Copy */}
        <div className="relative z-10 max-w-[75%] sm:max-w-md md:max-w-lg">
          {/* Glass Status Node Badge with Pulsing Live Radar Dot */}
          <div className="inline-flex items-center gap-2 bg-slate-950/40 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full text-[9px] sm:text-[11px] font-bold text-white mb-2 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-emerald-200">Authorised McCain Regional Distributor &bull; Latur</span>
          </div>

          <h1 className="font-extrabold text-xl sm:text-2xl md:text-3xl leading-tight tracking-tight drop-shadow-sm">
            Stock up on McCain frozen <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-emerald-200">favourites</span>
          </h1>
          <p className="text-white/90 text-[11px] sm:text-xs font-medium mt-1 max-w-md leading-snug drop-shadow-xs line-clamp-2 sm:line-clamp-none">
            Crispy French Fries, Potato Smiles & party snacks delivered sub-zero cold in 10 minutes.
          </p>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <a
              href="#mccain-specials"
              className="group relative bg-white hover:bg-slate-50 text-[#0c831f] font-black text-xs sm:text-sm px-5 py-2 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.35)] transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Shop Now</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </a>
            <span className="text-[11px] sm:text-xs text-emerald-100 font-extrabold flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
              ❄️ -18&deg;C Cold Chain
            </span>
          </div>
        </div>

      </div>

      {/* 2. 🔥 Deal Promo Grid — desktop only (sleek compact cards) */}
      <div className="hidden lg:grid grid-cols-2 gap-2.5 h-[130px]">

        {/* LEFT TILE — Fries & Wedges */}
        <div className="relative rounded-2xl overflow-hidden group cursor-pointer active:scale-[0.98] transition-all shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=600&auto=format&fit=crop"
            alt="French Fries"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FF6B00]/95 via-[#FF6B00]/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-3.5">
            <span className="text-[9px] font-black text-white/80 uppercase tracking-widest leading-tight">🔥 Bestseller</span>
            <div className="flex items-end justify-between gap-2 mt-0.5">
              <div>
                <h3 className="font-black text-white text-sm sm:text-base leading-tight">French Fries & Wedges</h3>
                <span className="text-[10px] text-orange-100 font-bold">Crispy · Frozen · Ready in mins</span>
              </div>
              <a
                href="#mccain-specials"
                className="inline-flex items-center gap-1 bg-white text-[#FF6B00] font-black text-[11px] px-3 py-1 rounded-lg hover:bg-orange-50 transition-colors shadow-sm shrink-0"
              >
                Shop <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT TILE — B2B Wholesale */}
        <div className="relative rounded-2xl overflow-hidden group cursor-pointer active:scale-[0.98] transition-all shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=600&auto=format&fit=crop"
            alt="Cheese Bites"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E]/92 via-[#1E1E1E]/35 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-3.5">
            <span className="text-[9px] font-black text-[#FFC700] uppercase tracking-widest leading-tight">💼 B2B / Bulk</span>
            <div className="flex items-end justify-between gap-2 mt-0.5">
              <div>
                <h3 className="font-black text-white text-sm sm:text-base leading-tight">Box & Carton Wholesale</h3>
                <span className="text-[10px] text-gray-300 font-bold">Wholesale rates for Cafes & Hotels</span>
              </div>
              <button
                onClick={toggleB2B}
                className="inline-flex items-center gap-1 bg-[#FFC700] hover:bg-[#ffcf33] text-black font-black text-[11px] px-3 py-1 rounded-lg active:scale-95 transition-all shadow-sm shrink-0"
              >
                {isB2BMode ? '✓ B2B ON' : 'Explore B2B'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
