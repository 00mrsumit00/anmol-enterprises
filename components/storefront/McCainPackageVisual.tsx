'use client'

import React from 'react'

interface McCainPackageVisualProps {
  name: string
  slug: string
  className?: string
}

export default function McCainPackageVisual({ name, slug, className = 'w-full h-full' }: McCainPackageVisualProps) {
  // Determine product-specific color accents and food emojis/illustrations
  const getProductVisuals = (productSlug: string) => {
    if (productSlug.includes('french-fries') || productSlug.includes('fries') || productSlug.includes('wedges')) {
      return {
        bgGradient: 'from-[#dc2626] via-[#b91c1c] to-[#991b1b]',
        bannerBg: 'bg-amber-400 text-black',
        foodEmoji: '🍟',
        subtitle: 'STRAIGHT CUT FRIES',
        prepTime: 'READY IN 3 MINS',
        itemIllustration: (
          <div className="relative w-full h-24 flex items-end justify-center pb-1">
            {/* Fries Bundle Representation */}
            <div className="flex gap-1 items-end justify-center">
              <div className="w-2.5 h-16 bg-gradient-to-t from-amber-500 to-yellow-300 rounded-t-sm shadow-md transform -rotate-12" />
              <div className="w-2.5 h-20 bg-gradient-to-t from-amber-500 to-yellow-300 rounded-t-sm shadow-md transform -rotate-6" />
              <div className="w-2.5 h-22 bg-gradient-to-t from-amber-400 to-yellow-200 rounded-t-sm shadow-md z-10" />
              <div className="w-2.5 h-18 bg-gradient-to-t from-amber-500 to-yellow-300 rounded-t-sm shadow-md transform rotate-6" />
              <div className="w-2.5 h-14 bg-gradient-to-t from-amber-500 to-yellow-300 rounded-t-sm shadow-md transform rotate-12" />
            </div>
            {/* Dip Bowl */}
            <div className="absolute bottom-0 right-2 w-7 h-5 bg-red-600 rounded-b-full border-t border-amber-300 shadow-md flex items-center justify-center text-[7px] font-black text-white">
              DIP
            </div>
          </div>
        )
      }
    }

    if (productSlug.includes('smiles')) {
      return {
        bgGradient: 'from-[#e11d48] via-[#be123c] to-[#9f1239]',
        bannerBg: 'bg-yellow-300 text-black',
        foodEmoji: '😊',
        subtitle: 'FUN MASHED POTATOES',
        prepTime: 'HAPPY SNACK',
        itemIllustration: (
          <div className="relative w-full h-24 flex items-center justify-center gap-2">
            {/* Smiley faces */}
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full border-2 border-amber-500 shadow-lg flex flex-col items-center justify-center p-1">
              <div className="flex gap-2 mb-1">
                <div className="w-1.5 h-1.5 bg-amber-800 rounded-full" />
                <div className="w-1.5 h-1.5 bg-amber-800 rounded-full" />
              </div>
              <div className="w-6 h-3 border-b-2 border-amber-800 rounded-b-full" />
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full border-2 border-amber-500 shadow-md flex flex-col items-center justify-center p-1 transform rotate-12">
              <div className="flex gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 bg-amber-800 rounded-full" />
                <div className="w-1.5 h-1.5 bg-amber-800 rounded-full" />
              </div>
              <div className="w-4 h-2 border-b-2 border-amber-800 rounded-b-full" />
            </div>
          </div>
        )
      }
    }

    if (productSlug.includes('chilli-garlic') || productSlug.includes('bites') || productSlug.includes('nuggets')) {
      return {
        bgGradient: 'from-[#dc2626] via-[#c2410c] to-[#9a3412]',
        bannerBg: 'bg-amber-400 text-black',
        foodEmoji: '🌶️',
        subtitle: 'CRUNCHY POTATO BITES',
        prepTime: 'SPICY & CRUNCHY',
        itemIllustration: (
          <div className="relative w-full h-24 flex items-center justify-center">
            {/* Golden Bites Cluster */}
            <div className="grid grid-cols-3 gap-1.5 p-2 bg-black/20 rounded-xl backdrop-blur-[1px]">
              <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-md border border-amber-300 shadow-md" />
              <div className="w-6 h-6 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-md border border-amber-300 shadow-md transform rotate-6" />
              <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-md border border-amber-300 shadow-md" />
              <div className="w-6 h-6 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-md border border-amber-300 shadow-md transform -rotate-6" />
              <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-md border border-amber-300 shadow-md" />
              <div className="w-6 h-6 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-md border border-amber-300 shadow-md" />
            </div>
          </div>
        )
      }
    }

    if (productSlug.includes('cheese') || productSlug.includes('cheesy') || productSlug.includes('shotz')) {
      return {
        bgGradient: 'from-[#7c2d12] via-[#9a3412] to-[#c2410c]',
        bannerBg: 'bg-yellow-400 text-black',
        foodEmoji: '🧀',
        subtitle: 'MOLTEN CHEESE FILLING',
        prepTime: 'EXTRA CHEESY',
        itemIllustration: (
          <div className="relative w-full h-24 flex items-center justify-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 rounded-full border-2 border-amber-200 shadow-lg flex items-center justify-center relative overflow-hidden">
              {/* Oozing cheese */}
              <div className="w-6 h-4 bg-yellow-200 rounded-full border border-amber-400 animate-pulse" />
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 rounded-full border-2 border-amber-200 shadow-md flex items-center justify-center">
              <div className="w-4 h-3 bg-yellow-200 rounded-full" />
            </div>
          </div>
        )
      }
    }

    // Default McCain Package layout
    return {
      bgGradient: 'from-[#dc2626] via-[#b91c1c] to-[#991b1b]',
      bannerBg: 'bg-amber-400 text-black',
      foodEmoji: '🧆',
      subtitle: 'FROZEN SPECIALTY',
      prepTime: 'READY IN MINUTES',
      itemIllustration: (
        <div className="relative w-full h-24 flex items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl border-2 border-amber-200 shadow-lg flex items-center justify-center text-3xl">
            🥔
          </div>
        </div>
      )
    }
  }

  const visuals = getProductVisuals(slug)

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-inner bg-gradient-to-b ${visuals.bgGradient} p-2 flex flex-col justify-between select-none ${className}`}>
      
      {/* Top Bar: Veg Dot & Prep Badge */}
      <div className="flex items-center justify-between z-10">
        {/* Green Veg Dot */}
        <div className="w-4 h-4 bg-white rounded border border-gray-200 flex items-center justify-center p-0.5 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[#00A67E]" />
        </div>

        {/* Ready in 3 mins circular badge */}
        <div className="w-6 h-6 bg-yellow-400 rounded-full border border-amber-600 shadow-sm flex flex-col items-center justify-center text-[6px] font-black text-black leading-tight text-center">
          <span>3</span>
          <span className="text-[5px]">MIN</span>
        </div>
      </div>

      {/* Center: Iconic McCain Oval Logo */}
      <div className="my-1 flex flex-col items-center z-10">
        <div className="bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-500 border-2 border-amber-900 rounded-full px-3 py-0.5 shadow-md flex items-center justify-center transform -rotate-1">
          <span className="font-serif italic font-black text-black text-xs tracking-tight drop-shadow-sm">
            McCain
          </span>
        </div>

        {/* Product Title Banner */}
        <div className={`mt-1 px-2 py-0.5 rounded-sm shadow-sm font-black text-[9px] uppercase tracking-wider text-center max-w-[90%] truncate ${visuals.bannerBg}`}>
          {name.replace(/^McCain\s+/i, '')}
        </div>
      </div>

      {/* Product Illustration / Food Preview */}
      <div className="relative z-0">
        {visuals.itemIllustration}
      </div>

      {/* Bottom Shiny Packaging Foil Border */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 opacity-60 rounded-b-md z-10" />

    </div>
  )
}
