'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, SlidersHorizontal, ArrowUpDown, ChevronDown, CheckCircle } from 'lucide-react'
import ProductGrid from '@/components/storefront/ProductGrid'

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  // State filters
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterVegOnly, setFilterVegOnly] = useState(false)
  const [filterInStockOnly, setFilterInStockOnly] = useState(false)
  const [filterBrand, setFilterBrand] = useState('ALL')
  const [sortBy, setSortBy] = useState<'SORT_ORDER' | 'PRICE_ASC' | 'PRICE_DESC'>('SORT_ORDER')

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json()
    }
  })

  // Fetch category details
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    }
  })

  const currentCategory = categories.find((c: any) => c.slug === slug)
  const categoryName = currentCategory ? `${currentCategory.emoji} ${currentCategory.name}` : 'Category'

  // Filter products locally for speed
  const getFilteredProducts = () => {
    let list = products.filter((p: any) => p.category?.slug === slug)

    if (filterVegOnly) {
      list = list.filter((p: any) => p.isVeg)
    }

    if (filterBrand !== 'ALL') {
      list = list.filter((p: any) => p.brand.toUpperCase() === filterBrand.toUpperCase())
    }

    // Since products can contain multiple variants, we check if any active variant has stock
    if (filterInStockOnly) {
      list = list.filter((p: any) => p.variants?.some((v: any) => v.stockCount > 0))
    }

    // Sort by pricing (checks first variant, i.e. SINGLE)
    if (sortBy === 'PRICE_ASC') {
      list.sort((a: any, b: any) => (a.variants[0]?.retailPrice || 0) - (b.variants[0]?.retailPrice || 0))
    } else if (sortBy === 'PRICE_DESC') {
      list.sort((a: any, b: any) => (b.variants[0]?.retailPrice || 0) - (a.variants[0]?.retailPrice || 0))
    } else {
      list.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    }

    return list
  }

  const filtered = getFilteredProducts()

  const handleBack = () => {
    router.push('/')
  }

  return (
    <div className="flex flex-col gap-4 relative">
      
      {/* 1. Header (Dark theme style) */}
      <div className="bg-brand-charcoal text-white -mx-4 px-4 py-4 md:mx-0 md:px-6 md:rounded-card flex items-center gap-3 shadow-lg no-print">
        <button 
          onClick={handleBack} 
          className="p-1.5 hover:bg-white/10 rounded-pill transition-colors tap-scale"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold">
            {categoryName}
          </h2>
          <span className="font-body text-[10px] text-brand-yellow font-bold uppercase tracking-wider">
            Latur Quick-Commerce • {filtered.length} products
          </span>
        </div>
      </div>

      {/* 2. Sticky Filter & Sort Bar */}
      <div className="sticky top-[64px] z-50 bg-white/95 backdrop-blur-md -mx-4 px-4 py-3 md:mx-0 md:px-0 border-b border-ice-blue-dk/10 flex items-center justify-between gap-3 shadow-sm no-print">
        
        {/* Left: Filter triggers */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          
          {/* Main Filter Toggle */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-pill bg-ice-blue border border-ice-blue-dk/30 text-brand-charcoal font-body text-xs font-bold tap-scale shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          {/* Quick Veg Toggle Chip */}
          <button
            onClick={() => setFilterVegOnly(!filterVegOnly)}
            className={`px-3 py-2 rounded-pill font-body text-xs font-bold border transition-all shrink-0 tap-scale ${
              filterVegOnly
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            🟢 Veg Only
          </button>

          {/* Quick McCain Brand Chip */}
          <button
            onClick={() => setFilterBrand(filterBrand === 'MCCAIN' ? 'ALL' : 'MCCAIN')}
            className={`px-3 py-2 rounded-pill font-body text-xs font-bold border transition-all shrink-0 tap-scale ${
              filterBrand === 'MCCAIN'
                ? 'bg-brand-orange-light text-brand-orange border-brand-orange'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            McCain Special
          </button>

        </div>

        {/* Right: Sort Dropdown Toggle */}
        <div className="flex items-center gap-2 shrink-0 select-none">
          <button
            onClick={() => {
              setSortBy(current => 
                current === 'SORT_ORDER' ? 'PRICE_ASC' : current === 'PRICE_ASC' ? 'PRICE_DESC' : 'SORT_ORDER'
              )
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-pill bg-white border border-gray-200 text-gray-500 font-body text-xs font-bold hover:border-gray-300 tap-scale"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-brand-orange" />
            <span>
              {sortBy === 'SORT_ORDER' && 'Default'}
              {sortBy === 'PRICE_ASC' && 'Price: Low to High'}
              {sortBy === 'PRICE_DESC' && 'Price: High to Low'}
            </span>
          </button>
        </div>

      </div>

      {/* 3. Product Grid */}
      <section className="mt-2 min-h-[400px]">
        <ProductGrid products={filtered} isLoading={isLoading} />
      </section>

      {/* 4. Bottom Slide-up Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[250] flex items-end no-print">
          
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-[2px] fade-in"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-full bg-white rounded-t-drawer max-h-[85vh] overflow-y-auto z-10 drawer-slide-up shadow-2xl p-5 flex flex-col justify-between gap-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-display text-base font-bold text-brand-charcoal">
                ⚙️ Filters & Sorting
              </h3>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="text-gray-400 hover:text-brand-charcoal text-sm font-bold p-1"
              >
                ✕ Close
              </button>
            </div>

            {/* Content Sections */}
            <div className="flex flex-col gap-5">
              
              {/* Diet Options */}
              <div>
                <span className="font-display text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2.5">
                  Dietary Selection
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterVegOnly(false)}
                    className={`px-4 py-2 rounded-pill text-xs font-bold border transition-all ${
                      !filterVegOnly ? 'bg-brand-charcoal text-white border-brand-charcoal' : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    All Items
                  </button>
                  <button
                    onClick={() => setFilterVegOnly(true)}
                    className={`px-4 py-2 rounded-pill text-xs font-bold border transition-all ${
                      filterVegOnly ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500' : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    🟢 Vegetarian Only
                  </button>
                </div>
              </div>

              {/* Brand Filter */}
              <div>
                <span className="font-display text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2.5">
                  Brand filter
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterBrand('ALL')}
                    className={`px-4 py-2 rounded-pill text-xs font-bold border transition-all ${
                      filterBrand === 'ALL' ? 'bg-brand-charcoal text-white border-brand-charcoal' : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    All Brands
                  </button>
                  <button
                    onClick={() => setFilterBrand('MCCAIN')}
                    className={`px-4 py-2 rounded-pill text-xs font-bold border transition-all ${
                      filterBrand === 'MCCAIN' ? 'bg-brand-orange-light text-brand-orange border-brand-orange' : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    McCain Foods
                  </button>
                </div>
              </div>

              {/* Stock Availability */}
              <div>
                <span className="font-display text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2.5">
                  Stock Status
                </span>
                <button
                  onClick={() => setFilterInStockOnly(!filterInStockOnly)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-card border transition-all text-left font-body text-xs font-bold ${
                    filterInStockOnly ? 'bg-brand-orange-light border-brand-orange text-brand-orange' : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  <span>Hide out of stock items</span>
                  {filterInStockOnly && <CheckCircle className="w-4 h-4 text-brand-orange" />}
                </button>
              </div>

            </div>

            {/* Footer Apply CTA */}
            <button
              onClick={() => setIsFilterOpen(false)}
              className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-body text-sm font-extrabold py-3.5 rounded-pill shadow-lg hover:shadow-brand-orange/20 transition-all text-center tap-scale"
            >
              Apply Filters ({filtered.length} products)
            </button>

          </div>
        </div>
      )}

    </div>
  )
}
