'use client'

import React from 'react'
import Image from 'next/image'

export interface CategoryChip {
  id: string
  label: string
  image: string
  slug: string
  searchTerm?: string
}

export const CATEGORY_CHIPS: CategoryChip[] = [
  {
    id: 'all',
    label: 'All',
    image: '/images/logo.png',
    slug: 'all',
    searchTerm: ''
  },
  {
    id: 'frozen-snack',
    label: 'Frozen snack',
    image: '/images/products/mccain-chilli-garlic-potato-bites.jpg',
    slug: 'frozen-snack',
    searchTerm: 'bites nuggets snack'
  },
  {
    id: 'french-fries',
    label: 'French fries',
    image: '/images/products/mccain-french-fries-420g.jpg',
    slug: 'french-fries',
    searchTerm: 'fries'
  },
  {
    id: 'smiles',
    label: 'Smiles',
    image: '/images/products/mccain-smiles.jpg',
    slug: 'smiles',
    searchTerm: 'smiles'
  },
  {
    id: 'aloo-tikki',
    label: 'Aloo tikki',
    image: '/images/products/mccain-aloo-tikki.jpg',
    slug: 'aloo-tikki',
    searchTerm: 'tikki patty burger'
  },
  {
    id: 'samosa',
    label: 'Samosa',
    image: '/images/products/mccain-cheese-corn-filling-mini-samosa.jpg',
    slug: 'samosa',
    searchTerm: 'samosa'
  },
  {
    id: 'pizza-pocket',
    label: 'Pizza pocket',
    image: '/images/products/mccain-cheese-pizza-style-filling-mini-samosa.jpg',
    slug: 'pizza-pocket',
    searchTerm: 'pizza'
  },
  {
    id: 'onion-rings',
    label: 'Onion rings',
    image: '/images/products/mccain-onion-rings.jpg',
    slug: 'onion-rings',
    searchTerm: 'onion'
  },
  {
    id: 'cheese-shotz',
    label: 'Cheese shotz',
    image: '/images/products/mccain-potato-cheese-shotz.jpg',
    slug: 'cheese-shotz',
    searchTerm: 'cheese shotz'
  },
  {
    id: 'wedges',
    label: 'Wedges',
    image: '/images/products/mccain-super-wedges.jpg',
    slug: 'wedges',
    searchTerm: 'wedges'
  }
]

interface CategoryChipRailProps {
  selectedChip: string
  onSelectChip: (chip: CategoryChip) => void
}

export default function CategoryChipRail({
  selectedChip,
  onSelectChip
}: CategoryChipRailProps) {
  return (
    <div className="w-full no-print select-none py-1.5">
      {/* Horizontal snap scroll container */}
      <div className="flex items-start gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-1 py-1">
        {CATEGORY_CHIPS.map((chip) => {
          const isSelected = selectedChip === chip.id

          if (chip.id === 'all') {
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onSelectChip(chip)}
                className={`snap-start shrink-0 flex flex-col items-center justify-between p-1.5 rounded-2xl transition-all ${
                  isSelected
                    ? 'border-2 border-[#0c831f] bg-emerald-50/40 shadow-xs'
                    : 'border border-gray-200/80 bg-white hover:bg-gray-50'
                }`}
                style={{ width: '68px', height: '78px' }}
              >
                <div className="w-11 h-11 rounded-xl bg-amber-400 flex items-center justify-center p-1 shadow-inner overflow-hidden">
                  <span className="font-display font-black text-black text-xs tracking-tighter">
                    McCain
                  </span>
                </div>
                <span className={`text-[11px] font-black leading-tight mt-1 ${
                  isSelected ? 'text-[#0c831f]' : 'text-gray-700'
                }`}>
                  All
                </span>
              </button>
            )
          }

          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onSelectChip(chip)}
              className="snap-start shrink-0 flex flex-col items-center text-center group transition-transform active:scale-95"
              style={{ width: '68px' }}
            >
              {/* Circular Avatar */}
              <div className={`w-14 h-14 rounded-full p-1 bg-white flex items-center justify-center border transition-all ${
                isSelected
                  ? 'border-2 border-[#0c831f] bg-emerald-50/50 shadow-md ring-2 ring-[#0c831f]/20'
                  : 'border-gray-200/90 hover:border-gray-300 shadow-xs group-hover:scale-105'
              }`}>
                <img
                  src={chip.image}
                  alt={chip.label}
                  className="w-full h-full object-contain drop-shadow-xs"
                  loading="lazy"
                />
              </div>

              {/* Label */}
              <span className={`text-[10px] font-bold leading-tight mt-1 line-clamp-2 max-w-[64px] ${
                isSelected ? 'text-[#0c831f] font-black' : 'text-gray-700 group-hover:text-gray-900'
              }`}>
                {chip.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
