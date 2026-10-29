'use client'

import React from 'react'
import { ChevronRight, ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { getProductPacketImage, normalizeImageUrl } from '@/lib/productImages'

export default function FloatingViewCartPill() {
  const { items, count, total, open, isOpen } = useCart()

  // If cart is empty or cart drawer is already open, do not render floating pill
  if (!items || items.length === 0 || isOpen) return null

  const latestItem = items[items.length - 1]
  const latestImage = latestItem ? normalizeImageUrl(getProductPacketImage(latestItem.productSlug, latestItem.imageUrl)) : null

  return (
    <div className="fixed bottom-[76px] left-0 right-0 z-40 flex justify-center px-4 pointer-events-none animate-in slide-in-from-bottom-3 duration-300">
      <button
        type="button"
        onClick={() => open()}
        className="pointer-events-auto flex items-center justify-between gap-3 bg-[#0c831f] hover:bg-[#0a701a] active:scale-98 text-white px-3.5 py-2.5 rounded-full shadow-lg shadow-emerald-950/20 border border-emerald-400/30 transition-all cursor-pointer min-w-[220px] sm:min-w-[260px] max-w-sm"
        aria-label="View shopping cart"
      >
        {/* Left: Product Thumbnail or Shopping Bag */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            {latestImage ? (
              <img
                src={latestImage}
                alt={latestItem?.productName || 'Cart item'}
                className="w-full h-full object-contain"
              />
            ) : (
              <ShoppingBag className="w-4 h-4 text-[#0c831f]" />
            )}
          </div>
          <div className="text-left leading-tight truncate">
            <span className="block text-xs font-black tracking-wide text-white">View cart</span>
            <span className="block text-[11px] font-medium text-emerald-100">
              {count} {count === 1 ? 'item' : 'items'} • ₹{total}
            </span>
          </div>
        </div>

        {/* Right: Arrow */}
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <ChevronRight className="w-4 h-4 text-white stroke-[2.5]" />
        </div>
      </button>
    </div>
  )
}
