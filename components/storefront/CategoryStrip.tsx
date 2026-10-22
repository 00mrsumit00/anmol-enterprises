'use client'

import React, { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

interface CategoryStripProps {
  activeFilter: string
  onFilterChange: (id: string) => void
}

export default function CategoryStrip({ activeFilter, onFilterChange }: CategoryStripProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -280 : 280
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  // Dynamically fetch all active categories from database
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) return []
      return res.json()
    }
  })

  // Standard fallback categories while loading
  const defaultCategories = [
    { id: 'cat-1', name: 'Frozen Potato Snacks & Classics', slug: 'frozen-potato-snacks', emoji: '🍟' },
    { id: 'cat-2', name: 'Cheese & Veggie Bites', slug: 'cheese-veggie-bites', emoji: '🧀' },
    { id: 'cat-3', name: 'Premium Cuts, Patties & Finger Foods', slug: 'premium-cuts-patties', emoji: '🥪' },
    { id: 'cat-4', name: 'Non-Veg & Chicken Snacks', slug: 'non-veg-chicken-snacks', emoji: '🍗' },
    { id: 'cat-5', name: 'Frozen Seafood & Fish', slug: 'frozen-seafood-fish', emoji: '🐟' },
  ]

  const displayCategories = categories.length > 0 ? categories : defaultCategories

  return (
    <section className="w-full font-sans no-print -mx-4 px-4 relative group/strip">
      {/* Desktop Left Scroll Button */}
      <button
        type="button"
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/95 hover:bg-white border border-gray-200 shadow-md text-gray-700 hover:text-black hover:scale-105 transition items-center justify-center opacity-0 group-hover/strip:opacity-100"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Desktop Right Scroll Button */}
      <button
        type="button"
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/95 hover:bg-white border border-gray-200 shadow-md text-gray-700 hover:text-black hover:scale-105 transition items-center justify-center opacity-0 group-hover/strip:opacity-100"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Horizontal scrollable pill row */}
      <div 
        ref={scrollContainerRef}
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY
          }
        }}
        className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-0 scroll-smooth"
      >
        
        {/* All Products Sticky Pill */}
        <div className="sticky left-0 z-20 shrink-0 bg-white/95 pr-1 flex items-center">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`
              relative flex items-center gap-2 px-4 py-2.5
              rounded-full border font-bold text-sm
              transition-all duration-200 active:scale-95 select-none whitespace-nowrap
              ${activeFilter === 'all' 
                ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow-md shadow-[#FF6B00]/20 scale-[1.04]' 
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:brightness-95'}
            `}
          >
            <span className="text-base leading-none">❄️</span>
            <span>All Products</span>
            <span className={`
              absolute -top-1.5 -right-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider
              ${activeFilter === 'all' ? 'bg-white text-[#FF6B00]' : 'bg-[#FFC700] text-black'}
            `}>
              Popular
            </span>
          </button>
        </div>

        {/* Dynamic Category Pills */}
        {displayCategories.map((cat: any) => {
          const isActive = activeFilter === cat.slug

          return (
            <button
              key={cat.id || cat.slug}
              type="button"
              onClick={() => onFilterChange(cat.slug)}
              className={`
                relative flex items-center gap-2 shrink-0 px-4 py-2.5
                rounded-full border font-bold text-sm
                transition-all duration-200 active:scale-95 select-none whitespace-nowrap
                ${isActive 
                  ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow-md shadow-[#FF6B00]/20 scale-[1.04]' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
              `}
            >
              <span className="text-base leading-none">{cat.emoji || '🍟'}</span>
              <span>{cat.name}</span>
            </button>
          )
        })}

      </div>
    </section>
  )
}
