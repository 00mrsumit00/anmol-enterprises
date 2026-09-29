'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Search, Mic, X } from 'lucide-react'
import ProductGrid from '@/components/storefront/ProductGrid'
import CategoryChipRail, { CATEGORY_CHIPS, CategoryChip } from '@/components/storefront/CategoryChipRail'
import FilterBar, { SortOption, PriceFilter, TypeFilter } from '@/components/storefront/FilterBar'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  
  const [searchInput, setSearchInput] = useState(query)
  const [selectedChip, setSelectedChip] = useState('all')
  const [sort, setSort] = useState<SortOption>('default')
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  useEffect(() => {
    setSearchInput(query)
  }, [query])

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`)
    } else {
      router.push('/search')
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    router.push('/search')
  }

  return (
    <div className="flex flex-col gap-4 no-print pb-24 font-sans">
      
      {/* Search Bar Row with Back Arrow */}
      <div className="flex items-center gap-2.5 pt-1">
        <button 
          onClick={() => router.push('/')}
          className="p-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-xs active:scale-95 transition-transform shrink-0"
          title="Back to Home"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>

        {/* Input box */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search McCain fries, smiles, nuggets..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-[#f4f6fb] hover:bg-[#edf1f7] focus:bg-white border border-gray-200 focus:border-[#0c831f] text-gray-900 placeholder-gray-400 text-sm font-medium rounded-2xl pl-11 pr-12 py-2.5 focus:outline-none transition-all shadow-xs focus:shadow-md focus:shadow-emerald-600/10"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3.5 text-gray-400 hover:text-gray-700 p-1 font-bold text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              title="Voice Search"
              className="absolute right-3.5 text-gray-400 hover:text-gray-600 p-1"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </form>
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
