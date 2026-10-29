'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Minus, ChevronRight, ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { getProductPacketImage, normalizeImageUrl } from '@/lib/productImages'
import { useToast } from '@/components/ui/Toast'

interface SimilarProductsProps {
  categoryId?: string
  categoryName?: string
  currentProductId: string
}

export default function SimilarProductsCarousel({
  categoryId,
  categoryName,
  currentProductId,
}: SimilarProductsProps) {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { items, add, increment, decrement, isB2BMode } = useCart()
  const { showToast } = useToast()

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter products in same category (excluding current product)
          let filtered = data.filter(
            (p) => p.id !== currentProductId && (!categoryId || p.categoryId === categoryId)
          )
          // Fallback if category has very few items: include other popular products
          if (filtered.length < 3) {
            const others = data.filter((p) => p.id !== currentProductId && p.categoryId !== categoryId)
            filtered = [...filtered, ...others.slice(0, 6 - filtered.length)]
          }
          setProducts(filtered.slice(0, 8))
        }
      })
      .catch((err) => console.error('Failed to load similar products:', err))
      .finally(() => setIsLoading(false))
  }, [categoryId, currentProductId])

  if (isLoading || products.length === 0) return null

  return (
    <div className="w-full mt-10 mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          Similar products
        </h3>
        {categoryName && (
          <span className="text-xs font-semibold text-slate-400">
            in {categoryName}
          </span>
        )}
      </div>

      {/* Horizontal Scrolling Card Row */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
        {products.map((prod) => {
          const rawVariant = prod.variants?.[0]
          const price = isB2BMode
            ? (rawVariant?.b2bPrice || prod.price || 169)
            : (rawVariant?.retailPrice || prod.price || 213)
          const mrp = Math.round(price * 1.15)
          const weight = rawVariant?.weightGrams
            ? (rawVariant.weightGrams >= 1000
                ? `${(rawVariant.weightGrams / 1000).toFixed(1).replace('.0', '')} kg`
                : `${rawVariant.weightGrams} g`)
            : '1 unit'

          const imgUrl = normalizeImageUrl(getProductPacketImage(prod.slug, prod.imageUrl))
          const variantId = rawVariant?.id || `${prod.id}_default`
          const cartItem = items.find((i) => i.variantId === variantId || i.productId === prod.id)
          const qty = cartItem ? cartItem.quantity : 0

          const handleAdd = (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            add({
              productId: prod.id,
              variantId,
              productName: prod.name,
              productSlug: prod.slug,
              imageUrl: prod.imageUrl || imgUrl,
              packagingType: 'SINGLE',
              weightGrams: rawVariant?.weightGrams || 1000,
              unitsInPack: 1,
              skuCode: `SKU-${prod.slug.toUpperCase().slice(0, 8)}`,
              unitPrice: price,
              quantity: 1,
              lineTotal: price,
            })
            showToast(`Added ${prod.name} to cart`, 'success')
          }

          const handleInc = (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            if (cartItem) increment(cartItem.variantId)
          }

          const handleDec = (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            if (cartItem) decrement(cartItem.variantId)
          }

          return (
            <div
              key={prod.id}
              className="w-[145px] sm:w-[170px] shrink-0 bg-white border border-slate-200/80 rounded-2xl p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all snap-start"
            >
              <Link href={`/product/${prod.slug}`} className="block group">
                {/* Product Thumbnail */}
                <div className="relative w-full aspect-square bg-slate-50 rounded-xl p-2 flex items-center justify-center overflow-hidden mb-2">
                  <img
                    src={imgUrl}
                    alt={prod.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  {/* Veg / Non-Veg Indicator */}
                  <span className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border border-slate-300 rounded-xs bg-white flex items-center justify-center p-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        prod.isVeg !== false ? 'bg-[#15803D]' : 'bg-[#DC2626]'
                      }`}
                    />
                  </span>
                </div>

                {/* Title & Weight */}
                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 min-h-[2rem]">
                  {prod.name}
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 mb-2">
                  {weight}
                </p>
              </Link>

              {/* Price & Add Stepper */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-auto">
                <div>
                  <span className="text-xs font-black text-slate-900 block leading-tight">
                    ₹{price}
                  </span>
                  {mrp > price && (
                    <span className="text-[10px] text-slate-400 line-through leading-tight">
                      ₹{mrp}
                    </span>
                  )}
                </div>

                {qty === 0 ? (
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="h-7 px-3 bg-white hover:bg-emerald-50 text-[#15803D] font-extrabold text-xs rounded-lg border border-[#15803D]/60 hover:border-[#15803D] shadow-2xs transition-all flex items-center gap-1 active:scale-95"
                  >
                    <span>ADD</span>
                  </button>
                ) : (
                  <div className="h-7 bg-[#15803D] text-white rounded-lg flex items-center px-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={handleDec}
                      className="w-5 h-full flex items-center justify-center text-white active:opacity-70"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <span className="w-5 text-center text-xs font-black select-none">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={handleInc}
                      className="w-5 h-full flex items-center justify-center text-white active:opacity-70"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
