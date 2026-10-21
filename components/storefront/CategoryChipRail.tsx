'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'

export interface CategoryChip {
  id: string
  label: string
  emoji: string
  slug: string
  image?: string
}

interface CategoryChipRailProps {
  selectedChip: string
  onSelectChip: (chip: CategoryChip) => void
}

export default function CategoryChipRail({
  selectedChip,
  onSelectChip
}: CategoryChipRailProps) {
  // Fetch live categories from database
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) return []
      return res.json()
    }
  })

  const chips: CategoryChip[] = [
    {
      id: 'all',
      label: 'All Items',
      emoji: '❄️',
      slug: 'all'
    },
    ...dbCategories.map((c: any) => ({
      id: c.slug,
      label: c.name,
      emoji: c.emoji || '🍟',
      slug: c.slug
    }))
  ]

  return (
    <div className="w-full no-print select-none py-1.5">
      {/* Horizontal snap scroll container */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-1 py-1">
        {chips.map((chip) => {
          const isSelected = selectedChip === chip.id || (chip.id === 'all' && selectedChip === 'all')

          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onSelectChip(chip)}
              className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all active:scale-95 select-none whitespace-nowrap ${
                isSelected
                  ? 'bg-[#0c831f] text-white border-[#0c831f] shadow-sm font-black'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-sm leading-none">{chip.emoji}</span>
              <span className="truncate max-w-[150px]">{chip.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
