'use client'

import React from 'react'

interface ProductPacketVisualProps {
  slug: string
  name: string
  weight?: number
  className?: string
}

interface PacketTheme {
  primaryBg: string
  accentBg: string
  textColor: string
  subtitle: string
  emoji: string
  accentEmoji: string
  tag: string
  badgeBg: string
  highlightImg: string
}

const PACKET_THEMES: Record<string, PacketTheme> = {
  'mccain-french-fries': {
    primaryBg: 'from-[#d31c1c] via-[#b91c1c] to-[#881313]',
    accentBg: 'bg-[#f7c32e]',
    textColor: 'text-gray-900',
    subtitle: 'FRENCH FRIES',
    emoji: '🍟',
    accentEmoji: '✨',
    tag: 'STRAIGHT CUT',
    badgeBg: 'bg-[#f7c32e] text-black',
    highlightImg: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-smiles': {
    primaryBg: 'from-[#eab308] via-[#ca8a04] to-[#a16207]',
    accentBg: 'bg-[#d31c1c]',
    textColor: 'text-white',
    subtitle: 'CRISPY SMILES',
    emoji: '😊',
    accentEmoji: '🍟',
    tag: 'MASHED POTATO SHAPES',
    badgeBg: 'bg-[#d31c1c] text-white',
    highlightImg: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-potato-cheese-shotz': {
    primaryBg: 'from-[#1e293b] via-[#0f172a] to-[#d97706]',
    accentBg: 'bg-[#f7c32e]',
    textColor: 'text-gray-900',
    subtitle: 'POTATO CHEESE SHOTZ',
    emoji: '🧀',
    accentEmoji: '🥔',
    tag: 'MOLTEN CHEESE CENTER',
    badgeBg: 'bg-[#f7c32e] text-black',
    highlightImg: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-aloo-tikki': {
    primaryBg: 'from-[#ea580c] via-[#c2410c] to-[#9a3412]',
    accentBg: 'bg-[#fef08a]',
    textColor: 'text-gray-900',
    subtitle: 'ALOO TIKKI',
    emoji: '🧆',
    accentEmoji: '🌿',
    tag: 'TRADITIONAL SPICED',
    badgeBg: 'bg-white text-orange-900',
    highlightImg: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-chilli-cheesy-nuggets': {
    primaryBg: 'from-[#991b1b] via-[#7f1d1d] to-[#450a0a]',
    accentBg: 'bg-[#f7c32e]',
    textColor: 'text-gray-900',
    subtitle: 'CHILLI CHEESE NUGGETS',
    emoji: '🌶️',
    accentEmoji: '🧀',
    tag: 'HOT & MELTY',
    badgeBg: 'bg-[#f7c32e] text-black',
    highlightImg: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-chilli-garlic-potato-bites': {
    primaryBg: 'from-[#dc2626] via-[#b91c1c] to-[#7f1d1d]',
    accentBg: 'bg-[#fef08a]',
    textColor: 'text-gray-900',
    subtitle: 'CHILLI GARLIC BITES',
    emoji: '🧄',
    accentEmoji: '🌶️',
    tag: 'CRUNCHY NUGGETS',
    badgeBg: 'bg-yellow-300 text-black',
    highlightImg: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-chilli-garlic-bites': {
    primaryBg: 'from-[#dc2626] via-[#b91c1c] to-[#7f1d1d]',
    accentBg: 'bg-[#fef08a]',
    textColor: 'text-gray-900',
    subtitle: 'CHILLI GARLIC BITES',
    emoji: '🧄',
    accentEmoji: '🌶️',
    tag: 'CRUNCHY NUGGETS',
    badgeBg: 'bg-yellow-300 text-black',
    highlightImg: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-super-wedges': {
    primaryBg: 'from-[#b45309] via-[#92400e] to-[#78350f]',
    accentBg: 'bg-[#fef08a]',
    textColor: 'text-gray-900',
    subtitle: 'SUPER WEDGES',
    emoji: '🥔',
    accentEmoji: '🧂',
    tag: 'SKIN-ON SEASONED',
    badgeBg: 'bg-amber-300 text-black',
    highlightImg: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-masala-fries': {
    primaryBg: 'from-[#c2410c] via-[#9a3412] to-[#7c2d12]',
    accentBg: 'bg-[#f7c32e]',
    textColor: 'text-gray-900',
    subtitle: 'MASALA FRIES',
    emoji: '🔥',
    accentEmoji: '🍟',
    tag: 'PERI PERI SPICED',
    badgeBg: 'bg-[#f7c32e] text-black',
    highlightImg: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-veggie-burger-patty': {
    primaryBg: 'from-[#15803d] via-[#166534] to-[#14532d]',
    accentBg: 'bg-[#f7c32e]',
    textColor: 'text-gray-900',
    subtitle: 'VEGGIE BURGER PATTY',
    emoji: '🍔',
    accentEmoji: '🥬',
    tag: 'HERB & VEG PATTIES',
    badgeBg: 'bg-[#f7c32e] text-black',
    highlightImg: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-veg-seekh-kebab': {
    primaryBg: 'from-[#047857] via-[#065f46] to-[#064e3b]',
    accentBg: 'bg-[#fef08a]',
    textColor: 'text-gray-900',
    subtitle: 'VEG SEEKH KEBAB',
    emoji: '🍢',
    accentEmoji: '🌿',
    tag: 'TENDER & SMOKY',
    badgeBg: 'bg-emerald-300 text-black',
    highlightImg: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-corn-peas-patty': {
    primaryBg: 'from-[#ca8a04] via-[#a16207] to-[#15803d]',
    accentBg: 'bg-[#fef08a]',
    textColor: 'text-gray-900',
    subtitle: 'CORN & PEAS PATTY',
    emoji: '🌽',
    accentEmoji: '🟢',
    tag: 'SWEET CORN PATTIES',
    badgeBg: 'bg-yellow-300 text-black',
    highlightImg: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-crispy-onion-rings': {
    primaryBg: 'from-[#86198f] via-[#701a75] to-[#4a044e]',
    accentBg: 'bg-[#f7c32e]',
    textColor: 'text-gray-900',
    subtitle: 'CRISPY ONION RINGS',
    emoji: '🧅',
    accentEmoji: '✨',
    tag: 'BATTER COATED RINGS',
    badgeBg: 'bg-[#f7c32e] text-black',
    highlightImg: 'https://images.unsplash.com/photo-1639024471287-0351860db52e?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-corn-tikka': {
    primaryBg: 'from-[#b45309] via-[#78350f] to-[#451a03]',
    accentBg: 'bg-[#fef08a]',
    textColor: 'text-gray-900',
    subtitle: 'CORN TIKKA',
    emoji: '🌽',
    accentEmoji: '🔥',
    tag: 'CHAR-GRILLED CORN',
    badgeBg: 'bg-amber-300 text-black',
    highlightImg: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-crinkle-cut-fries': {
    primaryBg: 'from-[#dc2626] via-[#991b1b] to-[#7f1d1d]',
    accentBg: 'bg-[#f7c32e]',
    textColor: 'text-gray-900',
    subtitle: 'CRINKLE CUT FRIES',
    emoji: '🍟',
    accentEmoji: '⚡',
    tag: 'EXTRA CRISPY RIDGES',
    badgeBg: 'bg-[#f7c32e] text-black',
    highlightImg: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-v-crispers': {
    primaryBg: 'from-[#18181b] via-[#27272a] to-[#3f3f46]',
    accentBg: 'bg-[#f7c32e]',
    textColor: 'text-gray-900',
    subtitle: 'V-CRISPERS',
    emoji: '🍟',
    accentEmoji: '🏆',
    tag: 'V-CUT POTATO DIPPERS',
    badgeBg: 'bg-[#f7c32e] text-black',
    highlightImg: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-herb-chilli-burger-patty': {
    primaryBg: 'from-[#166534] via-[#14532d] to-[#052e16]',
    accentBg: 'bg-[#f7c32e]',
    textColor: 'text-gray-900',
    subtitle: 'HERB & CHILLI PATTY',
    emoji: '🍔',
    accentEmoji: '🌶️',
    tag: 'SPICY HERB CRUST',
    badgeBg: 'bg-[#f7c32e] text-black',
    highlightImg: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-mini-samosa': {
    primaryBg: 'from-[#b45309] via-[#92400e] to-[#78350f]',
    accentBg: 'bg-[#fef08a]',
    textColor: 'text-gray-900',
    subtitle: 'MINI SAMOSA',
    emoji: '🥟',
    accentEmoji: '✨',
    tag: 'CRUNCHY PASTRY',
    badgeBg: 'bg-yellow-300 text-black',
    highlightImg: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-cheese-pizza-mini-samosa': {
    primaryBg: 'from-[#b91c1c] via-[#831843] to-[#500724]',
    accentBg: 'bg-[#f7c32e]',
    textColor: 'text-gray-900',
    subtitle: 'CHEESE PIZZA SAMOSA',
    emoji: '🍕',
    accentEmoji: '🧀',
    tag: 'PIZZA CHEESE FILLING',
    badgeBg: 'bg-[#f7c32e] text-black',
    highlightImg: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-veggie-fingers': {
    primaryBg: 'from-[#15803d] via-[#166534] to-[#14532d]',
    accentBg: 'bg-[#fef08a]',
    textColor: 'text-gray-900',
    subtitle: 'VEGGIE FINGERS',
    emoji: '🥖',
    accentEmoji: '🥕',
    tag: 'MIX VEG STICKS',
    badgeBg: 'bg-yellow-300 text-black',
    highlightImg: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=400&auto=format&fit=crop'
  },
  'mccain-veggie-nuggets': {
    primaryBg: 'from-[#dc2626] via-[#b91c1c] to-[#15803d]',
    accentBg: 'bg-[#f7c32e]',
    textColor: 'text-gray-900',
    subtitle: 'VEGGIE NUGGETS',
    emoji: '🥦',
    accentEmoji: '🥔',
    tag: 'CRISPY VEGETABLE BITES',
    badgeBg: 'bg-yellow-300 text-black',
    highlightImg: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=400&auto=format&fit=crop'
  }
}

const DEFAULT_THEME: PacketTheme = {
  primaryBg: 'from-[#dc2626] via-[#b91c1c] to-[#991b1b]',
  accentBg: 'bg-[#f7c32e]',
  textColor: 'text-gray-900',
  subtitle: 'FROZEN SPECIALS',
  emoji: '🍟',
  accentEmoji: '✨',
  tag: 'READY IN 3 MINS',
  badgeBg: 'bg-[#f7c32e] text-black',
  highlightImg: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=400&auto=format&fit=crop'
}

export default function ProductPacketVisual({ slug, name, weight = 420, className = 'w-full h-full' }: ProductPacketVisualProps) {
  const theme = PACKET_THEMES[slug] || DEFAULT_THEME

  return (
    <div className={`relative flex items-center justify-center p-1 select-none ${className}`}>
      
      {/* 3D Pouch Container with Gloss & Shadows */}
      <div className={`relative w-full max-w-[240px] aspect-[4/5] rounded-[22px] bg-gradient-to-b ${theme.primaryBg} shadow-2xl overflow-hidden border border-white/20 flex flex-col justify-between p-3 transform transition-transform duration-300 group-hover:scale-102`}>
        
        {/* Glossy Top Crimp Seal */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-white/15 border-b border-black/20 flex items-center justify-center">
          {/* Crimp ribs texture */}
          <div className="w-full h-full flex justify-around opacity-40">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-black/40" />
            ))}
          </div>
          {/* Sombrero hanging hole */}
          <div className="absolute w-5 h-1.5 bg-black/40 rounded-full top-1" />
        </div>

        {/* Diagonal Gloss Highlight across pouch */}
        <div className="absolute -inset-x-20 -top-20 h-40 bg-gradient-to-b from-white/25 to-transparent rotate-12 pointer-events-none" />

        {/* 1. Header: Veg Icon + McCain Brand Seal + Ready Pill */}
        <div className="pt-2 z-10 flex items-start justify-between">
          
          {/* Green Veg Emblem */}
          <div className="w-4 h-4 bg-white rounded-xs border border-emerald-700 p-0.5 flex items-center justify-center shadow-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-700" />
          </div>

          {/* Authentic McCain Brand Oval Logo */}
          <div className="bg-[#f7c32e] text-black px-3 py-1 rounded-full shadow-md border-2 border-black/20 flex flex-col items-center leading-none">
            <span className="font-serif italic font-black text-sm tracking-tight text-gray-950">
              McCain
            </span>
          </div>

          {/* Ready in 3 mins pill */}
          <div className="bg-black/30 backdrop-blur-xs text-white text-[8px] font-black px-1.5 py-0.5 rounded-md border border-white/20">
            3 MIN
          </div>
        </div>

        {/* 2. Product Name Banner */}
        <div className="z-10 text-center my-1">
          <div className="inline-block bg-[#f7c32e] text-black px-2.5 py-0.5 rounded-md shadow-md border border-yellow-600/40">
            <span className="font-black text-[10px] sm:text-[11px] tracking-wide uppercase leading-tight block">
              {theme.subtitle}
            </span>
          </div>
          <span className="text-[8px] font-bold text-white/90 tracking-widest uppercase block mt-0.5 drop-shadow-sm">
            {theme.tag}
          </span>
        </div>

        {/* 3. Center Appetizing Photo Window */}
        <div className="relative z-10 w-full flex-1 max-h-[100px] rounded-xl overflow-hidden shadow-inner border border-white/20 bg-black/20 my-1">
          <img
            src={theme.highlightImg}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          />
          {/* Inner Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* 4. Footer Row: Net Weight + 100% Real Potato Seal */}
        <div className="z-10 flex items-center justify-between pt-1 border-t border-white/10 text-[9px] font-black text-white">
          <span className="bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
            NET WT. {weight >= 1000 ? `${(weight/1000).toFixed(1)} kg` : `${weight} g`}
          </span>
          <span className="text-[#f7c32e] tracking-wider drop-shadow-xs">
            ★ 100% VEG ★
          </span>
        </div>

        {/* Bottom Crimp Seal */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/20 border-t border-black/20 flex justify-around opacity-30">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="w-[1px] h-full bg-white/40" />
          ))}
        </div>

      </div>

    </div>
  )
}
