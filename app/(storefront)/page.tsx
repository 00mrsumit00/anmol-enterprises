'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import HeroBanner from '@/components/storefront/HeroBanner'
import CategoryStrip from '@/components/storefront/CategoryStrip'
import ProductGrid from '@/components/storefront/ProductGrid'
import ProductCard from '@/components/storefront/ProductCard'
import TrustStrip from '@/components/storefront/TrustStrip'
import B2BBanner from '@/components/storefront/B2BBanner'
import { ChevronRight, Award, Flame, Zap, Snowflake } from 'lucide-react'

export default function Homepage() {
  const [activeFilter, setActiveFilter] = useState('all')

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
        return products.filter((p: any) => p.category?.slug === activeFilter)
    }
  }

  const filteredProducts = getFilteredProducts()
  const featuredProducts = products.filter((p: any) => p.isFeatured)

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4 md:gap-5 font-sans">
      
      {/* A. Hero Banner */}
      <HeroBanner />

      {/* B. Category Chips Strip */}
      <CategoryStrip activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* C. "McCain Specials" Horizontal Carousel */}
      {featuredProducts.length > 0 && (
        <section id="mccain-specials" className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-emerald-500/10 p-3.5 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl border border-amber-200/60 no-print">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-xs">
                🏆
              </div>
              <h3 className="font-extrabold text-sm sm:text-base md:text-lg text-gray-900">
                McCain Specials & Bestsellers
              </h3>
            </div>
            <button 
              onClick={() => setActiveFilter('featured')} 
              className="text-xs font-bold text-[#0c831f] hover:text-[#096918] flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Horizontal scroll grid */}
          <div className="w-full overflow-x-auto no-scrollbar flex items-stretch gap-4 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {featuredProducts.slice(0, 8).map((product: any) => (
              <div key={product.id} className="min-w-[190px] sm:min-w-[210px] max-w-[210px] shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* D. Trust Strip */}
      <TrustStrip />

      {/* E. Main Products Grid Section (Blinkit Card Layout) */}
      <section className="no-print">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {activeFilter === 'deals' ? (
              <Flame className="w-5 h-5 text-amber-600 animate-bounce" />
            ) : activeFilter === 'new' ? (
              <Zap className="w-5 h-5 text-yellow-500" />
            ) : (
              <Snowflake className="w-5 h-5 text-[#0c831f]" />
            )}
            <h3 className="font-extrabold text-lg sm:text-xl text-gray-900">
              {activeFilter === 'all' && 'McCain Frozen Collection'}
              {activeFilter === 'featured' && 'Featured Products'}
              {activeFilter === 'deals' && 'Hot Deals & Discounts'}
              {activeFilter === 'new' && 'New Arrivals'}
              {categories.find((c: any) => c.slug === activeFilter) && 
                `${categories.find((c: any) => c.slug === activeFilter).name}`}
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            {filteredProducts.length} items
          </span>
        </div>

        <ProductGrid products={filteredProducts} isLoading={productsLoading} />
      </section>

      {/* F. B2B Wholesale Banner */}
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
            <p>Latur City (Express 10-Min), Osmanabad, Nanded, Bidar</p>
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
