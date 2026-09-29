'use client'

import React, { useState } from 'react'
import { SlidersHorizontal, ArrowUpDown, ChevronDown, Check, Sparkles } from 'lucide-react'

export type SortOption = 'default' | 'price_low_high' | 'price_high_low' | 'name_asc'
export type PriceFilter = 'all' | 'under_150' | '150_250' | 'above_250'
export type TypeFilter = 'all' | 'snacks' | 'fries' | 'bestsellers'

interface FilterBarProps {
  sort: SortOption
  onSortChange: (sort: SortOption) => void
  priceFilter: PriceFilter
  onPriceFilterChange: (price: PriceFilter) => void
  typeFilter: TypeFilter
  onTypeFilterChange: (type: TypeFilter) => void
  totalResults: number
}

export default function FilterBar({
  sort,
  onSortChange,
  priceFilter,
  onPriceFilterChange,
  typeFilter,
  onTypeFilterChange,
  totalResults
}: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<'sort' | 'price' | 'type' | null>(null)

  const toggleDropdown = (key: 'sort' | 'price' | 'type') => {
    setOpenDropdown(openDropdown === key ? null : key)
  }

  const getSortLabel = () => {
    switch (sort) {
      case 'price_low_high': return 'Price: Low to High'
      case 'price_high_low': return 'Price: High to Low'
      case 'name_asc': return 'Name: A to Z'
      default: return 'Sort'
    }
  }

  const getPriceLabel = () => {
    switch (priceFilter) {
      case 'under_150': return 'Under ₹150'
      case '150_250': return '₹150 - ₹250'
      case 'above_250': return 'Above ₹250'
      default: return 'Price'
    }
  }

  const getTypeLabel = () => {
    switch (typeFilter) {
      case 'snacks': return 'Snacks'
      case 'fries': return 'Fries'
      case 'bestsellers': return 'Bestsellers'
      default: return 'Type'
    }
  }

  return (
    <div className="relative w-full no-print select-none py-1 border-y border-gray-100 bg-white z-20">
      {/* Horizontal pill bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
        
        {/* 1. Filters Icon Button */}
        <button
          type="button"
          onClick={() => toggleDropdown('sort')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold rounded-xl shrink-0 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-600" />
          <span>Filters</span>
        </button>

        {/* 2. Sort Dropdown Pill */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => toggleDropdown('sort')}
            className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
              sort !== 'default'
                ? 'border-[#0c831f] bg-emerald-50 text-[#0c831f]'
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            <span>{getSortLabel()}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {openDropdown === 'sort' && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpenDropdown(null)} />
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl py-1 z-40 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { onSortChange('default'); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-gray-50 text-left"
                >
                  <span>Featured & Recommended</span>
                  {sort === 'default' && <Check className="w-3.5 h-3.5 text-[#0c831f]" />}
                </button>
                <button
                  type="button"
                  onClick={() => { onSortChange('price_low_high'); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-gray-50 text-left"
                >
                  <span>Price: Low to High</span>
                  {sort === 'price_low_high' && <Check className="w-3.5 h-3.5 text-[#0c831f]" />}
                </button>
                <button
                  type="button"
                  onClick={() => { onSortChange('price_high_low'); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-gray-50 text-left"
                >
                  <span>Price: High to Low</span>
                  {sort === 'price_high_low' && <Check className="w-3.5 h-3.5 text-[#0c831f]" />}
                </button>
                <button
                  type="button"
                  onClick={() => { onSortChange('name_asc'); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-gray-50 text-left"
                >
                  <span>Name: A to Z</span>
                  {sort === 'name_asc' && <Check className="w-3.5 h-3.5 text-[#0c831f]" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* 3. Type Dropdown Pill */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => toggleDropdown('type')}
            className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
              typeFilter !== 'all'
                ? 'border-[#0c831f] bg-emerald-50 text-[#0c831f]'
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            <span>{getTypeLabel()}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {openDropdown === 'type' && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpenDropdown(null)} />
              <div className="absolute left-0 top-full mt-1.5 w-40 bg-white border border-gray-200 rounded-2xl shadow-xl py-1 z-40 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { onTypeFilterChange('all'); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-gray-50 text-left"
                >
                  <span>All Types</span>
                  {typeFilter === 'all' && <Check className="w-3.5 h-3.5 text-[#0c831f]" />}
                </button>
                <button
                  type="button"
                  onClick={() => { onTypeFilterChange('fries'); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-gray-50 text-left"
                >
                  <span>French Fries</span>
                  {typeFilter === 'fries' && <Check className="w-3.5 h-3.5 text-[#0c831f]" />}
                </button>
                <button
                  type="button"
                  onClick={() => { onTypeFilterChange('snacks'); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-gray-50 text-left"
                >
                  <span>Snacks & Bites</span>
                  {typeFilter === 'snacks' && <Check className="w-3.5 h-3.5 text-[#0c831f]" />}
                </button>
                <button
                  type="button"
                  onClick={() => { onTypeFilterChange('bestsellers'); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-gray-50 text-left"
                >
                  <span>Bestsellers</span>
                  {typeFilter === 'bestsellers' && <Check className="w-3.5 h-3.5 text-[#0c831f]" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* 4. Price Dropdown Pill */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => toggleDropdown('price')}
            className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
              priceFilter !== 'all'
                ? 'border-[#0c831f] bg-emerald-50 text-[#0c831f]'
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            <span>{getPriceLabel()}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {openDropdown === 'price' && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpenDropdown(null)} />
              <div className="absolute left-0 top-full mt-1.5 w-44 bg-white border border-gray-200 rounded-2xl shadow-xl py-1 z-40 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { onPriceFilterChange('all'); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-gray-50 text-left"
                >
                  <span>All Prices</span>
                  {priceFilter === 'all' && <Check className="w-3.5 h-3.5 text-[#0c831f]" />}
                </button>
                <button
                  type="button"
                  onClick={() => { onPriceFilterChange('under_150'); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-gray-50 text-left"
                >
                  <span>Under ₹150</span>
                  {priceFilter === 'under_150' && <Check className="w-3.5 h-3.5 text-[#0c831f]" />}
                </button>
                <button
                  type="button"
                  onClick={() => { onPriceFilterChange('150_250'); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-gray-50 text-left"
                >
                  <span>₹150 - ₹250</span>
                  {priceFilter === '150_250' && <Check className="w-3.5 h-3.5 text-[#0c831f]" />}
                </button>
                <button
                  type="button"
                  onClick={() => { onPriceFilterChange('above_250'); setOpenDropdown(null) }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-gray-50 text-left"
                >
                  <span>Above ₹250</span>
                  {priceFilter === 'above_250' && <Check className="w-3.5 h-3.5 text-[#0c831f]" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* 5. Star Badge Pill */}
        <div className="shrink-0 flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-black px-2.5 py-1.5 rounded-xl">
          <span>⭐ Top Rated</span>
        </div>

        {/* 6. Results count text */}
        <span className="text-[10px] text-gray-400 font-semibold shrink-0 ml-auto pr-1">
          {totalResults} items
        </span>

      </div>
    </div>
  )
}
