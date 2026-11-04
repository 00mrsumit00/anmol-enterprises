'use client'

import React, { useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Flame } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

export interface CategoryItem {
  id: string
  name: string
  slug: string
  emoji?: string
  badge?: string
}

interface BlinkitCategoryNavbarProps {
  activeCategory: string
  onSelectCategory: (slug: string) => void
}

export default function BlinkitCategoryNavbar({
  activeCategory,
  onSelectCategory,
}: BlinkitCategoryNavbarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Fetch categories dynamically from database
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) return []
      return res.json()
    },
  })

  // Full category array with "Top Picks" as the default first category (Blinkit Screenshot UX)
  const categories: CategoryItem[] = React.useMemo(() => {
    const list: CategoryItem[] = [
      { id: 'top-picks', name: 'Top Picks', slug: 'all', emoji: '✨', badge: 'POPULAR' },
    ]

    const fallbackList = [
      { id: 'cat-1', name: 'Potato Snacks', slug: 'frozen-potato-snacks', emoji: '🍟', badge: 'BESTSELLER' },
      { id: 'cat-2', name: 'Cheese Bites', slug: 'cheese-veggie-bites', emoji: '🧀' },
      { id: 'cat-3', name: 'Patties & Rolls', slug: 'premium-cuts-patties', emoji: '🥪' },
      { id: 'cat-4', name: 'Non-Veg Snacks', slug: 'non-veg-chicken-snacks', emoji: '🍗' },
      { id: 'cat-5', name: 'Seafood & Fish', slug: 'frozen-seafood-fish', emoji: '🐟' },
      { id: 'cat-6', name: 'Green Peas & Veg', slug: 'frozen-vegetables', emoji: '🥦', badge: 'FRESH' },
    ]

    const rawList = dbCategories.length > 0 ? dbCategories : fallbackList

    rawList.forEach((c: any) => {
      if (c.slug !== 'all' && c.slug !== 'top-picks') {
        const cleanName = c.name
          .replace(/& Classics/gi, '')
          .replace(/& Finger Foods/gi, '')
          .replace(/Frozen /gi, '')
          .trim()

        let badge: string | undefined = undefined
        if (c.slug.includes('potato') || c.slug.includes('snack')) badge = 'POPULAR'
        if (c.slug.includes('pea') || c.slug.includes('veg')) badge = 'FRESH'

        list.push({
          id: c.id || c.slug,
          name: cleanName,
          slug: c.slug,
          emoji: c.emoji || '❄️',
          badge,
        })
      }
    })

    return list
  }, [dbCategories])

  // Auto-center the active category tab smoothly within the scroll viewport
  useEffect(() => {
    const activeBtn = tabRefs.current[activeCategory]
    const container = scrollContainerRef.current
    if (activeBtn && container) {
      const containerRect = container.getBoundingClientRect()
      const btnRect = activeBtn.getBoundingClientRect()
      const scrollLeft =
        container.scrollLeft + (btnRect.left - containerRect.left) - containerRect.width / 2 + btnRect.width / 2

      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth',
      })
    }
  }, [activeCategory])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -260 : 260
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  return (
    <nav 
      aria-label="Category Navigation"
      className="w-full relative group/navbar font-sans select-none no-print py-1"
    >
      {/* Desktop Left Glassmorphic Scroll Arrow */}
      <button
        type="button"
        onClick={() => scroll('left')}
        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/95 hover:bg-white border border-slate-200/90 shadow-md text-slate-700 hover:text-slate-900 transition-all duration-200 items-center justify-center cursor-pointer opacity-0 group-hover/navbar:opacity-100 hover:scale-105 active:scale-95"
        aria-label="Scroll categories left"
      >
        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Desktop Right Glassmorphic Scroll Arrow */}
      <button
        type="button"
        onClick={() => scroll('right')}
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/95 hover:bg-white border border-slate-200/90 shadow-md text-slate-700 hover:text-slate-900 transition-all duration-200 items-center justify-center cursor-pointer opacity-0 group-hover/navbar:opacity-100 hover:scale-105 active:scale-95"
        aria-label="Scroll categories right"
      >
        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Subtle edge fade masks on mobile to indicate scrollability */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-50 to-transparent z-10 opacity-70" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-slate-50 to-transparent z-10 opacity-70" />

      {/* ─── BLINKIT SELECTION-AWARE HORIZONTAL TRACK ─── */}
      <div
        ref={scrollContainerRef}
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY
          }
        }}
        className="flex items-end gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar pt-3.5 pb-2.5 px-2 scroll-smooth"
      >
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.slug

          return (
            <button
              key={cat.id || cat.slug}
              ref={(el) => {
                tabRefs.current[cat.slug] = el
              }}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              className={`
                relative shrink-0 flex flex-col items-center justify-between text-center
                cursor-pointer rounded-2xl select-none transition-all duration-300 ease-out
                ${
                  isSelected
                    ? // Active Elevated State: Rises noticeably higher, pure white bg, bold golden/amber outline (#EAB308), rich warm shadow
                      'h-[84px] sm:h-[90px] min-w-[92px] sm:min-w-[106px] px-2.5 pt-2 pb-2 bg-white border-2 border-[#EAB308] shadow-lg shadow-amber-500/20 -translate-y-1.5 z-20 scale-[1.04]'
                    : // Inactive State: Pale warm cream surface (#FEFBF4), warm delicate border, smooth hover lift
                      'h-[68px] sm:h-[72px] min-w-[84px] sm:min-w-[96px] px-2 py-1.5 bg-[#FEFBF4] border border-[#F1E5CB] hover:bg-[#FDF4DF] hover:border-amber-300/80 hover:-translate-y-0.5 text-slate-700 shadow-2xs'
                }
              `}
            >
              {/* Optional Mini Status Pill (e.g., POPULAR / FRESH) */}
              {cat.badge && (
                <span
                  className={`
                    absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider shadow-2xs whitespace-nowrap transition-all
                    ${
                      isSelected
                        ? 'bg-[#EAB308] text-slate-950 ring-2 ring-white scale-100'
                        : 'bg-amber-100 text-amber-800 border border-amber-200/80 scale-90'
                    }
                  `}
                >
                  {cat.badge}
                </span>
              )}

              {/* Category Icon Capsule */}
              <div
                className={`
                  w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-300
                  ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-50 to-amber-100/80 border border-amber-200/80 text-amber-600 shadow-inner scale-105'
                      : 'bg-white/90 border border-slate-200/60 text-slate-700'
                  }
                `}
              >
                {cat.slug === 'all' ? (
                  <Sparkles
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                      isSelected ? 'text-[#EAB308] fill-[#EAB308] scale-110' : 'text-amber-500'
                    }`}
                  />
                ) : (
                  <span className="text-base sm:text-lg leading-none transform transition-transform group-hover:scale-110">
                    {cat.emoji || '❄️'}
                  </span>
                )}
              </div>

              {/* Category Title */}
              <span
                className={`
                  block w-full text-center leading-tight truncate px-0.5 transition-colors
                  ${
                    isSelected
                      ? 'text-[11px] sm:text-xs font-black text-slate-900 tracking-tight'
                      : 'text-[10px] sm:text-[11px] font-bold text-slate-600'
                  }
                `}
              >
                {cat.name}
              </span>

              {/* Downward Anchor Pip (Connects visually to the product section below) */}
              {isSelected && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-1.5 bg-[#EAB308] rounded-full shadow-xs animate-in fade-in zoom-in-75 duration-200" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
