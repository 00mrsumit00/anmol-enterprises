'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { normalizeImageUrl } from '@/lib/productImages'

export interface GallerySlide {
  id: number
  type: 'image' | 'infographic' | 'cooking' | 'nutrition'
  url: string
  title: string
  label: string
  badge?: string
  alt?: string
}

interface ProductGalleryProps {
  productName: string
  productSlug: string
  slides: GallerySlide[]
  discountPercent?: number
  isVeg?: boolean
  brand?: string
  categoryName?: string
}

export default function ProductGallery({
  productName,
  productSlug,
  slides,
  discountPercent = 15,
  isVeg = true,
  brand = 'McCain',
  categoryName = 'Frozen Food',
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const handleNext = () => {
    if (slides.length <= 1) return
    setActiveIndex((prev) => (prev + 1) % slides.length)
  }

  const handlePrev = () => {
    if (slides.length <= 1) return
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const currentSlide = slides[activeIndex] || slides[0] || { url: '', title: productName }

  return (
    <div className="flex flex-col gap-2.5 select-none w-full">
      {/* ─── 1. MAIN PRODUCT IMAGE CONTAINER (Consistent aspect ratio & clean soft container) ─── */}
      <div className="bg-[#F8FAFC] rounded-3xl border border-slate-200/70 p-4 sm:p-8 relative flex items-center justify-center aspect-square max-h-[460px] sm:max-h-[500px] shadow-xs overflow-hidden group">
        
        {/* Top-Left: Veg / Non-Veg Indicator with solid white protective backing */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xs p-1.5 rounded-lg border border-slate-200/90 shadow-xs flex items-center justify-center z-20">
          <div className={`w-3.5 h-3.5 rounded-xs border p-0.5 flex items-center justify-center ${isVeg ? 'border-emerald-700' : 'border-rose-600'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-700' : 'bg-rose-600'}`} />
          </div>
        </div>

        {/* Top-Right: Soft Mint Green Discount Badge (Matching Screenshot 1) */}
        {discountPercent > 0 && (
          <div className="absolute top-4 right-4 bg-[#DCFCE7] text-[#15803D] text-xs font-bold px-3 py-1 rounded-full shadow-xs z-20 select-none">
            {discountPercent}% OFF
          </div>
        )}

        {/* Previous Arrow Button with Solid White Circular Backing (Visible on Hover if 2+ images) */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handlePrev()
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-slate-200/90 shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-900 z-30 transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Next Arrow Button with Solid White Circular Backing (Visible on Hover if 2+ images) */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-slate-200/90 shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-900 z-30 transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Main Slide Image: object-contain to keep pack shots natural, no distortion */}
        <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
          <img
            key={currentSlide.url}
            src={normalizeImageUrl(currentSlide.url)}
            alt={currentSlide.alt || `${productName} - ${currentSlide.title}`}
            className="w-full h-full max-h-[380px] sm:max-h-[440px] max-w-full object-contain drop-shadow-sm transition-transform duration-300"
          />
        </div>

        {/* Bottom Pagination Dots (ONLY visible when there are 2 or more images) */}
        {slides.length > 1 && (
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`transition-all rounded-full ${
                  activeIndex === idx
                    ? 'w-3.5 h-1.5 bg-slate-800'
                    : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

      </div>

      {/* ─── 2. SECONDARY THUMBNAIL STRIP (ONLY if 2+ images exist) ─── */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1 overflow-x-auto no-scrollbar">
          {slides.map((slide, idx) => {
            const isSelected = activeIndex === idx
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative w-14 h-14 rounded-xl border p-1 bg-white shrink-0 overflow-hidden transition-all flex items-center justify-center ${
                  isSelected
                    ? 'border-[#15803D] ring-2 ring-[#15803D]/20 shadow-xs'
                    : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={normalizeImageUrl(slide.url)}
                  alt={slide.title}
                  className="w-full h-full object-contain"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
