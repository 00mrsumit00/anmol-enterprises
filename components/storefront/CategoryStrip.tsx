'use client'

import React from 'react'
import { useCart } from '@/hooks/useCart'

interface CategoryPill {
  id: string
  label: string
  emoji: string
  slug: string
  badge?: string
  color: string
  activeColor: string
}

const PILLS: CategoryPill[] = [
  { id: 'all',          label: 'All Frozen',     emoji: '❄️',  slug: 'all',                    badge: 'Popular', color: 'bg-gray-100 text-gray-700 border-gray-200',             activeColor: 'bg-[#FF6B00] text-white border-[#FF6B00]' },
  { id: 'fries',        label: 'French Fries',   emoji: '🍟',  slug: 'frozen-potato-snacks',   color: 'bg-orange-50 text-orange-700 border-orange-200',           activeColor: 'bg-[#FF6B00] text-white border-[#FF6B00]' },
  { id: 'smiles',       label: 'Smiles',         emoji: '😊',  slug: 'frozen-potato-snacks',   color: 'bg-yellow-50 text-yellow-700 border-yellow-200',           activeColor: 'bg-[#FF6B00] text-white border-[#FF6B00]' },
  { id: 'cheese-shotz', label: 'Cheese Bites',   emoji: '🧀',  slug: 'cheese-veggie-bites',    color: 'bg-amber-50 text-amber-700 border-amber-200',              activeColor: 'bg-[#FF6B00] text-white border-[#FF6B00]' },
  { id: 'tikki',        label: 'Aloo Tikki',     emoji: '🥔',  slug: 'frozen-potato-snacks',   color: 'bg-stone-100 text-stone-700 border-stone-200',             activeColor: 'bg-[#FF6B00] text-white border-[#FF6B00]' },
  { id: 'onion-rings',  label: 'Onion Rings',    emoji: '🍳',  slug: 'onion-corn-specialties', color: 'bg-red-50 text-red-700 border-red-200',                    activeColor: 'bg-[#FF6B00] text-white border-[#FF6B00]' },
  { id: 'fingers',      label: 'Veggie Fingers', emoji: '🌿',  slug: 'cheese-veggie-bites',    color: 'bg-green-50 text-green-700 border-green-200',              activeColor: 'bg-[#FF6B00] text-white border-[#FF6B00]' },
  { id: 'wedges',       label: 'Super Wedges',   emoji: '🔶',  slug: 'frozen-potato-snacks',   color: 'bg-orange-50 text-orange-700 border-orange-200',           activeColor: 'bg-[#FF6B00] text-white border-[#FF6B00]' },
  { id: 'b2b-bulk',     label: 'B2B Bulk',       emoji: '💼',  slug: 'b2b',                    badge: 'B2B',     color: 'bg-purple-50 text-purple-700 border-purple-200',          activeColor: 'bg-purple-700 text-white border-purple-700' },
]

interface CategoryStripProps {
  activeFilter: string
  onFilterChange: (id: string) => void
}

export default function CategoryStrip({ activeFilter, onFilterChange }: CategoryStripProps) {
  const { toggleB2B } = useCart()

  const handleClick = (pill: CategoryPill) => {
    if (pill.id === 'b2b-bulk') {
      toggleB2B()
      return
    }
    if (pill.id === 'all') {
      onFilterChange('all')
      return
    }
    onFilterChange(pill.slug)
  }

  return (
    <section className="w-full font-sans no-print -mx-4 px-4">
      {/* Horizontal scrollable pill row */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-0">
        {PILLS.map((pill) => {
          const isActive =
            (pill.id === 'all' && activeFilter === 'all') ||
            (pill.id !== 'all' && pill.id !== 'b2b-bulk' && activeFilter === pill.slug)

          return (
            <button
              key={pill.id}
              onClick={() => handleClick(pill)}
              className={`
                relative flex items-center gap-2 shrink-0 px-4 py-2.5
                rounded-full border font-bold text-sm
                transition-all duration-200 active:scale-95 select-none whitespace-nowrap
                ${isActive ? pill.activeColor + ' shadow-md shadow-[#FF6B00]/20 scale-[1.04]' : pill.color + ' hover:brightness-95'}
              `}
            >
              <span className="text-base leading-none">{pill.emoji}</span>
              <span>{pill.label}</span>

              {/* Badge */}
              {pill.badge && (
                <span className={`
                  absolute -top-1.5 -right-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider
                  ${isActive ? 'bg-white text-[#FF6B00]' : 'bg-[#FFC700] text-black'}
                `}>
                  {pill.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
