'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { ChevronRight, ShoppingBag } from 'lucide-react'

export default function FloatingCartBar() {
  const pathname = usePathname()
  const { items, count, total, isOpen, open } = useCart()

  // Only show on catalog browsing pages when cart has items and sidebar is closed;
  // Hide during checkout and on profile/account pages
  if (count === 0 || isOpen || pathname.startsWith('/checkout') || pathname.startsWith('/account')) return null

  // Get up to 3 item images to display overlapping thumbnails
  const displayItems = items.slice(0, 3)

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[85] max-w-sm w-[92%] sm:w-auto sm:min-w-[340px] no-print animate-slide-up">
      <button 
        type="button"
        onClick={open}
        className="w-full bg-[#0c831f] hover:bg-[#0a751b] text-white py-2.5 px-4 rounded-full shadow-2xl border border-emerald-400/30 cursor-pointer transition-all duration-200 tap-scale flex items-center justify-between shadow-emerald-950/40 group select-none"
      >
        {/* Left Side: Overlapping Circular Thumbnails */}
        <div className="flex items-center -space-x-2.5 shrink-0">
          {displayItems.map((item, idx) => (
            <div 
              key={item.variantId || idx}
              className="w-9 h-9 rounded-full bg-white p-0.5 shadow-md border-2 border-emerald-600 overflow-hidden relative"
              style={{ zIndex: 10 - idx }}
            >
              <img
                src={item.imageUrl}
                alt={item.productName}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
          {items.length === 0 && (
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Center: "View cart" + "{count} items • ₹{total}" */}
        <div className="flex flex-col text-left px-3">
          <span className="font-display text-sm font-black text-white leading-tight">
            View cart
          </span>
          <span className="text-[11px] font-bold text-emerald-100/90 leading-tight">
            {count} {count === 1 ? 'item' : 'items'} • ₹{total}
          </span>
        </div>

        {/* Right Side: Circular Chevron Button */}
        <div className="w-8 h-8 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center shrink-0 transition-colors">
          <ChevronRight className="w-4 h-4 text-white stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
        </div>

      </button>
    </div>
  )
}
