'use client'

import React, { useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

export interface CategoryItem {
  id: string
  name: string
  slug: string
  emoji?: string
  badge?: string
  image?: string
  productCount?: number
}

interface BlinkitCategoryNavbarProps {
  activeCategory: string
  onSelectCategory: (slug: string) => void
}

// Curated high-definition food photography matching Screenshot 4
function getCategoryPhoto(slug: string, name: string): string {
  const s = slug.toLowerCase()
  const n = name.toLowerCase()

  if (s.includes('cain') || s.includes('potato') || s.includes('fries') || n.includes('cain') || n.includes('fries')) {
    // Crispy golden French Fries in bowl (Screenshot 4 - MC CAIN FOODS)
    return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=400&auto=format&fit=crop'
  }
  if (s.includes('chicken') || s.includes('venkey') || s.includes('non-veg') || n.includes('chicken')) {
    // Crave-inducing golden crispy fried chicken wings with dip (Screenshot 4 - Venkey's Chicken)
    return 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=400&auto=format&fit=crop'
  }
  if (s.includes('veg') || s.includes('pea') || n.includes('veg') || n.includes('pea')) {
    // Fresh green vegetables & peas (Screenshot 4 - Vegetables)
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400&auto=format&fit=crop'
  }
  if (s.includes('sea') || s.includes('fish') || s.includes('prawn') || n.includes('sea') || n.includes('fish')) {
    // Fresh whole fish on blue ice (Screenshot 4 - Sea food)
    return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=400&auto=format&fit=crop'
  }
  if (s.includes('ice') || s.includes('dessert') || n.includes('ice')) {
    return 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=240&q=80'
  }
  if (s.includes('mutton') || n.includes('mutton')) {
    return 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=240&q=80'
  }
  return 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=400&auto=format&fit=crop'
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
    staleTime: 60 * 1000,
  })

  // Fetch active products to compute real-time product counts per category
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 60 * 1000,
  })

  // Full category array with "Top Picks" as the default first category
  const categories: CategoryItem[] = React.useMemo(() => {
    const list: CategoryItem[] = [
      { id: 'top-picks', name: 'Top Picks', slug: 'all', emoji: '✨', badge: 'POPULAR' },
    ]

    const fallbackList = [
      { id: 'cat-1', name: 'MC CAIN FOODS', slug: 'mc-cain-foods', emoji: '🍟', badge: 'POPULAR', defaultCount: 11 },
      { id: 'cat-2', name: "Venkey's Chicken", slug: 'venkey-s-chicken', emoji: '🍗', defaultCount: 3 },
      { id: 'cat-3', name: 'Vegetables', slug: 'frozen-vegetables', emoji: '🥦', badge: 'FRESH', defaultCount: 31 },
      { id: 'cat-4', name: 'Sea food', slug: 'sea-food', emoji: '🐟', defaultCount: 15 },
    ]

    const rawList = dbCategories.length > 0 ? dbCategories : fallbackList

    rawList.forEach((c: any) => {
      if (c.slug !== 'all' && c.slug !== 'top-picks') {
        const cleanName = c.name
          .replace(/& Classics/gi, '')
          .replace(/& Finger Foods/gi, '')
          .replace(/Frozen /gi, '')
          .replace(/\s+/g, ' ')
          .trim()

        let badge: string | undefined = undefined
        if (c.slug.includes('potato') || c.slug.includes('cain') || c.slug.includes('snack')) badge = 'POPULAR'
        if (c.slug.includes('pea') || c.slug.includes('veg')) badge = 'FRESH'

        // Calculate dynamic product count for this category
        let count = 0
        if (products.length > 0) {
          count = products.filter(
            (p: any) => p.categoryId === c.id || p.category?.slug === c.slug
          ).length
        }
        if (count === 0 && c.defaultCount) {
          count = c.defaultCount
        }

        list.push({
          id: c.id || c.slug,
          name: cleanName,
          slug: c.slug,
          emoji: c.emoji || '❄️',
          badge,
          image: getCategoryPhoto(c.slug, cleanName),
          productCount: count,
        })
      }
    })

    return list
  }, [dbCategories, products])

  // Auto-center the active category tab smoothly within the scroll viewport on mobile
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

  const handleSelect = (slug: string) => {
    onSelectCategory(slug)
    const el = document.getElementById('all-products-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="w-full select-none no-print">

      {/* ─────────────────────────────────────────────────────────────
          1. DESKTOP VIEW (SCREENSHOT 4):
          Full-width white card container with thin vertical dividers,
          star icon for Top Picks, real photo thumbnails, bold titles,
          and dynamic product count subtitles.
      ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:block w-full">
        <div className="w-full bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="grid grid-flow-col auto-cols-fr divide-x divide-gray-100">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.slug

              if (cat.slug === 'all') {
                return (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => handleSelect('all')}
                    className={`flex items-center gap-3.5 p-3.5 sm:px-4.5 transition-all text-left cursor-pointer group select-none relative ${
                      isSelected
                        ? 'bg-amber-50/60 border-b-2 border-amber-500 shadow-2xs'
                        : 'hover:bg-slate-50/80 active:bg-slate-100'
                    }`}
                  >
                    {/* Top Picks Pale Cream Pill with Star */}
                    <div className="w-12 h-12 rounded-xl bg-amber-50/90 border border-amber-200/70 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-100/40 stroke-[2.2]" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span
                        className={`font-black text-sm tracking-tight truncate transition-colors leading-tight ${
                          isSelected ? 'text-amber-700' : 'text-gray-900 group-hover:text-amber-600'
                        }`}
                      >
                        Top Picks
                      </span>
                    </div>
                  </button>
                )
              }

              return (
                <button
                  key={cat.id || cat.slug}
                  type="button"
                  onClick={() => handleSelect(cat.slug)}
                  className={`flex items-center gap-3.5 p-3.5 sm:px-4.5 transition-all text-left cursor-pointer group select-none relative ${
                    isSelected
                      ? 'bg-emerald-50/60 border-b-2 border-[#0c831f] shadow-2xs'
                      : 'hover:bg-slate-50/80 active:bg-slate-100'
                  }`}
                >
                  {/* Square Food Thumbnail Photo with rounded corners */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/80 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                    <img
                      src={cat.image || getCategoryPhoto(cat.slug, cat.name)}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=400&auto=format&fit=crop'
                      }}
                    />
                  </div>

                  {/* Category Title + Product Count Subtitle */}
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`font-black text-xs sm:text-[13px] truncate transition-colors leading-tight ${
                        isSelected ? 'text-[#0c831f]' : 'text-gray-900 group-hover:text-[#0c831f]'
                      }`}
                    >
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-gray-400 font-semibold mt-0.5 truncate leading-tight">
                      {cat.productCount ?? 0} Products
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. PWA / MOBILE VIEW:
          Preserved completely as requested ("do not change for PWA view").
          Horizontal scroll track with active elevated cards.
      ───────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Category Navigation"
        className="block md:hidden w-full relative group/navbar font-sans py-1"
      >
        {/* Subtle edge fade masks on mobile to indicate scrollability */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-50 to-transparent z-10 opacity-70" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-slate-50 to-transparent z-10 opacity-70" />

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
                      ? 'h-[84px] sm:h-[90px] min-w-[92px] sm:min-w-[106px] px-2.5 pt-2 pb-2 bg-white border-2 border-[#EAB308] shadow-lg shadow-amber-500/20 -translate-y-1.5 z-20 scale-[1.04]'
                      : 'h-[68px] sm:h-[72px] min-w-[84px] sm:min-w-[96px] px-2 py-1.5 bg-[#FEFBF4] border border-[#F1E5CB] hover:bg-[#FDF4DF] hover:border-amber-300/80 hover:-translate-y-0.5 text-slate-700 shadow-2xs'
                  }
                `}
              >
                {/* Mini Status Pill */}
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

                {/* Downward Anchor Pip */}
                {isSelected && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-1.5 bg-[#EAB308] rounded-full shadow-xs animate-in fade-in zoom-in-75 duration-200" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

    </div>
  )
}
