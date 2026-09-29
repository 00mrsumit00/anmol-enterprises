'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { LayoutGrid, ChevronRight, Search, Sparkles, Snowflake, ArrowRight } from 'lucide-react'

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    }
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json()
    }
  })

  // Group products by category ID for collage previews
  const getCategoryProducts = (catId: string) => {
    return products.filter((p: any) => p.categoryId === catId).slice(0, 4)
  }

  const pastelGradients = [
    'from-orange-50 via-amber-50 to-orange-100/50 border-orange-200/60',
    'from-emerald-50 via-teal-50 to-emerald-100/50 border-emerald-200/60',
    'from-blue-50 via-cyan-50 to-blue-100/50 border-blue-200/60',
    'from-purple-50 via-indigo-50 to-purple-100/50 border-purple-200/60',
    'from-amber-50 via-yellow-50 to-amber-100/50 border-amber-200/60',
    'from-rose-50 via-pink-50 to-rose-100/50 border-rose-200/60',
  ]

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 pb-28 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-charcoal via-slate-900 to-brand-charcoal text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-orange text-white flex items-center justify-center text-2xl shadow-lg shadow-brand-orange/30 shrink-0">
            ❄️
          </div>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-black text-white leading-tight">
              McCain Frozen Food Categories
            </h1>
            <p className="font-body text-xs text-gray-300 font-semibold mt-0.5">
              Explore 100% genuine cold-chain McCain French fries, appetizers & snacks
            </p>
          </div>
        </div>

        <Link
          href="/search"
          className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-display text-xs font-black px-4 py-2.5 rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition-all tap-scale shrink-0"
        >
          <Search className="w-4 h-4 text-brand-yellow" />
          <span>Search All Products</span>
        </Link>
      </div>

      {/* Section 1: Bestseller Collage Category Grid (Mobile App Inspired) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-base font-black text-brand-charcoal flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-orange" />
            <span>Bestsellers & Express Categories</span>
          </h2>
          <span className="text-[11px] font-bold text-gray-400">
            {categories.length} Collections
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-40 bg-gray-100 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {categories.map((cat: any, idx: number) => {
              const catProds = getCategoryProducts(cat.id)
              const gradientClass = pastelGradients[idx % pastelGradients.length]

              return (
                <Link
                  key={cat.id}
                  href={`/?category=${cat.slug}#catalog`}
                  className={`bg-gradient-to-br ${gradientClass} border rounded-3xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all tap-scale group relative overflow-hidden`}
                >
                  {/* Category Title & Emoji */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xl mb-1 block">{cat.emoji || '🍟'}</span>
                      <h3 className="font-display text-xs sm:text-sm font-black text-brand-charcoal leading-tight group-hover:text-brand-orange transition-colors">
                        {cat.name}
                      </h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* 2x2 Collage Thumbnail Grid */}
                  <div className="grid grid-cols-2 gap-1.5 mt-3">
                    {catProds.length > 0 ? (
                      catProds.map((prod: any, pIdx: number) => (
                        <div key={pIdx} className="aspect-square bg-white rounded-xl p-1 shadow-2xs border border-white/60 flex items-center justify-center overflow-hidden">
                          <img
                            src={prod.imageUrl || '/placeholder.png'}
                            alt={prod.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-4 text-center text-[10px] text-gray-400 font-semibold">
                        McCain Stock Available
                      </div>
                    )}
                  </div>

                  {/* Item count footer badge */}
                  <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-gray-500">
                    <span>Explore items</span>
                    <span className="text-brand-orange font-black">View &gt;</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Section 2: Wholesale B2B Fast Order Callout */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white rounded-3xl p-5 shadow-lg border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center font-black text-lg shrink-0">
            🏢
          </div>
          <div>
            <h3 className="font-display text-sm font-black text-white">
              Hotel & Restaurant Wholesale Bulk Packs
            </h3>
            <p className="text-xs text-purple-200 font-semibold mt-0.5">
              Order McCain 2.5kg Commercial Master Cartons with B2B Credit Line options.
            </p>
          </div>
        </div>
        <Link
          href="/account?tab=b2b"
          className="w-full sm:w-auto bg-amber-400 hover:bg-amber-500 text-purple-950 font-display text-xs font-black px-4 py-2.5 rounded-2xl shadow-md transition-all tap-scale flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>B2B Credit Portal</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  )
}
