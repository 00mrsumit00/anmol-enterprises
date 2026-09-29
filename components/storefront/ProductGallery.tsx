'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, Pause, Play, Sparkles } from 'lucide-react'
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
}

export default function ProductGallery({
  productName,
  productSlug,
  slides,
  discountPercent = 15,
  isVeg = true
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const thumbnailContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll interval (every 3.5 seconds)
  const handleNext = useCallback(() => {
    if (slides.length <= 1) return
    setActiveIndex((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const handlePrev = useCallback(() => {
    if (slides.length <= 1) return
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (isPaused || slides.length <= 1) return

    const timer = setInterval(() => {
      handleNext()
    }, 3500)

    return () => clearInterval(timer)
  }, [isPaused, slides.length, handleNext])

  // Scroll thumbnail into view when active index changes
  useEffect(() => {
    if (thumbnailContainerRef.current) {
      const activeThumb = thumbnailContainerRef.current.children[activeIndex] as HTMLElement
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [activeIndex])

  const currentSlide = slides[activeIndex] || slides[0]

  return (
    <div 
      className="flex flex-col gap-3.5 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Large Main Image Display Box (Matching Blinkit Screenshot) */}
      <div className="bg-white rounded-3xl border border-gray-200/90 p-3 sm:p-6 relative flex items-center justify-center aspect-square max-h-[460px] sm:max-h-[500px] shadow-sm overflow-hidden group">
        
        {/* Top-Left: Veg Square Badge */}
        {isVeg && (
          <div className="absolute top-4 left-4 bg-white p-1 rounded-md border border-gray-200 shadow-xs flex items-center justify-center z-20">
            <div className="w-3.5 h-3.5 rounded-xs border border-emerald-700 p-0.5 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
            </div>
          </div>
        )}

        {/* Top-Right: Blue Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-4 right-4 bg-[#256fef] text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-xs z-20 uppercase tracking-wider">
            {discountPercent}% OFF
          </div>
        )}

        {/* Auto-Scroll Indicator Pill */}
        <div className="absolute top-4 left-14 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-20 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          {isPaused ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-white" />}
          <span>{activeIndex + 1} / {slides.length}</span>
        </div>

        {/* Previous Arrow Button (Hover on Desktop) */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handlePrev()
            }}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:text-black z-30 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Next Arrow Button (Hover on Desktop) */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:text-black z-30 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Bottom-Left: Express 8 MINS Delivery Overlay */}
        <div className="absolute bottom-4 left-4 bg-black/80 text-white text-[10px] font-black px-2.5 py-1 rounded-lg backdrop-blur-xs z-20 flex items-center gap-1 shadow-sm">
          <span>⏱ 8 MINS DELIVERY</span>
        </div>

        {/* Main Slide Image: Auto-fits all dimensions without stretching or cropping */}
        <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
          <img
            key={currentSlide.url}
            src={normalizeImageUrl(currentSlide.url)}
            alt={currentSlide.alt || `${productName} - ${currentSlide.title}`}
            className="w-full h-full max-h-[380px] sm:max-h-[440px] max-w-full object-contain drop-shadow-md animate-fade-in group-hover:scale-105 transition-transform duration-300"
          />
        </div>

      </div>

      {/* 2. Thumbnail Strip with Right/Left Arrow Controls (Matching Screenshot media_1787492890360.png) */}
      <div className="relative flex items-center gap-2">
        
        {/* Thumbnails Container */}
        <div 
          ref={thumbnailContainerRef}
          className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 scroll-smooth flex-1"
        >
          {slides.map((slide, idx) => {
            const isSelected = activeIndex === idx
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 p-1.5 bg-[#fbfbfb] shrink-0 overflow-hidden transition-all flex items-center justify-center ${
                  isSelected
                    ? 'border-[#0c831f] shadow-md shadow-[#0c831f]/20 scale-105 ring-2 ring-[#0c831f]/20 bg-white'
                    : 'border-gray-200 hover:border-gray-300 opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={normalizeImageUrl(slide.url)}
                  alt={slide.title}
                  className="w-full h-full object-contain drop-shadow-2xs"
                />

                {/* Mini Active Dot Indicator */}
                {isSelected && (
                  <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#0c831f]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Right Arrow Scroll Button (as visible in Blinkit Screenshot) */}
        {slides.length > 4 && (
          <button
            type="button"
            onClick={handleNext}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-black shrink-0 active:scale-95 transition-all"
            title="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

      </div>

    </div>
  )
}
