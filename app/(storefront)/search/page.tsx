'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import ProductGrid from '@/components/storefront/ProductGrid'
import CategoryChipRail, { CATEGORY_CHIPS, CategoryChip } from '@/components/storefront/CategoryChipRail'
import FilterBar, { SortOption, PriceFilter, TypeFilter } from '@/components/storefront/FilterBar'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  
  const [selectedChip, setSelectedChip] = useState('all')
  const [sort, setSort] = useState<SortOption>('default')
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  // Fetch all active products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json()
    }
  })

  // Handle Category Chip Click
  const handleSelectChip = (chip: CategoryChip) => {
    setSelectedChip(chip.id)
  }

  // Filter and Sort Pipeline
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...products]

    // 1. Text Search Query Filter
    if (query.trim()) {
      const terms = query.toLowerCase().trim().split(/\s+/)
      list = list.filter((p: any) => {
        const matchName = (p.name || '').toLowerCase()
        const matchBrand = (p.brand || '').toLowerCase()
        const matchDesc = (p.description || '').toLowerCase()
        const matchCategory = (p.category?.name || '').toLowerCase()
        
        return terms.every(
          (term) =>
            matchName.includes(term) ||
            matchBrand.includes(term) ||
            matchDesc.includes(term) ||
            matchCategory.includes(term)
        )
      })
    }

    // 2. Category Chip Filter
    if (selectedChip !== 'all') {
      const chipObj = CATEGORY_CHIPS.find((c) => c.id === selectedChip)
      if (chipObj?.searchTerm) {
        const chipTerms = chipObj.searchTerm.toLowerCase().split(/\s+/)
        list = list.filter((p: any) => {
          const name = (p.name || '').toLowerCase()
          const desc = (p.description || '').toLowerCase()
          const cat = (p.category?.name || '').toLowerCase()
          return chipTerms.some((t) => name.includes(t) || desc.includes(t) || cat.includes(t))
        })
      }
    }

    // 3. Type Filter
    if (typeFilter === 'snacks') {
      list = list.filter((p: any) => {
        const name = (p.name || '').toLowerCase()
        return name.includes('bites') || name.includes('nugget') || name.includes('samosa') || name.includes('tikki') || name.includes('ring') || name.includes('pocket')
      })
    } else if (typeFilter === 'fries') {
      list = list.filter((p: any) => {
        const name = (p.name || '').toLowerCase()
        return name.includes('fries') || name.includes('wedges')
      })
    } else if (typeFilter === 'bestsellers') {
      list = list.filter((p: any) => p.isFeatured || (p.rating && p.rating >= 4.5))
    }

    // 4. Price Filter
    if (priceFilter === 'under_150') {
      list = list.filter((p: any) => Number(p.price) < 150)
    } else if (priceFilter === '150_250') {
      list = list.filter((p: any) => Number(p.price) >= 150 && Number(p.price) <= 250)
    } else if (priceFilter === 'above_250') {
      list = list.filter((p: any) => Number(p.price) > 250)
    }

    // 5. Sorting
    if (sort === 'price_low_high') {
      list.sort((a: any, b: any) => Number(a.price) - Number(b.price))
    } else if (sort === 'price_high_low') {
      list.sort((a: any, b: any) => Number(b.price) - Number(a.price))
    } else if (sort === 'name_asc') {
      list.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
    }

    return list
  }, [products, query, selectedChip, typeFilter, priceFilter, sort])

  return (
    <div className="flex flex-col gap-4 no-print pb-24 font-sans">
      
      {/* Navigation Header Row (Master search bar is sticky in header) */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button 
          onClick={() => router.push('/')}
          className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-xs active:scale-95 transition-transform shrink-0 flex items-center gap-1.5 text-xs font-bold text-gray-700"
          title="Back to Home"
        >
          <ArrowLeft className="w-4 h-4 text-gray-800" />
          <span>Back to Store</span>
        </button>

        {query ? (
          <span className="text-xs text-gray-500 font-semibold truncate">
            Search results for <strong className="text-gray-900">&ldquo;{query}&rdquo;</strong>
          </span>
        ) : (
          <span className="text-xs text-gray-400 font-semibold">
            All Products
          </span>
        )}
      </div>

      {/* Blinkit-Style Category Chip Rail */}
      <section className="-mx-3 sm:mx-0">
        <CategoryChipRail
          selectedChip={selectedChip}
          onSelectChip={handleSelectChip}
        />
      </section>

      {/* Filter and Sort Pills */}
      <FilterBar
        sort={sort}
        onSortChange={setSort}
        priceFilter={priceFilter}
        onPriceFilterChange={setPriceFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        totalResults={filteredAndSortedProducts.length}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-gray-900 tracking-tight">
            {query.trim() ? `Results for "${query}"` : selectedChip !== 'all' ? `Filtered by category` : 'All Frozen Products'}
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'item' : 'items'} available
          </p>
        </div>
      </div>

      {/* Product Grid */}
      <section className="min-h-[400px]">
        <ProductGrid products={filteredAndSortedProducts} isLoading={isLoading} />
      </section>

    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#0c831f] border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchPageContent />
    </Suspense>
  )
}
