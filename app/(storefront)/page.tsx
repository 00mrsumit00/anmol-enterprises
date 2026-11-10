'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import HeroBanner from '@/components/storefront/HeroBanner'
import BlinkitCategoryNavbar from '@/components/storefront/BlinkitCategoryNavbar'
import ProductGrid from '@/components/storefront/ProductGrid'
import ProductCard from '@/components/storefront/ProductCard'
import TrustStrip from '@/components/storefront/TrustStrip'
import B2BBanner from '@/components/storefront/B2BBanner'
import { ChevronRight, ChevronLeft, Award, Flame, Zap, Snowflake } from 'lucide-react'

export default function Homepage() {
  const [activeFilter, setActiveFilter] = useState('all')

  // Carousel ref and scroll indicator states
  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = useCallback(() => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
      setCanScrollLeft(scrollLeft > 15)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 15)
    }
  }, [])

  const handleScroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = Math.max(280, Math.min(carouselRef.current.clientWidth * 0.75, 480))
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  // Fetch products and categories from backend
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Network response was not ok')
      return res.json()
    }
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Network response was not ok')
      return res.json()
    }
  })

  // Filter products based on active filter
  const getFilteredProducts = () => {
    if (productsLoading) return []
    
    switch (activeFilter) {
      case 'all':
        return products
      case 'featured':
        return products.filter((p: any) => p.isFeatured)
      case 'deals':
        return products.filter((p: any) => p.sortOrder % 2 === 0)
      case 'new':
        return products.slice(0, 4)
      default:
        return products.filter((p: any) => p.category?.slug === activeFilter || p.categoryId === activeFilter)
    }
  }

  const filteredProducts = getFilteredProducts()
  const featuredProducts = products.filter((p: any) => p.isFeatured)

  // Selected category / filter products
  const selectedCategory = categories.find((c: any) => c.slug === activeFilter || c.id === activeFilter)

  // When a user selects a specific category or filter, display their selection first,
  // and gather all other category products to display below it.
  const otherCategories = React.useMemo(() => {
    if (activeFilter === 'all' || products.length === 0) return []
    
    // Filter out products that were already shown in filteredProducts
    const shownIds = new Set(filteredProducts.map((p: any) => p.id))
    const remainingProducts = products.filter((p: any) => !shownIds.has(p.id))
    if (remainingProducts.length === 0) return []

    // Group remaining products by category
    const categoryGroups: { category: any; items: any[] }[] = []

    // Map by known categories list first to maintain proper sorting
    categories.forEach((cat: any) => {
      // Don't show the category if it was the selected one
      if (cat.slug === activeFilter) return

      const items = remainingProducts.filter(
        (p: any) => p.category?.slug === cat.slug || p.categoryId === cat.id
      )
      if (items.length > 0) {
        categoryGroups.push({ category: cat, items })
      }
    })

    // Catch any remaining items that didn't match the known categories
    const alreadyGroupedIds = new Set(categoryGroups.flatMap(g => g.items.map(i => i.id)))
    const uncategorizedItems = remainingProducts.filter((p: any) => !alreadyGroupedIds.has(p.id))
    if (uncategorizedItems.length > 0) {
      categoryGroups.push({
        category: {
          id: 'other-specials',
          name: 'More Frozen Products',
          slug: 'more-frozen',
          emoji: '❄️'
        },
        items: uncategorizedItems
      })
    }

    return categoryGroups
  }, [activeFilter, products, filteredProducts, categories])

  // Attach passive scroll listener for dynamic arrow visibility
  useEffect(() => {
    checkScroll()
    const el = carouselRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [filteredProducts, checkScroll])

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4 md:gap-5 font-sans">
      
      {/* A. Hero Banner */}
      <HeroBanner />

      {/* B. Category Navbar (Desktop: Divided Strip with Photos | Mobile: PWA Scroll Track) */}
      <BlinkitCategoryNavbar activeCategory={activeFilter} onSelectCategory={setActiveFilter} />

      {/* C. Connected Category Product Carousel (Directly Connected to Navbar) */}
      <section className="relative group/carousel bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-emerald-500/10 p-3.5 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl border border-amber-200/60 no-print transition-all duration-300">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#EAB308] text-slate-900 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {activeFilter === 'all' ? '✨' : (selectedCategory?.emoji || '❄️')}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base md:text-lg text-gray-900 leading-tight truncate">
                {activeFilter === 'all' ? 'Top Picks & Bestsellers' : (selectedCategory?.name || 'Category Collection')}
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {filteredProducts.length} items available in 9 mins
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Header Arrow Controls for Quick Navigation */}
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xs p-0.5 rounded-full border border-amber-200/80 shadow-2xs">
              <button 
                type="button"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  canScrollLeft
                    ? 'text-slate-800 hover:bg-white hover:text-emerald-700 active:scale-95 shadow-xs cursor-pointer'
                    : 'text-slate-300 cursor-not-allowed opacity-30'
                }`}
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button 
                type="button"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  canScrollRight
                    ? 'text-slate-800 hover:bg-white hover:text-emerald-700 active:scale-95 shadow-xs cursor-pointer'
                    : 'text-slate-300 cursor-not-allowed opacity-30'
                }`}
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <button 
              type="button"
              onClick={() => {
                const el = document.getElementById('all-products-section')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }} 
              className="text-xs font-bold text-[#0c831f] hover:text-[#096918] flex items-center gap-0.5 cursor-pointer ml-0.5"
            >
              <span>See Grid</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Container with Floating Edge Arrows */}
        <div className="relative">
          {/* Floating Left Side Arrow Button (Desktop & Mobile) */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Previous products"
              className="absolute -left-2 sm:-left-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-lg border border-slate-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-xs animate-in fade-in zoom-in-75 duration-200"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          )}

          {/* Floating Right Side Arrow Button (Desktop & Mobile) */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Next products"
              className="absolute -right-2 sm:-right-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-lg border border-slate-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-xs animate-in fade-in zoom-in-75 duration-200"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          )}

          {/* Horizontal scroll grid with mouse wheel scroll */}
          <div 
            ref={carouselRef}
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY
              }
            }}
            className="w-full overflow-x-auto no-scrollbar flex items-stretch gap-3.5 sm:gap-4 pb-2 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth"
          >
            {filteredProducts.map((product: any) => (
              <div key={product.id} className="min-w-[190px] sm:min-w-[210px] max-w-[210px] shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
            {filteredProducts.length === 0 && !productsLoading && (
              <div className="py-8 text-center w-full text-slate-400 text-sm">
                No products found in this category.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* D. Trust Strip */}
      <TrustStrip />

      {/* E. Main Products Grid Section (User's Selected Category First) */}
      <section id="all-products-section" className="no-print scroll-mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {activeFilter === 'deals' ? (
              <Flame className="w-5 h-5 text-amber-600 animate-bounce" />
            ) : activeFilter === 'new' ? (
              <Zap className="w-5 h-5 text-yellow-500" />
            ) : selectedCategory?.emoji ? (
              <span className="text-xl leading-none">{selectedCategory.emoji}</span>
            ) : (
              <Snowflake className="w-5 h-5 text-[#0c831f]" />
            )}
            <h3 className="font-extrabold text-lg sm:text-xl text-gray-900">
              {activeFilter === 'all' && 'McCain Frozen Collection'}
              {activeFilter === 'featured' && 'Featured Products'}
              {activeFilter === 'deals' && 'Hot Deals & Discounts'}
              {activeFilter === 'new' && 'New Arrivals'}
              {selectedCategory && selectedCategory.name}
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            {filteredProducts.length} items
          </span>
        </div>

        <ProductGrid products={filteredProducts} isLoading={productsLoading} />
      </section>

      {/* F. Other Category Products Below (when a specific category is selected) */}
      {activeFilter !== 'all' && otherCategories.length > 0 && (
        <section className="no-print space-y-8 pt-6 border-t-2 border-dashed border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-lg sm:text-xl text-gray-900 flex items-center gap-2">
                <span>❄️</span>
                <span>More Products from Other Categories</span>
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Showing other frozen snacks available in our store
              </p>
            </div>
            <button
              onClick={() => setActiveFilter('all')}
              className="text-xs font-bold text-[#0c831f] hover:underline"
            >
              View All Products
            </button>
          </div>

          {otherCategories.map(({ category, items }) => (
            <div key={category.id || category.slug} className="space-y-3">
              <div className="flex items-center justify-between bg-gray-50/90 px-3.5 py-2.5 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{category.emoji || '🍟'}</span>
                  <h5 className="font-bold text-sm sm:text-base text-gray-900">
                    {category.name}
                  </h5>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <ProductGrid products={items} isLoading={false} />
            </div>
          ))}
        </section>
      )}

      {/* G. B2B Wholesale Banner */}
      <B2BBanner />

      {/* G. Footer */}
      <footer className="mt-8 pt-8 border-t border-gray-200 text-gray-500 text-xs leading-relaxed no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h5 className="font-extrabold text-gray-900 text-sm mb-2">
              Anmol Enterprises
            </h5>
            <p className="max-w-xs">
              Authorized Regional Distributor of McCain Foods India. Temperature-controlled express cold-chain delivery for hotels, cafes, QSRs, and households.
            </p>
            <p className="mt-3 font-bold text-gray-900">
              📍 Anmol Enterprises, Latur, Maharashtra - 413512
            </p>
          </div>
          <div>
            <h5 className="font-extrabold text-gray-900 text-sm mb-2">
              Delivery Coverage Hubs
            </h5>
            <p>Latur City (Express Delivery), Osmanabad, Nanded, Bidar</p>
            <p className="mt-2 font-bold text-gray-900">
              🕐 Operating Hours: 9:00 AM – 8:00 PM
            </p>
          </div>
          <div>
            <h5 className="font-extrabold text-gray-900 text-sm mb-2">
              Customer & Wholesale Support
            </h5>
            <p>Phone: +91 94220 70000</p>
            <p>Email: contact@anmolenterprises.in</p>
            <p className="mt-2 text-[10px] text-[#0c831f] font-extrabold uppercase">
              ❄️ 100% SUB-ZERO -18°C COLD-CHAIN GUARANTEED
            </p>
          </div>
        </div>
        <div className="mt-8 text-center text-gray-400 text-[10px] pb-4">
          © {new Date().getFullYear()} Anmol Enterprises. Authorized McCain Regional Distributor. All rights reserved.
        </div>
      </footer>

    </div>
  )
}
