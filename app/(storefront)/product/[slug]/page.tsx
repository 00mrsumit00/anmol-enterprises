'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { 
  ChevronRight, 
  Clock, 
  ShieldCheck, 
  Plus, 
  Minus, 
  ShoppingBag,
  Truck,
  Tag,
  Boxes,
  Sparkles,
  Package,
  Barcode,
  Snowflake,
  CheckCircle2,
  BadgePercent,
  Flame,
  Utensils,
  Leaf,
  Layers
} from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/ui/Toast'
import ProductGallery from '@/components/storefront/ProductGallery'
import { getProductMedia, getProductGallerySlides, ProductMediaData } from '@/lib/productImages'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const { items, add, increment, decrement, isB2BMode } = useCart()
  const { showToast } = useToast()

  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)

  useEffect(() => {
    if (!slug) return
    setIsLoading(true)
    fetch(`/api/products/${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setProduct(data)
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching product:', err)
        setIsLoading(false)
      })
  }, [slug])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0c831f] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500">Loading McCain product details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center min-h-[50vh] flex flex-col items-center justify-center font-sans">
        <span className="text-6xl">🍟</span>
        <h2 className="text-xl font-black text-gray-900 mt-4">Product Not Found</h2>
        <p className="text-gray-500 text-xs mt-1">Returning you to McCain storefront...</p>
        <Link 
          href="/" 
          className="mt-5 bg-[#0c831f] text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-md hover:bg-[#096918] transition-all"
        >
          Explore All McCain Products
        </Link>
      </div>
    )
  }

  // Product media information & Gallery slides
  const mediaData: ProductMediaData = getProductMedia(product.slug)
  const gallerySlides = getProductGallerySlides(product)

  // Active Variant & Pricing Calculation
  const variants = product.variants || []
  const activeVariant = variants[selectedVariantIndex] || {
    id: product.id,
    packagingType: 'SINGLE',
    unitsInPack: 1,
    weightGrams: 420,
    skuCode: `SKU-${product.slug?.toUpperCase().slice(0, 8)}`,
    retailPrice: 199,
    b2bPrice: 169,
    stockCount: 80,
  }

  const cartItem = items.find((i) => i.variantId === activeVariant.id)
  const quantityInCart = cartItem ? cartItem.quantity : 0
  const isOutOfStock = activeVariant.stockCount <= 0

  const activePrice = isB2BMode ? activeVariant.b2bPrice : activeVariant.retailPrice
  const mrpPrice = Math.round(activePrice * 1.15)
  const discountPercent = Math.max(7, Math.round(((mrpPrice - activePrice) / mrpPrice) * 100))

  const handleAddToCart = () => {
    if (isOutOfStock) return
    add({
      productId: product.id,
      variantId: activeVariant.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: mediaData.packetImage,
      packagingType: activeVariant.packagingType,
      weightGrams: activeVariant.weightGrams,
      unitsInPack: activeVariant.unitsInPack,
      skuCode: activeVariant.skuCode,
      unitPrice: activePrice,
      quantity: 1,
      lineTotal: activePrice,
    })
    showToast(`Added ${product.name} to cart`, 'success')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-8 font-sans">
      
      {/* 1. BREADCRUMBS (Blinkit Style) */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-6 flex-wrap">
        <Link href="/" className="hover:text-[#0c831f] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link href="/" className="hover:text-[#0c831f] transition-colors">
          {product.category?.name || 'Frozen Veg Snacks'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-900 font-bold truncate max-w-[280px]">
          {product.name}
        </span>
      </nav>

      {/* 2. MAIN PRODUCT DETAILS GRID (Blinkit Screenshot Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* LEFT COLUMN: AUTO-SCROLLING PRODUCT GALLERY WITH THUMBNAIL ARROW BAR */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          <ProductGallery
            productName={product.name}
            productSlug={product.slug}
            slides={gallerySlides}
            discountPercent={discountPercent}
            isVeg={product.isVeg}
          />

          {/* Clean Nutritional Facts & Ingredients Card */}
          <div className="p-5 bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/50 rounded-3xl border border-emerald-200/80 shadow-xs text-gray-900">
            <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-emerald-200/60">
              <Leaf className="w-4 h-4 text-emerald-700" />
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">100% Vegetarian Ingredients</h4>
            </div>
            <p className="text-xs text-gray-600 font-medium leading-relaxed mb-4">
              {mediaData.ingredients}
            </p>

            <h5 className="text-[11px] font-black text-gray-700 uppercase tracking-wider mb-2">
              Nutritional Facts (Per 100g)
            </h5>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-xl border border-gray-200/80 shadow-2xs">
                <span className="text-[9px] text-gray-400 font-bold block">Energy</span>
                <span className="font-black text-gray-900 text-xs">{mediaData.nutrition.calories} kcal</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-gray-200/80 shadow-2xs">
                <span className="text-[9px] text-gray-400 font-bold block">Protein</span>
                <span className="font-black text-gray-900 text-xs">{mediaData.nutrition.protein}g</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-gray-200/80 shadow-2xs">
                <span className="text-[9px] text-gray-400 font-bold block">Carbs</span>
                <span className="font-black text-gray-900 text-xs">{mediaData.nutrition.carbs}g</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-gray-200/80 shadow-2xs">
                <span className="text-[9px] text-gray-400 font-bold block">Total Fat</span>
                <span className="font-black text-gray-900 text-xs">{mediaData.nutrition.fat}g</span>
              </div>
              <div className="bg-emerald-100/90 p-2 rounded-xl border border-emerald-300 shadow-2xs">
                <span className="text-[9px] text-emerald-800 font-bold block">Trans Fat</span>
                <span className="font-black text-emerald-900 text-xs">0.0g ✓</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-gray-200/80 shadow-2xs">
                <span className="text-[9px] text-gray-400 font-bold block">Sodium</span>
                <span className="font-black text-gray-900 text-xs">{mediaData.nutrition.sodium}mg</span>
              </div>
            </div>
          </div>

          {/* 3-Minute Cooking Guide Card */}
          <div className="p-5 bg-gradient-to-br from-amber-50/70 via-white to-yellow-50/50 rounded-3xl border border-amber-200/80 shadow-xs text-gray-900">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-200/60">
              <Flame className="w-4 h-4 text-amber-600" />
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">3-Minute Easy Cooking Guide</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 bg-white rounded-2xl border border-amber-100 shadow-2xs flex flex-col gap-1">
                <span className="text-lg">🍟</span>
                <h5 className="font-black text-xs text-gray-900">Deep Fry (Classic)</h5>
                <p className="text-[10px] text-gray-500 leading-snug">{mediaData.cooking.deepFry}</p>
              </div>

              <div className="p-2.5 bg-white rounded-2xl border border-amber-100 shadow-2xs flex flex-col gap-1">
                <span className="text-lg">⏱️</span>
                <h5 className="font-black text-xs text-gray-900">Air Fry (Zero Oil)</h5>
                <p className="text-[10px] text-gray-500 leading-snug">{mediaData.cooking.airFry}</p>
              </div>

              <div className="p-2.5 bg-white rounded-2xl border border-amber-100 shadow-2xs flex flex-col gap-1">
                <span className="text-lg">🔥</span>
                <h5 className="font-black text-xs text-gray-900">Oven Bake</h5>
                <p className="text-[10px] text-gray-500 leading-snug">{mediaData.cooking.bake}</p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PRODUCT SPECIFICATIONS, VARIANT SELECTION & CART (Blinkit Screenshot Style) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* Header & Title */}
          <div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1">
              {product.brand || 'McCain'} • Frozen Food
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                {activeVariant.weightGrams >= 1000 ? `${(activeVariant.weightGrams / 1000).toFixed(1)} kg` : `${activeVariant.weightGrams} g`}
              </span>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                ✓ In Stock (Latur Dark Store)
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 mt-3 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Select Unit / Packaging Size (Matching Screenshot media_1787492890360.png) */}
          <div>
            <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#0c831f]" />
              <span>Select Unit</span>
            </label>

            <div className="flex flex-wrap gap-3">
              {variants.map((v: any, idx: number) => {
                const isSelected = selectedVariantIndex === idx
                const vPrice = isB2BMode ? v.b2bPrice : v.retailPrice
                const vMrp = Math.round(vPrice * 1.15)
                const vDiscount = Math.max(5, Math.round(((vMrp - vPrice) / vMrp) * 100))

                return (
                  <button
                    key={v.id || idx}
                    type="button"
                    onClick={() => setSelectedVariantIndex(idx)}
                    className={`relative px-4 py-3 rounded-2xl border-2 text-xs font-black transition-all flex flex-col items-start min-w-[100px] ${
                      isSelected
                        ? 'border-[#0c831f] bg-emerald-50/60 text-[#0c831f] shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {/* Discount Tag on Unit Card (like 20% OFF in Screenshot) */}
                    {idx > 0 && (
                      <span className="absolute -top-2 left-2 bg-[#256fef] text-white text-[8px] font-black px-1.5 py-0.2 rounded-md shadow-2xs">
                        {vDiscount}% OFF
                      </span>
                    )}

                    <span className="text-xs font-black text-gray-900 leading-tight">
                      {v.packagingType === 'SINGLE' 
                        ? `${v.weightGrams >= 1000 ? `${(v.weightGrams / 1000).toFixed(1)} kg` : `${v.weightGrams} g`}`
                        : v.packagingType === 'BOX' 
                        ? `2 × ${v.weightGrams / 2} g` 
                        : `Bulk Carton (${v.unitsInPack}x)`}
                    </span>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-black text-gray-900">
                        ₹{vPrice}
                      </span>
                      <span className="text-[10px] text-gray-400 line-through">
                        ₹{vMrp}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pricing Row */}
          <div className="flex flex-col gap-1 border-t border-b border-gray-100 py-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-gray-900">
                ₹{activePrice}
              </span>
              <span className="text-base text-gray-400 line-through font-bold">
                MRP ₹{mrpPrice}
              </span>
              <span className="text-xs font-black text-[#256fef] bg-blue-50 px-2.5 py-0.5 rounded-md">
                {discountPercent}% OFF
              </span>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">
              (Inclusive of all taxes)
            </span>
          </div>

          {/* Add to Cart CTA / Stepper (Blinkit Green Button) */}
          <div className="flex items-center gap-4">
            {isOutOfStock ? (
              <button
                disabled
                className="w-full bg-gray-200 text-gray-500 font-extrabold py-3.5 rounded-2xl cursor-not-allowed text-sm"
              >
                Currently Out of Stock
              </button>
            ) : quantityInCart > 0 ? (
              <div className="bg-[#0c831f] text-white rounded-2xl flex items-center justify-between w-full h-14 px-5 shadow-lg select-none">
                <button
                  onClick={() => decrement(activeVariant.id)}
                  className="w-9 h-9 flex items-center justify-center hover:bg-black/10 rounded-xl transition-colors"
                >
                  <Minus className="w-5 h-5 stroke-[3]" />
                </button>
                <span className="text-base font-black px-4">
                  {quantityInCart} in cart (₹{quantityInCart * activePrice})
                </span>
                <button
                  onClick={() => increment(activeVariant.id)}
                  className="w-9 h-9 flex items-center justify-center hover:bg-black/10 rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full bg-[#0c831f] hover:bg-[#096918] text-white font-black text-base py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Add to cart</span>
              </button>
            )}
          </div>

          {/* "Why shop from Anmol Enterprises?" (Matching Screenshot media_1787492890360.png) */}
          <div className="mt-2 pt-5 border-t border-gray-100 flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wider">
              Why shop from Anmol Enterprises?
            </h3>

            <div className="flex flex-col gap-3.5">
              
              {/* Highlight 1 */}
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100/80 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">
                    Round The Clock 10-Minute Delivery
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                    Get items delivered to your doorstep from dark stores near you, whenever you need them.
                  </p>
                </div>
              </div>

              {/* Highlight 2 */}
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100/80 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">
                    Best Prices & Offers
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                    Best price destination with offers directly from McCain authorized regional distributor.
                  </p>
                </div>
              </div>

              {/* Highlight 3 */}
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100/80 flex items-center justify-center shrink-0">
                  <Snowflake className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">
                    Wide Assortment & -18°C Guarantee
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                    Choose from complete McCain frozen range preserved under strict thermal cold chain.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
