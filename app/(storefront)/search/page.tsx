'use client'

import React, { useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Sparkles, Flame, SearchX } from 'lucide-react'
import ProductGrid from '@/components/storefront/ProductGrid'
import ProductCard from '@/components/storefront/ProductCard'
import CategoryChipRail, { CategoryChip } from '@/components/storefront/CategoryChipRail'
import FilterBar, { SortOption, PriceFilter, TypeFilter } from '@/components/storefront/FilterBar'

// Comprehensive frozen food & grocery synonym map
const SYNONYM_MAP: Record<string, string[]> = {
  fries: ['chips', 'potato', 'french', 'wedges', 'crinkle', 'masala'],
  fry: ['fries', 'chips', 'potato', 'french'],
  french: ['fries', 'potato', 'chips'],
  chips: ['fries', 'potato', 'crispy'],
  potato: ['aloo', 'tikki', 'fries', 'smiles', 'wedges', 'bites', 'shotz'],
  potatoes: ['aloo', 'tikki', 'fries', 'smiles', 'wedges', 'bites', 'shotz'],
  aloo: ['potato', 'tikki', 'burger'],
  burger: ['patty', 'burger', 'tikki', 'bun'],
  patty: ['burger', 'tikki', 'herb', 'corn'],
  patties: ['burger', 'tikki', 'herb', 'corn'],
  cheese: ['cheesy', 'shotz', 'nuggets', 'pizza', 'mozzarella'],
  cheesy: ['cheese', 'shotz', 'nuggets', 'pizza', 'fingers'],
  pizza: ['cheesy', 'fingers', 'samosa', 'cheese'],
  samosa: ['mini', 'cheese', 'pizza', 'samosas'],
  samosas: ['mini', 'cheese', 'pizza', 'samosa'],
  chicken: ['non-veg', 'wings', 'poultry', 'meat', 'venkys', 'venkey'],
  wings: ['chicken', 'non-veg', 'venkys'],
  nonveg: ['chicken', 'wings', 'meat', 'poultry', 'venkys', 'fish', 'basa'],
  'non-veg': ['chicken', 'wings', 'meat', 'poultry', 'venkys', 'fish', 'basa'],
  fish: ['basa', 'seafood', 'fillet', 'fingers'],
  basa: ['fish', 'seafood', 'fillet'],
  seafood: ['fish', 'basa', 'prawns', 'fillet'],
  snack: ['snacks', 'bites', 'nuggets', 'fingers', 'tikki', 'samosa'],
  snacks: ['snack', 'bites', 'nuggets', 'fingers', 'tikki', 'samosa'],
  onion: ['rings', 'crispy', 'specialties'],
  ring: ['rings', 'onion'],
  rings: ['ring', 'onion'],
  nugget: ['nuggets', 'bites'],
  nuggets: ['nugget', 'bites', 'cheesy'],
  bites: ['nuggets', 'shotz', 'garlic'],
  garlic: ['chilli', 'bites', 'potato'],
  chilli: ['garlic', 'bites', 'cheesy', 'herb'],
  spicy: ['masala', 'chilli', 'garlic'],
  masala: ['spicy', 'fries'],
  veg: ['veggie', 'vegetarian'],
  veggie: ['veg', 'fingers', 'burger', 'nuggets'],
}

