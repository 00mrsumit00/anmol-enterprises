'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Star,
  Package, 
  Snowflake, 
  Truck, 
  ShieldCheck, 
  FileText, 
  Leaf, 
  BarChart3, 
  Utensils, 
  Minus, 
  Plus, 
  ShoppingBag,
  Check
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
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  // Accordion open/collapse states (Matching Screenshot 3: Description and Ingredients open by default)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    description: true,
    ingredients: true,
    nutrition: false,
    cooking: false,
    storage: false,
  })

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

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
      <div className="max-w-6xl mx-auto px-4 py-20 flex justify-center items-center min-h-[60vh] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#15803D] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center font-sans">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl mb-4">
          🍟
        </div>
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-slate-500 text-xs mt-1 max-w-sm">
          The requested product could not be located in our catalog.
        </p>
        <Link 
          href="/" 
          className="mt-6 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold px-6 py-3 rounded-xl shadow-xs transition-all"
        >
          Explore Catalog
        </Link>
      </div>
    )
  }

  // Product media information & Gallery slides
  const mediaData: ProductMediaData = getProductMedia(product.slug)
  const gallerySlides = getProductGallerySlides(product)

  // Raw variants from database
  const rawVariants = product.variants && product.variants.length > 0 ? product.variants : []
  
  // Base single pack reference price
  const basePrice = isB2BMode
    ? (rawVariants[0]?.b2bPrice || product.price || 169)
    : (rawVariants[0]?.retailPrice || product.price || 213)

  const baseWeight = rawVariants[0]?.weightGrams || 2500

  // ─── 3 EQUAL-HEIGHT PACK OPTIONS (Single, Box of 10, Carton of 50) ───
  // Matches Screenshot 2: 2.5 kg | Box (10 kg) | Carton (50 kg)
  interface PackOption {
    id: string
    variantIndex: number
    label: string
    subtitleWeight: string
    unitsInPack: number
    weightGrams: number
    price: number
    mrp: number
    unitPriceText: string
    isCustomSynth?: boolean
  }

  let packOptions: PackOption[] = []

  if (rawVariants.length >= 3) {
    // If database already contains 3 variants (e.g. SINGLE, BOX, CARTON)
    packOptions = rawVariants.slice(0, 3).map((v: any, idx: number) => {
      const vPrice = isB2BMode ? v.b2bPrice : v.retailPrice
      const vMrp = Math.round(vPrice * 1.15)
      const weightKg = v.weightGrams ? v.weightGrams / 1000 : 1
      const perKgPrice = weightKg > 0 ? Math.round(vPrice / weightKg) : vPrice
      
      let label = v.packagingType === 'SINGLE' 
        ? (v.weightGrams >= 1000 ? `${(v.weightGrams / 1000).toFixed(1).replace('.0', '')} kg` : `${v.weightGrams} g`)
        : v.packagingType === 'BOX'
        ? `Box (${v.weightGrams >= 1000 ? (v.weightGrams / 1000).toFixed(0) + ' kg' : (v.unitsInPack || 10) + ' units'})`
        : `Carton (${v.weightGrams >= 1000 ? (v.weightGrams / 1000).toFixed(0) + ' kg' : (v.unitsInPack || 50) + ' units'})`

      return {
        id: v.id,
        variantIndex: idx,
        label,
        subtitleWeight: v.weightGrams >= 1000 ? `${(v.weightGrams / 1000).toFixed(1).replace('.0', '')} kg` : `${v.weightGrams} g`,
        unitsInPack: v.unitsInPack || 1,
        weightGrams: v.weightGrams || 2500,
        price: vPrice,
        mrp: vMrp,
        unitPriceText: `(₹${perKgPrice}/kg)`,
      }
    })
  } else {
    // Synthesize the standard retail/B2B 3 tiers as shown in Screenshot 2
    const singleKg = baseWeight >= 1000 ? baseWeight / 1000 : 1
    const singlePerKg = Math.round(basePrice / singleKg)

    const boxKg = singleKg * 4 // e.g. 10 kg
    const boxPrice = Math.round(basePrice * 4) // e.g. 850
    const boxPerKg = Math.round(boxPrice / boxKg)

    const cartonKg = singleKg * 20 // e.g. 50 kg
    const cartonPrice = Math.round(basePrice * 18.3) // e.g. 3900 with bulk savings
    const cartonPerKg = Math.round(cartonPrice / cartonKg)

    packOptions = [
      {
        id: rawVariants[0]?.id || `${product.id}_single`,
        variantIndex: 0,
        label: baseWeight >= 1000 ? `${(baseWeight / 1000).toFixed(1).replace('.0', '')} kg` : `${baseWeight} g`,
        subtitleWeight: baseWeight >= 1000 ? `${(baseWeight / 1000).toFixed(1).replace('.0', '')} kg` : `${baseWeight} g`,
        unitsInPack: 1,
        weightGrams: baseWeight,
        price: basePrice,
        mrp: Math.round(basePrice * 1.15),
        unitPriceText: `(₹${singlePerKg}/kg)`,
      },
      {
        id: rawVariants[1]?.id || `${product.id}_box`,
        variantIndex: rawVariants[1] ? 1 : 0,
        label: `Box (${boxKg} kg)`,
        subtitleWeight: `${boxKg} kg`,
        unitsInPack: 4,
        weightGrams: boxKg * 1000,
        price: rawVariants[1] ? (isB2BMode ? rawVariants[1].b2bPrice : rawVariants[1].retailPrice) : boxPrice,
        mrp: Math.round((rawVariants[1] ? (isB2BMode ? rawVariants[1].b2bPrice : rawVariants[1].retailPrice) : boxPrice) * 1.15),
        unitPriceText: `(₹${boxPerKg}/kg)`,
        isCustomSynth: !rawVariants[1],
      },
      {
        id: rawVariants[2]?.id || `${product.id}_carton`,
        variantIndex: rawVariants[2] ? 2 : 0,
        label: `Carton (${cartonKg} kg)`,
        subtitleWeight: `${cartonKg} kg`,
        unitsInPack: 20,
        weightGrams: cartonKg * 1000,
        price: rawVariants[2] ? (isB2BMode ? rawVariants[2].b2bPrice : rawVariants[2].retailPrice) : cartonPrice,
        mrp: Math.round((rawVariants[2] ? (isB2BMode ? rawVariants[2].b2bPrice : rawVariants[2].retailPrice) : cartonPrice) * 1.15),
        unitPriceText: `(₹${cartonPerKg}/kg)`,
        isCustomSynth: !rawVariants[2],
      },
    ]
  }

  const activePack = packOptions[selectedVariantIndex] || packOptions[0]
  const activePrice = activePack.price
  const mrpPrice = activePack.mrp
  const savings = Math.max(0, mrpPrice - activePrice)
  const discountPercent = mrpPrice > activePrice ? Math.round(((mrpPrice - activePrice) / mrpPrice) * 100) : 15

  // Cart sync
  const cartItem = items.find((i) => i.variantId === activePack.id)
  const quantityInCart = cartItem ? cartItem.quantity : 0

  const handleAddToCart = () => {
    add({
      productId: product.id,
      variantId: activePack.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: mediaData.packetImage,
      packagingType: selectedVariantIndex === 0 ? 'SINGLE' : selectedVariantIndex === 1 ? 'BOX' : 'CARTON',
      weightGrams: activePack.weightGrams,
      unitsInPack: activePack.unitsInPack,
      skuCode: `SKU-${product.slug?.toUpperCase().slice(0, 8)}-${selectedVariantIndex}`,
      unitPrice: activePrice,
      quantity: selectedQuantity,
      lineTotal: activePrice * selectedQuantity,
    })
    showToast(`Added ${selectedQuantity} × ${activePack.label} to cart`, 'success')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:py-8 font-sans pb-28 md:pb-12">
      
      {/* ─── 1. BREADCRUMBS (Subtle, Clean 4px/8px Spacer System) ─── */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-4 sm:mb-6 flex-wrap">
        <Link href="/" className="hover:text-[#15803D] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/" className="hover:text-[#15803D] transition-colors">
          {product.category?.name || 'Frozen Food'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-semibold truncate max-w-[260px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* ─── 2. MAIN TWO-COLUMN BALANCED GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* ─── LEFT COLUMN: PRODUCT GALLERY (Clean soft aspect-square card) ─── */}
        <div className="lg:col-span-5 w-full">
          <ProductGallery
            productName={product.name}
            productSlug={product.slug}
            slides={gallerySlides}
            discountPercent={discountPercent}
            isVeg={product.isVeg !== false}
            brand={product.brand || 'McCain'}
            categoryName={product.category?.name || 'Frozen Food'}
          />
        </div>

        {/* ─── RIGHT COLUMN: PRODUCT SPECIFICATIONS & ACTIONS ─── */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Header Info: Brand, Title, Subtitle Weight, Description */}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-[#15803D]">
              {product.brand || 'McCain'}
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            <span className="text-lg font-bold text-slate-800">
              {activePack.subtitleWeight}
            </span>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
              {product.description || 'Crispy, golden fries made from high quality potatoes. Perfect for home & commercial use.'}
            </p>

            {/* Social Proof / Rating (Small, authentic, unpretentious) */}
            <div className="flex items-center gap-1.5 mt-2 cursor-pointer group">
              <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span className="text-xs font-bold text-slate-800">4.6</span>
              <span className="text-xs text-slate-500 font-medium group-hover:text-slate-700">
                (128 reviews)
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* ─── PRICING BLOCK (Matching Screenshot 2) ─── */}
          <div className="flex flex-col gap-1 border-t border-b border-slate-100 py-3.5">
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                ₹{activePrice.toFixed(2)}
              </span>
              {mrpPrice > activePrice && (
                <span className="text-base text-slate-400 font-normal line-through">
                  ₹{mrpPrice.toFixed(2)}
                </span>
              )}
              {savings > 0 && (
                <span className="bg-[#16A34A] text-white text-xs sm:text-sm font-bold px-3 py-1 rounded-lg shadow-2xs select-none">
                  Save ₹{savings}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-normal">
              Inclusive of all taxes
            </span>
          </div>

          {/* ─── SELECT PACK SIZE (Equal-Height Cards, Matching Screenshot 2) ─── */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2.5">
              Select Pack Size
            </h3>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {packOptions.map((pack, idx) => {
                const isSelected = selectedVariantIndex === idx
                return (
                  <button
                    key={pack.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedVariantIndex(idx)
                      setSelectedQuantity(1)
                    }}
                    className={`h-[94px] rounded-xl border text-left p-2.5 sm:p-3 flex flex-col justify-between transition-all select-none ${
                      isSelected
                        ? 'border-2 border-[#16A34A] bg-[#F0FDF4]/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 leading-tight truncate">
                      {pack.label}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                      ₹{pack.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                      {pack.unitPriceText}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ─── PURCHASE ROW (DESKTOP) ─── */}
          <div className="hidden md:flex items-center gap-3 pt-1">
            {/* Quantity Stepper */}
            <div className="flex items-center border border-slate-200 rounded-xl h-12 bg-white px-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-full flex items-center justify-center text-slate-600 hover:text-black transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>
              <span className="w-9 text-center font-bold text-slate-900 text-sm select-none">
                {selectedQuantity}
              </span>
              <button
                type="button"
                onClick={() => setSelectedQuantity((q) => q + 1)}
                className="w-9 h-full flex items-center justify-center text-slate-600 hover:text-black transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Add to Cart CTA */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 max-w-sm h-12 bg-[#15803D] hover:bg-[#166534] active:scale-98 text-white font-bold text-sm tracking-wide rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 select-none"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>ADD TO CART</span>
            </button>
          </div>

          {/* ─── CONSOLIDATED TRUST BAR (Matching Screenshot 3) ─── */}
          <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-2xs grid grid-cols-3 divide-x divide-slate-100 text-center my-1 select-none">
            <div className="flex flex-col items-center justify-center px-1">
              <Snowflake className="w-5 h-5 text-sky-500 mb-1" />
              <span className="text-xs font-bold text-slate-800 leading-tight">-18°C</span>
              <span className="text-[10px] text-slate-500 font-medium">Cold Chain</span>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <Truck className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="text-xs font-bold text-slate-800 leading-tight">Scheduled</span>
              <span className="text-[10px] text-slate-500 font-medium">Delivery</span>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="text-xs font-bold text-slate-800 leading-tight">Replacement</span>
              <span className="text-[10px] text-slate-500 font-medium">if any Issue</span>
            </div>
          </div>

          {/* ─── INTERACTIVE COLLAPSIBLE ACCORDIONS (Matching Screenshot 3) ─── */}
          <div className="flex flex-col divide-y divide-slate-100 border-t border-b border-slate-100">
            
            {/* 1. Description Accordion */}
            <div className="py-3">
              <button
                type="button"
                onClick={() => toggleAccordion('description')}
                className="w-full flex items-center justify-between text-left py-1 group select-none"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Description
                  </span>
                </div>
                {openAccordions.description ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                )}
              </button>
              {openAccordions.description && (
                <div className="pt-2 pl-7.5 pr-2 text-xs text-slate-600 leading-relaxed font-normal animate-fade-in">
                  {product.description || (
                    <>
                      {product.brand || 'McCain'} {product.name} are made from carefully selected potatoes, cut to perfection and quick frozen to lock in taste and quality. Ideal for home, cafes, hotels and food businesses.
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 2. Ingredients Accordion */}
            <div className="py-3">
              <button
                type="button"
                onClick={() => toggleAccordion('ingredients')}
                className="w-full flex items-center justify-between text-left py-1 group select-none"
              >
                <div className="flex items-center gap-2.5">
                  <Leaf className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Ingredients
                  </span>
                </div>
                {openAccordions.ingredients ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                )}
              </button>
              {openAccordions.ingredients && (
                <div className="pt-2 pl-7.5 pr-2 text-xs text-slate-600 leading-relaxed font-normal animate-fade-in">
                  {mediaData.ingredients || 'Potatoes, Edible Vegetable Oil (Palm), Dextrose, Salt, Stabilizer (E450, E451).'}
                </div>
              )}
            </div>

            {/* 3. Nutrition Facts Accordion */}
            <div className="py-3">
              <button
                type="button"
                onClick={() => toggleAccordion('nutrition')}
                className="w-full flex items-center justify-between text-left py-1 group select-none"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Nutrition Facts (Per 100 g)
                  </span>
                </div>
                {openAccordions.nutrition ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                )}
              </button>
              {openAccordions.nutrition && (
                <div className="pt-2 pl-7.5 pr-2 animate-fade-in">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Energy</span>
                      <span className="font-bold text-slate-800">{mediaData.nutrition.calories} kcal</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Protein</span>
                      <span className="font-bold text-slate-800">{mediaData.nutrition.protein}g</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Carbohydrates</span>
                      <span className="font-bold text-slate-800">{mediaData.nutrition.carbs}g</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Total Fat</span>
                      <span className="font-bold text-slate-800">{mediaData.nutrition.fat}g</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                      <span className="text-emerald-700 block text-[10px] font-semibold">Trans Fat</span>
                      <span className="font-bold text-emerald-800">0.0g ✓</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Sodium</span>
                      <span className="font-bold text-slate-800">{mediaData.nutrition.sodium}mg</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Cooking Guide Accordion */}
            <div className="py-3">
              <button
                type="button"
                onClick={() => toggleAccordion('cooking')}
                className="w-full flex items-center justify-between text-left py-1 group select-none"
              >
                <div className="flex items-center gap-2.5">
                  <Utensils className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Cooking Guide
                  </span>
                </div>
                {openAccordions.cooking ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                )}
              </button>
              {openAccordions.cooking && (
                <div className="pt-2 pl-7.5 pr-2 flex flex-col gap-2 animate-fade-in text-xs text-slate-600">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col gap-0.5">
                    <span className="font-bold text-slate-800 text-xs">Deep Fry (Classic)</span>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{mediaData.cooking.deepFry}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col gap-0.5">
                    <span className="font-bold text-slate-800 text-xs">Air Fry (Zero Oil)</span>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{mediaData.cooking.airFry}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col gap-0.5">
                    <span className="font-bold text-slate-800 text-xs">Oven Bake</span>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{mediaData.cooking.bake}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Storage Instructions Accordion */}
            <div className="py-3">
              <button
                type="button"
                onClick={() => toggleAccordion('storage')}
                className="w-full flex items-center justify-between text-left py-1 group select-none"
              >
                <div className="flex items-center gap-2.5">
                  <Snowflake className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Storage Instructions
                  </span>
                </div>
                {openAccordions.storage ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                )}
              </button>
              {openAccordions.storage && (
                <div className="pt-2 pl-7.5 pr-2 text-xs text-slate-600 leading-relaxed font-normal animate-fade-in">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Keep frozen at -18°C or below in deep freeze conditions.</li>
                    <li>Do not thaw before cooking — cook directly from the frozen state.</li>
                    <li>Do not refreeze once thawed. Seal tightly after opening.</li>
                  </ul>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ─── 3. MOBILE STICKY BOTTOM CHECKOUT BAR (Matching Screenshot 4) ─── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-xl flex items-center gap-3">
        {/* Quantity Stepper */}
        <div className="flex items-center border border-slate-200 rounded-xl h-12 bg-white px-1 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
            className="w-8 h-full flex items-center justify-center text-slate-600 active:text-black"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4 stroke-[2.5]" />
          </button>
          <span className="w-7 text-center font-bold text-slate-900 text-sm select-none">
            {selectedQuantity}
          </span>
          <button
            type="button"
            onClick={() => setSelectedQuantity((q) => q + 1)}
            className="w-8 h-full flex items-center justify-center text-slate-600 active:text-black"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 h-12 bg-[#15803D] active:bg-[#166534] text-white font-bold text-sm tracking-wide rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 select-none"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>ADD TO CART</span>
        </button>
      </div>

    </div>
  )
}
