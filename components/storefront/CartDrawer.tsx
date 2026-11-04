'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Minus, Share2, Timer, ArrowRight, Tag, Sparkles, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useCart } from '@/hooks/useCart'
import { getProductPacketImage, normalizeImageUrl } from '@/lib/productImages'
import { useToast } from '@/components/ui/Toast'
import CartDeliveryThreshold from './cart/CartDeliveryThreshold'
import CartOfferTicket, { CouponCardData } from './cart/CartOfferTicket'
import CartAddonsCarousel from './cart/CartAddonsCarousel'
import CartOffersModal from './cart/CartOffersModal'

export default function CartDrawer() {
  const router = useRouter()
  const { showToast } = useToast()
  const { items, total, count, isOpen, close, increment, decrement, remove, isB2BMode } = useCart()

  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('anmol_applied_coupon_code')
        if (saved) return saved
      } catch (e) {}
    }
    return null
  })
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false)
  const [isFirstOrder, setIsFirstOrder] = useState<boolean>(true)

  // Check logged in user status
  useEffect(() => {
    if (isOpen) {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            fetch('/api/orders')
              .then((r) => r.json())
              .then((orders) => {
                if (Array.isArray(orders) && orders.length > 0) {
                  setIsFirstOrder(false)
                } else {
                  setIsFirstOrder(true)
                }
              })
              .catch(() => setIsFirstOrder(true))
          } else {
            setIsFirstOrder(true)
          }
        })
        .catch(() => setIsFirstOrder(true))
    }
  }, [isOpen])

  // Real-time server pricing calculation
  const { data: pricingData, refetch: refetchPricing } = useQuery({
    queryKey: ['cart-pricing', items, isB2BMode, appliedCouponCode],
    queryFn: async () => {
      if (items.length === 0) return null
      const res = await fetch('/api/cart/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          isB2B: isB2BMode,
          couponCode: appliedCouponCode,
          paymentMethod: 'CASH_ON_DELIVERY',
        }),
      })
      if (!res.ok) throw new Error('Pricing failed')
      return res.json()
    },
    enabled: isOpen && items.length > 0,
    staleTime: 5000,
  })

  // Handle coupon apply/remove
  const handleApplyCoupon = (code: string) => {
    setAppliedCouponCode(code)
    try {
      localStorage.setItem('anmol_applied_coupon_code', code)
    } catch (e) {}
    showToast(`Coupon "${code}" applied!`, 'success')
  }

  const handleRemoveCoupon = () => {
    setAppliedCouponCode(null)
    try {
      localStorage.removeItem('anmol_applied_coupon_code')
    } catch (e) {}
    showToast('Coupon removed', 'info')
  }

  // Scroll to add-ons carousel
  const handleScrollToAddons = () => {
    const el = document.getElementById('cart-addons-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  // Checkout redirect
  const handleProceedToCheckout = async () => {
    // Save applied coupon for checkout page
    if (pricingData?.appliedCoupon) {
      try {
        localStorage.setItem('checkout_applied_coupon', JSON.stringify(pricingData.appliedCoupon))
      } catch (e) {}
    } else {
      try {
        localStorage.removeItem('checkout_applied_coupon')
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        close()
        router.push('/checkout')
      } else {
        showToast('Please login or register to complete your purchase.', 'warning')
        close()
        router.push('/account?redirect=/checkout')
      }
    } catch (e) {
      close()
      router.push('/account?redirect=/checkout')
    }
  }

  const handleShareCart = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Anmol Enterprises Cart',
        text: `Checkout my McCain frozen items cart! Total ₹${pricingData?.grandTotal || total}`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      alert('Cart link copied to clipboard!')
    }
  }

  if (!isOpen) return null

  // Pricing values fallback
  const subtotal = pricingData?.subtotal ?? total
  const originalSubtotal = pricingData?.originalSubtotal ?? total
  const mrpTotal = pricingData?.mrpTotal ?? Math.round(total * 1.15)
  const deliveryFee = pricingData?.delivery?.fee ?? (total > 500 ? 0 : 49)
  const convenienceFee = pricingData?.convenienceFee ?? 2
  const grandTotal = pricingData?.grandTotal ?? (total > 0 ? total + deliveryFee + convenienceFee : 0)
  const totalSavings = pricingData?.totalSavings ?? Math.max(0, mrpTotal - total)
  const campaignSavings = pricingData?.campaignSavings ?? 0
  const couponDiscount = pricingData?.appliedCoupon?.discount ?? 0
  const activeCampaign = pricingData?.activeCampaign
  const availableCoupons: CouponCardData[] = pricingData?.availableCoupons || []
  const isBelowMinOrder = pricingData?.isBelowMinOrder ?? false
  const minOrderShortfall = pricingData?.minOrderShortfall ?? 0

  return (
    <div className="fixed inset-0 z-[200] flex justify-end no-print font-sans">
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 animate-fade-in"
        onClick={close}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md h-full bg-[#f4f6f8] shadow-2xl flex flex-col justify-between z-10 animate-slide-left border-l border-gray-200">
        
        {/* 1. HEADER BAR */}
        <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={close}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-extrabold text-base text-gray-900">
              My Cart {count > 0 && `(${count})`}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Header Coupons Button */}
            {items.length > 0 && availableCoupons.length > 0 && (
              <button
                onClick={() => setIsOffersModalOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:bg-orange-50 px-2.5 py-1 rounded-lg transition-colors border border-orange-200"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Offers</span>
                <span className="text-[10px] bg-orange-600 text-white font-extrabold px-1 rounded-full">
                  {availableCoupons.length}
                </span>
              </button>
            )}

            <button 
              onClick={handleShareCart}
              className="flex items-center gap-1 text-xs font-bold text-[#0c831f] hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* 2. TOP SAVINGS CELEBRATION STRIP */}
        {items.length > 0 && totalSavings > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 text-emerald-800 px-4 py-2 text-xs font-black flex items-center justify-between border-b border-emerald-200/60 shrink-0">
            <span className="flex items-center gap-1.5">
              <span>🎉</span>
              <span>
                You saved <strong className="text-emerald-700 font-black">₹{totalSavings}</strong> on this order!
              </span>
            </span>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              SAVINGS UNLOCKED
            </span>
          </div>
        )}

        {/* 3. CART CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 select-none">
              <span className="text-6xl">🍟</span>
              <h4 className="font-extrabold text-base text-gray-900 mt-4">
                Your cart is empty
              </h4>
              <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                Explore McCain french fries, smiles, and cheesy bites to get started.
              </p>
              <button
                onClick={close}
                className="mt-6 bg-[#0c831f] text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md hover:bg-[#096918] transition-all"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <>
              {/* Delivery Threshold Progress Banner (₹500 threshold after discounts) */}
              <CartDeliveryThreshold
                subtotal={subtotal}
                freeDeliveryThreshold={500}
                isFirstOrder={isFirstOrder}
              />

              {/* Unlockable Offer Cards ("0/2 Unlocked" Domino's-style) */}
              <CartOfferTicket
                coupons={availableCoupons}
                appliedCouponCode={appliedCouponCode}
                onApplyCoupon={handleApplyCoupon}
                onRemoveCoupon={handleRemoveCoupon}
                onViewAllOffers={() => setIsOffersModalOpen(true)}
                onAddItemsClick={handleScrollToAddons}
              />

              {/* Add-Ons Upsell Carousel (Available McCain Fries, Smiles, Cheesy Bites, Veggie Nuggets) */}
              <CartAddonsCarousel
                campaignDiscountValue={activeCampaign?.discountValue || 10}
                isCampaignActive={Boolean(activeCampaign)}
              />

              {/* Cart Items List */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1 block">
                  Items in Cart ({count})
                </span>

                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs divide-y divide-gray-100">
                  {items.map((item) => {
                    const itemMrp = Math.round(item.unitPrice * 1.15)
                    const itemImage = normalizeImageUrl(getProductPacketImage(item.productSlug, item.imageUrl))
                    
                    // Match calculated pricing item if available
                    const calculatedItem = pricingData?.items?.find((p: any) => p.variantId === item.variantId)
                    const effectivePrice = calculatedItem?.effectiveUnitPrice ?? item.unitPrice
                    const regularPrice = calculatedItem?.regularUnitPrice ?? item.unitPrice
                    const hasDiscount = effectivePrice < regularPrice

                    return (
                      <div key={item.variantId} className="p-3.5 flex items-center gap-3">
                        {/* Real Product Packet Image */}
                        <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={itemImage}
                            alt={item.productName}
                            className="w-full h-full object-contain drop-shadow-2xs"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-gray-900 truncate">
                            {item.productName}
                          </h5>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                            {item.weightGrams >= 1000 ? `${(item.weightGrams / 1000).toFixed(1)} kg` : `${item.weightGrams} g`}
                          </p>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-xs font-black text-gray-900">
                              ₹{effectivePrice}
                            </span>
                            {hasDiscount ? (
                              <span className="text-[10px] text-orange-600 line-through">
                                ₹{regularPrice}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 line-through">
                                ₹{itemMrp}
                              </span>
                            )}
                            {hasDiscount && activeCampaign && (
                              <span className="text-[8px] font-black text-orange-700 bg-orange-100 px-1 py-0.2 rounded">
                                {activeCampaign.badgeText || 'SALE'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stepper Button */}
                        <div className="bg-[#0c831f] text-white rounded-lg flex items-center justify-between min-w-[70px] h-7 px-1 shadow-xs shrink-0 select-none">
                          <button
                            onClick={() => decrement(item.variantId)}
                            className="w-5 h-5 flex items-center justify-center hover:bg-black/10 rounded transition-colors"
                          >
                            <Minus className="w-3 h-3 stroke-[3]" />
                          </button>
                          <span className="text-xs font-black px-1 text-center min-w-[14px]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => increment(item.variantId)}
                            className="w-5 h-5 flex items-center justify-center hover:bg-black/10 rounded transition-colors"
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Bill Details Breakdown */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col gap-2.5">
                <h4 className="text-xs font-black text-gray-900 border-b border-gray-100 pb-2">
                  Bill details
                </h4>

                {/* MRP and Items total */}
                <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span>Items total</span>
                    {totalSavings > 0 && (
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Saved ₹{totalSavings}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-gray-400 line-through text-[11px]">₹{mrpTotal}</span>
                    <span className="font-extrabold text-gray-900">₹{originalSubtotal}</span>
                  </div>
                </div>

                {/* Active Campaign Festive Discount */}
                {campaignSavings > 0 && activeCampaign && (
                  <div className="flex justify-between items-center text-xs text-orange-600 font-bold">
                    <span className="flex items-center gap-1">
                      <span>🪔</span>
                      <span>{activeCampaign.name} ({activeCampaign.discountValue}% OFF)</span>
                    </span>
                    <span>-₹{campaignSavings}</span>
                  </div>
                )}

                {/* Coupon Discount */}
                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>Coupon ({appliedCouponCode})</span>
                    </span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}

                {/* Delivery Fee */}
                <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span>Delivery charge</span>
                    {deliveryFee === 0 && (
                      <span className="text-[9px] font-black text-[#0c831f] bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                        Free Express
                      </span>
                    )}
                  </div>
                  <span className={deliveryFee === 0 ? 'text-[#0c831f] font-extrabold' : 'font-extrabold text-gray-900'}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>

                {/* Convenience Fee */}
                <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                  <span>Convenience fee</span>
                  <span className="font-extrabold text-gray-900">₹{convenienceFee}</span>
                </div>

                <div className="h-px bg-gray-100 my-1" />

                {/* Grand Total */}
                <div className="flex justify-between items-center text-sm font-black text-gray-900">
                  <span>Grand total</span>
                  <span className="text-[#0c831f] font-black text-base">₹{grandTotal}</span>
                </div>
              </div>

              {/* Minimum Order Warning Bar if below min order */}
              {isBelowMinOrder && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center gap-2.5 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-[11px] font-bold">
                    Add items worth <span className="font-black text-amber-950">₹{minOrderShortfall}</span> more to meet minimum order value.
                  </p>
                </div>
              )}
            </>
          )}

        </div>

        {/* 4. STICKY BOTTOM CHECKOUT CTA BAR WITH SAVINGS CELEBRATION */}
        {items.length > 0 && (
          <div className="p-3 bg-white border-t border-gray-200 shrink-0 space-y-2">
            {/* Sticky Celebration Pill */}
            {totalSavings > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black py-1 px-3 rounded-xl flex items-center justify-between">
                <span>% You saved ₹{totalSavings} on this order!</span>
                <span className="text-xs">🥳</span>
              </div>
            )}

            <button
              onClick={handleProceedToCheckout}
              disabled={isBelowMinOrder}
              className={`w-full font-extrabold py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-between active:scale-98 transition-all ${
                isBelowMinOrder
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-[#0c831f] hover:bg-[#096918] text-white'
              }`}
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-base font-black">₹{grandTotal}</span>
                <span className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider">
                  TOTAL AMOUNT
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-black">
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </div>
            </button>
          </div>
        )}

      </div>

      {/* Offers & Coupons Bottom Sheet Modal */}
      <CartOffersModal
        isOpen={isOffersModalOpen}
        onClose={() => setIsOffersModalOpen(false)}
        coupons={availableCoupons}
        appliedCouponCode={appliedCouponCode}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
      />

    </div>
  )
}
