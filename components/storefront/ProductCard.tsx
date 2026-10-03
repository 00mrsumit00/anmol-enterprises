'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Minus, Heart, ChevronDown, Check, Clock, Star } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/ui/Toast'
import { getProductPacketImage } from '@/lib/productImages'

export interface Variant {
  id: string
  productId: string
  packagingType: 'SINGLE' | 'BOX' | 'CARTON'
  unitsInPack: number
  weightGrams: number
  skuCode: string
  retailPrice: number
  b2bPrice: number
  stockCount: number
  minOrderQty: number
}

export interface ProductType {
  id: string
  name: string
  slug: string
  brand: string
  description: string
  isVeg: boolean
  imageUrl: string
  galleryImages?: string[]
  isFeatured: boolean
  variants: Variant[]
  category?: { name: string; slug: string }
  rating?: number
  reviewCount?: number
}

interface ProductCardProps {
  product: ProductType
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const { items, isB2BMode, add, increment, decrement } = useCart()
  const { showToast } = useToast()

  // Selected packaging tier (SINGLE by default)
  const [selectedTier, setSelectedTier] = useState<'SINGLE' | 'BOX' | 'CARTON'>('SINGLE')
  const [showVariantMenu, setShowVariantMenu] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)

  // Active variant matching selected packaging tier
  const variant = product.variants?.find((v) => v.packagingType === selectedTier) || product.variants?.[0] || {
    id: product.id,
    productId: product.id,
    packagingType: 'SINGLE',
    unitsInPack: 1,
    weightGrams: 420,
    skuCode: 'MCN-DEF',
    retailPrice: 199,
    b2bPrice: 169,
    stockCount: 50,
    minOrderQty: 1
  }

  // Check wishlist state in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('anmol_wishlist_ids')
      if (saved) {
        const list = JSON.parse(saved)
        setIsWishlisted(list.includes(product.id))
      }
    } catch {}
  }, [product.id])

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const saved = localStorage.getItem('anmol_wishlist_ids')
      const list: string[] = saved ? JSON.parse(saved) : []
      let nextList: string[]
      if (list.includes(product.id)) {
        nextList = list.filter((id) => id !== product.id)
        setIsWishlisted(false)
        showToast(`Removed from wishlist`, 'info')
      } else {
        nextList = [...list, product.id]
        setIsWishlisted(true)
        showToast(`Added ${product.name} to wishlist`, 'success')
      }
      localStorage.setItem('anmol_wishlist_ids', JSON.stringify(nextList))
    } catch {}
  }

  // Cart item matching this specific variant
  const cartItem = items.find((i) => i.variantId === variant.id)
  const quantityInCart = cartItem ? cartItem.quantity : 0
  const isOutOfStock = variant.stockCount <= 0

  // Price & Discount Calculations
  const activePrice = isB2BMode ? variant.b2bPrice : variant.retailPrice
  const mrpPrice = Math.round(activePrice * 1.15)
  const hasDiscount = mrpPrice > activePrice
  const discountPercent = hasDiscount ? Math.max(7, Math.round(((mrpPrice - activePrice) / mrpPrice) * 100)) : 0

  // Official downloaded packet image path
  const packetImageUrl = getProductPacketImage(product.slug, product.imageUrl)

  const handleNavigateToDetail = () => {
    router.push(`/product/${product.slug}`)
  }

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isOutOfStock) return

    add({
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: packetImageUrl,
      packagingType: variant.packagingType as any,
      weightGrams: variant.weightGrams,
      unitsInPack: variant.unitsInPack,
      skuCode: variant.skuCode,
      unitPrice: activePrice,
      quantity: 1,
      lineTotal: activePrice,
    })

    showToast(`Added ${product.name} to cart`, 'success')
  }

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (cartItem) increment(cartItem.variantId)
  }

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (cartItem) decrement(cartItem.variantId)
  }

  // Format weight/pack label
  const getVariantLabel = (v: Variant) => {
    if (v.packagingType === 'SINGLE') {
      return v.weightGrams >= 1000 ? `${(v.weightGrams / 1000).toFixed(1)} kg` : `${v.weightGrams} g`
    }
    if (v.packagingType === 'BOX') {
      return `Box (${v.unitsInPack || 10}u)`
    }
    return `Carton (${v.unitsInPack || 50}u)`
  }

  const hasMultipleImages = (product.galleryImages && product.galleryImages.length > 1) || (product.variants && product.variants.length > 1)

  return (
    <div 
      onClick={handleNavigateToDetail}
      className="bg-white border border-gray-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between hover:shadow-lg hover:border-gray-300 transition-all group relative cursor-pointer font-sans h-full select-none"
    >
      {/* ─────────────────────────────────────────────────────────────
          1. IMAGE CONTAINER WITH ABSOLUTE OVERLAYS (Blinkit Anatomy)
         ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full aspect-square bg-[#fbfbfb] rounded-2xl border border-gray-100/80 overflow-hidden flex items-center justify-center p-2 mb-2 group-hover:bg-[#f5f5f5] transition-colors">
        
        {/* Top-Left: Promo Ribbon Badge IF product has active discount */}
        {hasDiscount && (
          <div className="absolute top-0 left-0 z-20 bg-gradient-to-r from-[#256fef] to-blue-600 text-white font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-br-xl shadow-xs">
            {discountPercent}% OFF
          </div>
        )}

        {/* Top-Right: Wishlist Heart Icon */}
        <button
          type="button"
          onClick={toggleWishlist}
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xs transition-all active:scale-90"
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-gray-400 hover:text-rose-500'
            }`} 
          />
        </button>

        {/* Veg Square Icon */}
        <div className="absolute top-2 right-10 z-20 w-3.5 h-3.5 rounded-xs border border-emerald-700 p-0.5 flex items-center justify-center bg-white/90 shadow-2xs" title="100% Vegetarian">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
        </div>

        {/* Official McCain Product Image */}
        <img
          src={packetImageUrl}
          alt={product.name}
          className="max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Pagination Dots (bottom-center) */}
        {hasMultipleImages && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 z-15 pointer-events-none opacity-80">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-800" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          </div>
        )}

        {/* Bottom-Left: Pack Size Pill Overlapping the Image Edge */}
        <div className="absolute bottom-1.5 left-1.5 z-25" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => product.variants?.length > 1 && setShowVariantMenu(!showVariantMenu)}
            className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-extrabold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200/90 px-2 py-0.5 sm:py-1 rounded-lg shadow-xs transition-colors"
          >
            <span>{getVariantLabel(variant)}</span>
            {product.variants?.length > 1 && <ChevronDown className="w-2.5 h-2.5 text-gray-400 ml-0.5" />}
          </button>

          {/* Variant Selector Dropdown */}
          {showVariantMenu && (
            <div className="absolute left-0 bottom-full mb-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-40 text-xs font-semibold">
              {product.variants?.map((v) => {
                const isSelected = v.packagingType === selectedTier
                const vPrice = isB2BMode ? v.b2bPrice : v.retailPrice

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedTier(v.packagingType)
                      setShowVariantMenu(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-gray-50 ${
                      isSelected ? 'text-[#0c831f] font-bold bg-emerald-50/50' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>{getVariantLabel(v)}</span>
                      <span className="text-[10px] text-gray-400">₹{vPrice}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0c831f]" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Bottom-Right: Blinkit ADD Button Overlapping the Image Edge */}
        <div className="absolute bottom-1.5 right-1.5 z-25">
          {quantityInCart === 0 ? (
            <button
              type="button"
              onClick={handleAddClick}
              disabled={isOutOfStock}
              className={`border-2 border-[#0c831f] text-[#0c831f] bg-white hover:bg-[#0c831f] hover:text-white font-black text-xs sm:text-[13px] uppercase px-4 sm:px-5 py-1 sm:py-1.5 rounded-xl transition-all shadow-md active:scale-95 ${
                isOutOfStock ? 'opacity-40 cursor-not-allowed border-gray-300 text-gray-400 bg-gray-50' : ''
              }`}
            >
              ADD
            </button>
          ) : (
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="bg-[#0c831f] text-white font-black text-xs rounded-xl px-2 py-1 flex items-center gap-2 shadow-md select-none"
            >
              <button
                type="button"
                onClick={handleDecrement}
                className="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded-md transition-colors"
                title="Decrease"
              >
                <Minus className="w-3 h-3 stroke-[3]" />
              </button>
              <span className="font-extrabold min-w-[12px] text-center text-xs">
                {quantityInCart}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                className="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded-md transition-colors"
                title="Increase"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
          )}
        </div>

        {/* Sold Out Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex items-center justify-center z-30">
            <span className="bg-gray-900 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. BELOW IMAGE METADATA (Blinkit Typography & Rows)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between pt-1">
        
        {/* Price Row + MRP Strikethrough */}
        <div className="flex items-baseline gap-1.5 leading-none mb-1">
          <span className="font-black text-sm sm:text-base text-gray-900">
            ₹{activePrice}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-gray-400 line-through">
              ₹{mrpPrice}
            </span>
          )}
          {isB2BMode && (
            <span className="text-[9px] text-purple-700 font-extrabold ml-auto">B2B Tier</span>
          )}
        </div>

        {/* MRP Discount Subtext (e.g. 15% OFF on MRP) */}
        {hasDiscount && (
          <div className="text-[#256fef] font-bold text-[10px] leading-tight mb-1">
            {discountPercent}% OFF on MRP
          </div>
        )}

        {/* Product Title (2-line clamp with ellipsis) */}
        <h3 className="font-bold text-xs sm:text-[13px] text-gray-800 line-clamp-2 leading-snug group-hover:text-[#0c831f] transition-colors mb-1.5">
          {product.name}
        </h3>

        {/* Category Tag Row (e.g. ❄️ Frozen) */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200/80 text-[10px] font-bold px-2 py-0.5 rounded-md leading-none">
            <span>❄️</span>
            <span>{product.category?.name || 'Frozen'}</span>
          </span>
        </div>

        {/* Rating Row (Only rendered if rating data exists) */}
        {product.rating && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold mb-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-bold text-gray-700">{product.rating}</span>
            {product.reviewCount && (
              <span className="text-gray-400">({product.reviewCount})</span>
            )}
          </div>
        )}

        {/* Delivery Time Badge (Clock + 10-15 mins) */}
        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold mt-auto pt-0.5">
          <Clock className="w-3 h-3 text-gray-400" />
          <span>10-15 mins</span>
        </div>

      </div>

    </div>
  )
}
