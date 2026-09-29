'use client'

import React from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

export default function HeroBanner() {
  const { toggleB2B, isB2BMode } = useCart()

  return (
    <div className="flex flex-col gap-2.5 font-sans no-print">
      
      {/* 1. Sleek Main Hero Banner */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-[#0e5c1a] via-[#0c831f] to-[#094d15] text-white py-4 sm:py-5 px-5 sm:px-8 shadow-md flex items-center min-h-[160px] sm:min-h-[185px]">
        
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
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e5c1a]/50 via-transparent to-transparent" />
        </div>

        {/* Left Copy */}
        <div className="relative z-10 max-w-[70%] sm:max-w-md md:max-w-lg">
          <span className="inline-flex items-center gap-1 bg-white/20 text-[#f7c32e] text-[9px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5 backdrop-blur-sm">
            <Sparkles className="w-3 h-3" /> Authorised McCain Distributor
          </span>
          <h1 className="font-extrabold text-lg sm:text-2xl md:text-3xl leading-tight tracking-tight drop-shadow-sm">
            Stock up on McCain frozen favourites
          </h1>
          <p className="text-white/90 text-[11px] sm:text-xs font-medium mt-1 max-w-md leading-snug drop-shadow-xs line-clamp-2 sm:line-clamp-none">
            Get crispy French Fries, Potato Smiles & party snacks delivered cold in 10 minutes.
          </p>

          <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
            <a
              href="#mccain-specials"
              className="bg-white hover:bg-gray-100 text-[#0c831f] font-black text-xs px-4 py-1.5 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Shop Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <span className="text-[11px] text-emerald-100 font-bold flex items-center gap-1">
              ❄️ -18°C Cold Chain
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

      {/* 3. 🎉 Free Delivery Banner — Compact Strip */}
      <Link
        href="/account"
        className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-[#0c831f] text-white rounded-xl px-4 py-2 shadow-xs active:scale-[0.99] transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">🎉</span>
          <div>
            <span className="font-black text-xs leading-tight">First Order Free Delivery: </span>
            <span className="text-[11px] text-emerald-100 font-medium">New customers get ₹0 delivery fee</span>
          </div>
        </div>
        <span className="text-[11px] font-bold text-emerald-200 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          Sign up <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </Link>

    </div>
  )
}