// Calculate relevance score for search query
function calculateSearchScore(p: any, query: string): number {
  if (!query.trim()) return 1
  const qClean = query.toLowerCase().trim()
  const pName = (p.name || '').toLowerCase()
  const pBrand = (p.brand || '').toLowerCase()
  const pDesc = (p.description || '').toLowerCase()
  const pCat = (p.category?.name || '').toLowerCase()
  const pSlug = (p.slug || '').toLowerCase()

  let score = 0

  // 1. Exact full query matches
  if (pName === qClean) return 200
  if (pName.includes(qClean)) score += 100
  if (pCat.includes(qClean)) score += 60
  if (pBrand.includes(qClean)) score += 40
  if (pDesc.includes(qClean)) score += 20
  if (pSlug.includes(qClean.replace(/\s+/g, '-'))) score += 50

  // 2. Tokenized search terms
  const tokens = qClean.split(/\s+/).filter(Boolean)
  for (const t of tokens) {
    if (pName.startsWith(t)) score += 50
    else if (pName.includes(t)) score += 30

    if (pCat.includes(t)) score += 25
    if (pBrand.includes(t)) score += 15
    if (pDesc.includes(t)) score += 10

    // Check synonyms
    const syns = SYNONYM_MAP[t] || []
    for (const s of syns) {
      if (pName.includes(s)) score += 20
      if (pCat.includes(s)) score += 15
      if (pDesc.includes(s)) score += 8
    }

    // Non-veg flag check
    if ((t === 'nonveg' || t === 'non-veg' || t === 'chicken' || t === 'wings' || t === 'meat') && p.isVeg === false) {
      score += 60
    }
  }

  return score
}

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
    setSelectedChip(chip.slug || chip.id)
  }

  // Multi-tier Search, Similarity & Filter Pipeline
  const { directMatches, similarProducts, hasZeroExactMatch } = useMemo(() => {
    if (!products.length) {
      return { directMatches: [], similarProducts: [], hasZeroExactMatch: false }
    }

    let activeList = [...products]

    // A. If search query exists, score all products
    let scoredList: { product: any; score: number }[] = []
    if (query.trim()) {
      scoredList = activeList.map((p) => ({
        product: p,
        score: calculateSearchScore(p, query)
      })).filter((item) => item.score > 0)

      scoredList.sort((a, b) => b.score - a.score)
    }

    let baseMatches = query.trim() 
      ? scoredList.map((item) => item.product) 
      : activeList

    // B. Apply Category Chip Filter (if not 'all')
    if (selectedChip !== 'all') {
      baseMatches = baseMatches.filter((p: any) => p.category?.slug === selectedChip || p.categoryId === selectedChip)
    }

    // C. Apply Type Filter
    if (typeFilter === 'snacks') {
      baseMatches = baseMatches.filter((p: any) => {
        const name = (p.name || '').toLowerCase()
        return name.includes('bites') || name.includes('nugget') || name.includes('samosa') || name.includes('tikki') || name.includes('ring') || name.includes('shotz')
      })
    } else if (typeFilter === 'fries') {
      baseMatches = baseMatches.filter((p: any) => {
        const name = (p.name || '').toLowerCase()
        return name.includes('fries') || name.includes('wedges')
      })
    } else if (typeFilter === 'bestsellers') {
      baseMatches = baseMatches.filter((p: any) => p.isFeatured || (p.rating && p.rating >= 4.5))
    }

    // D. Apply Price Filter
    if (priceFilter === 'under_150') {
      baseMatches = baseMatches.filter((p: any) => Number(p.price || p.variants?.[0]?.retailPrice || 0) < 150)
    } else if (priceFilter === '150_250') {
      baseMatches = baseMatches.filter((p: any) => {
        const pr = Number(p.price || p.variants?.[0]?.retailPrice || 0)
        return pr >= 150 && pr <= 250
      })
    } else if (priceFilter === 'above_250') {
      baseMatches = baseMatches.filter((p: any) => Number(p.price || p.variants?.[0]?.retailPrice || 0) > 250)
    }

    // E. Apply Sorting
    if (sort === 'price_low_high') {
      baseMatches.sort((a: any, b: any) => {
        const prA = Number(a.price || a.variants?.[0]?.retailPrice || 0)
        const prB = Number(b.price || b.variants?.[0]?.retailPrice || 0)
        return prA - prB
      })
    } else if (sort === 'price_high_low') {
      baseMatches.sort((a: any, b: any) => {
        const prA = Number(a.price || a.variants?.[0]?.retailPrice || 0)
        const prB = Number(b.price || b.variants?.[0]?.retailPrice || 0)
        return prB - prA
      })
    } else if (sort === 'name_asc') {
      baseMatches.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
    }

    // F. Discover Similar / Related Products
    const directIds = new Set(baseMatches.map((p: any) => p.id))
    let similar: any[] = []

    if (query.trim()) {
      if (baseMatches.length > 0) {
        // Find other products in the same categories
        const matchedCategories = new Set(baseMatches.map((p: any) => p.categoryId))
        similar = products.filter((p: any) => !directIds.has(p.id) && matchedCategories.has(p.categoryId)).slice(0, 6)
        
        // If not enough from exact category, add bestsellers
        if (similar.length < 4) {
          const extra = products.filter((p: any) => !directIds.has(p.id) && !similar.some(s => s.id === p.id)).slice(0, 4 - similar.length)
          similar = [...similar, ...extra]
        }
      } else {
        // Zero direct matches: recommend top popular & featured products
        similar = products.filter((p: any) => p.isFeatured || (p.variants?.[0]?.stockCount || 0) > 20).slice(0, 8)
        if (similar.length === 0) similar = products.slice(0, 8)
      }
    }

    const hasZeroExactMatch = query.trim().length > 0 && baseMatches.length === 0

    return {
      directMatches: baseMatches,
      similarProducts: similar,
      hasZeroExactMatch
    }
  }, [products, query, selectedChip, typeFilter, priceFilter, sort])

  return (
    <div className="flex flex-col gap-4 no-print pb-24 font-sans">
      
      {/* Navigation Header Row */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button 
          onClick={() => router.push('/')}
          className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-xs active:scale-95 transition-transform shrink-0 flex items-center gap-1.5 text-xs font-bold text-gray-700"
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

      {/* Dynamic Category Chip Rail */}
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
        totalResults={directMatches.length}
      />

      {/* Zero Results Notice with Instant Smart Fallback */}
      {hasZeroExactMatch && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-700 flex items-center justify-center shrink-0">
            <SearchX className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-gray-900">
              No exact products found for &ldquo;{query}&rdquo;
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              Don&apos;t worry! Here are popular frozen snacks and customer favourites you might like:
            </p>
          </div>
        </div>
      )}

      {/* Direct Results Header */}
      {!hasZeroExactMatch && (
        <div className="flex items-center justify-between px-1 pt-1">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 tracking-tight flex items-center gap-2">
              <span>{query.trim() ? `Results for "${query}"` : selectedChip !== 'all' ? `Category Products` : 'All Frozen Products'}</span>
              {query.trim() && (
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Smart Match
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              {directMatches.length} {directMatches.length === 1 ? 'item' : 'items'} available
            </p>
          </div>
        </div>
      )}

      {/* Main Product Grid */}
      <section className={hasZeroExactMatch ? 'hidden' : 'min-h-[300px]'}>
        <ProductGrid products={directMatches} isLoading={isLoading} />
      </section>

      {/* "Similar & You May Also Like" Recommendation Rail */}
      {similarProducts.length > 0 && (
        <section className="mt-6 pt-6 border-t border-gray-200/80 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-900">
                {hasZeroExactMatch ? 'Recommended Frozen Treats' : 'Similar & You May Also Like'}
              </h3>
            </div>
            <span className="text-[11px] font-bold text-gray-400">
              {similarProducts.length} Suggestions
            </span>
          </div>

          {/* Horizontal scrollable similar products */}
          <div className="w-full overflow-x-auto no-scrollbar flex items-stretch gap-3.5 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
            {similarProducts.map((product: any) => (
              <div key={product.id} className="min-w-[180px] sm:min-w-[200px] max-w-[200px] shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

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
