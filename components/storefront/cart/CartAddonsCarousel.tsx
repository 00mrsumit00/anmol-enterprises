'use client'

import React from 'react'
import { Plus, Check, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useCart } from '@/hooks/useCart'
import { getProductPacketImage, normalizeImageUrl } from '@/lib/productImages'

interface CartAddonsCarouselProps {
  campaignDiscountValue?: number
  isCampaignActive?: boolean
}

export default function CartAddonsCarousel({
  campaignDiscountValue = 10,
  isCampaignActive = false,
}: CartAddonsCarouselProps) {
  const { items: cartItems, add, increment } = useCart()

  // Fetch products
  const { data, isLoading } = useQuery({
    queryKey: ['cart-addons-products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to load products')
      return res.json()
    },
    staleTime: 60 * 1000,
  })

  const allProducts = data?.products || []

  // Filter specifically for: French Fries, Smiles, Cheesy Bites, Veggie Nuggets
  // AND MUST BE AVAILABLE (stockCount > 0)
  const targetKeywords = ['fries', 'smile', 'cheese', 'nugget']

  const eligibleAddons = allProducts
    .filter((product: any) => {
      const name = (product.name || '').toLowerCase()
      const slug = (product.slug || '').toLowerCase()
      const matchesKeyword = targetKeywords.some((kw) => name.includes(kw) || slug.includes(kw))
      if (!matchesKeyword) return false

      // Check availability: at least one variant must have stockCount > 0
      const hasAvailableStock = Array.isArray(product.variants) && product.variants.some((v: any) => (v.stockCount || 0) > 0)
      return hasAvailableStock
    })
    .map((product: any) => {
      // Pick the first in-stock variant
      const variant = product.variants.find((v: any) => (v.stockCount || 0) > 0) || product.variants[0]
      const basePrice = variant?.retailPrice || 100
      const discountedPrice = isCampaignActive
        ? Math.round(basePrice * (1 - campaignDiscountValue / 100))
        : basePrice

      return {
        product,
        variant,
        basePrice,
        discountedPrice,
      }
    })
    .slice(0, 4)

  if (isLoading || eligibleAddons.length === 0) return null

  return (
    <div id="cart-addons-section" className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <span>Popular Add-Ons For You</span>
            <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
              Pair with your meal
            </span>
          </h4>
        </div>
      </div>

      {/* Horizontal Scrollable Carousel */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x">
        {eligibleAddons.map(({ product, variant, basePrice, discountedPrice }: any) => {
          if (!variant) return null
          const inCartItem = cartItems.find((i) => i.variantId === variant.id)
          const inCart = Boolean(inCartItem)
          const packetImg = normalizeImageUrl(getProductPacketImage(product.slug, product.imageUrl))

          const handleAddToCart = () => {
            if (inCart) {
              increment(variant.id)
            } else {
              add({
                productId: product.id,
                variantId: variant.id,
                productName: product.name,
                productSlug: product.slug,
                imageUrl: packetImg,
                packagingType: variant.packagingType || 'SINGLE',
                weightGrams: variant.weightGrams || 500,
                unitsInPack: variant.unitsInPack || 1,
                skuCode: variant.skuCode || 'ADDON',
                unitPrice: discountedPrice,
                quantity: 1,
                lineTotal: discountedPrice,
              })
            }
          }

          return (
            <div
              key={product.id}
              className="w-36 shrink-0 snap-start bg-white rounded-2xl border border-gray-200/90 p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition"
            >
              <div>
                {/* Thumbnail + Discount Tag */}
                <div className="relative w-full h-20 bg-gray-50 rounded-xl flex items-center justify-center p-1 overflow-hidden border border-gray-100">
                  <img
                    src={packetImg}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                  {isCampaignActive && (
                    <span className="absolute top-1 left-1 bg-orange-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                      {campaignDiscountValue}% OFF
                    </span>
                  )}
                </div>

                {/* Title & Weight */}
                <h5 className="text-[11px] font-black text-gray-900 mt-2 truncate leading-tight">
                  {product.name}
                </h5>
                <p className="text-[9px] text-gray-400 font-bold mt-0.5">
                  {variant.weightGrams >= 1000
                    ? `${(variant.weightGrams / 1000).toFixed(1)} kg`
                    : `${variant.weightGrams} g`}
                </p>
              </div>

              {/* Price & Add Button */}
              <div className="flex items-center justify-between gap-1 mt-2.5 pt-1.5 border-t border-gray-100">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-gray-900 leading-none">
                    ₹{discountedPrice}
                  </span>
                  {isCampaignActive && discountedPrice < basePrice && (
                    <span className="text-[9px] text-gray-400 line-through">
                      ₹{basePrice}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition shadow-2xs active:scale-95 ${
                    inCart
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-[#0c831f] hover:text-white border border-emerald-200'
                  }`}
                  title="Add to cart"
                >
                  {inCart ? (
                    <span className="text-xs font-black">{inCartItem?.quantity}</span>
                  ) : (
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
