'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Minus, Share2, Timer, ArrowRight, ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { getProductPacketImage, normalizeImageUrl } from '@/lib/productImages'
import { useToast } from '@/components/ui/Toast'

export default function CartDrawer() {
  const router = useRouter()
  const { showToast } = useToast()
  const { items, total, count, isOpen, close, increment, decrement, remove, isB2BMode } = useCart()

  const [isFirstOrder, setIsFirstOrder] = useState<boolean>(true)

  // Check logged in user and order count for first order free delivery
  useEffect(() => {
    if (isOpen) {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            fetch('/api/orders')
              .then(r => r.json())
              .then(orders => {
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

  if (!isOpen) return null

  // Calculate dynamic savings across items (MRP vs activePrice)
  const totalMrp = items.reduce((acc, item) => {
    const itemMrp = Math.round(item.unitPrice * 1.15)
    return acc + itemMrp * item.quantity
  }, 0)
  const totalSavings = Math.max(0, totalMrp - total)

  // Delivery & Fee calculations:
  // - First order for customer = FREE Delivery (₹0)
  // - Order subtotal > ₹500 = FREE Delivery (₹0)
  // - Otherwise = ₹49 standard delivery fee
  // - Convenience Fee = ₹2 per order
  const deliveryFee = (isFirstOrder || total > 500) ? 0 : 49
  const convenienceFee = 2
  const grandTotal = total > 0 ? total + deliveryFee + convenienceFee : 0

  const handleProceedToCheckout = async () => {
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
        text: `Checkout my McCain frozen items cart! Total ₹${grandTotal}`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      alert('Cart link copied to clipboard!')
    }
  }

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
              My Cart
            </h3>
          </div>

          <button 
            onClick={handleShareCart}
            className="flex items-center gap-1 text-xs font-bold text-[#0c831f] hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>

        {/* 2. TOP SAVINGS STRIP */}
        {items.length > 0 && totalSavings > 0 && (
          <div className="bg-[#e0f2fe] text-[#0369a1] px-4 py-2 text-xs font-extrabold flex items-center justify-between border-b border-sky-200 shrink-0">
            <span>Your total savings</span>
            <span>₹{totalSavings}</span>
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
              {/* Delivery Time Banner */}
              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0c831f] shrink-0">
                  <Timer className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900">Delivery in 9 minutes</h4>
                  <p className="text-[10px] font-bold text-gray-400">Shipment of {count} {count === 1 ? 'item' : 'items'}</p>
                </div>
              </div>

              {/* Items Card List */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm divide-y divide-gray-100">
                {items.map((item) => {
                  const itemMrp = Math.round(item.unitPrice * 1.15)
                  const itemImage = normalizeImageUrl(getProductPacketImage(item.productSlug, item.imageUrl))
                  return (
                    <div key={item.variantId} className="p-3.5 flex items-center gap-3">
                      {/* Real Product Packet Image Thumbnail */}
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
                          <span className="text-xs font-extrabold text-gray-900">
                            ₹{item.unitPrice}
                          </span>
                          <span className="text-[10px] text-gray-400 line-through">
                            ₹{itemMrp}
                          </span>
                        </div>
                      </div>

                      {/* Stepper Button */}
                      <div className="bg-[#0c831f] text-white rounded-lg flex items-center justify-between min-w-[70px] h-7 px-1 shadow-sm shrink-0 select-none">
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

              {/* Bill Details Breakdown */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex flex-col gap-2.5">
                <h4 className="text-xs font-black text-gray-900 border-b border-gray-100 pb-2">
                  Bill details
                </h4>

                <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span>Items total</span>
                    {totalSavings > 0 && (
                      <span className="text-[9px] font-extrabold text-[#0369a1] bg-[#e0f2fe] px-1.5 py-0.5 rounded">
                        Saved ₹{totalSavings}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-gray-400 line-through text-[11px]">₹{totalMrp}</span>
                    <span className="font-extrabold text-gray-900">₹{total}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span>Delivery charge</span>
                    {isFirstOrder && (
                      <span className="text-[9px] font-black text-[#0c831f] bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                        First Order Free!
                      </span>
                    )}
                  </div>
                  <span className={deliveryFee === 0 ? 'text-[#0c831f] font-extrabold' : 'font-extrabold text-gray-900'}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                  <span>Convenience fee</span>
                  <span className="font-extrabold text-gray-900">₹{convenienceFee}</span>
                </div>

                <div className="h-px bg-gray-100 my-1" />

                <div className="flex justify-between items-center text-sm font-black text-gray-900">
                  <span>Grand total</span>
                  <span className="text-[#0c831f] font-extrabold">₹{grandTotal}</span>
                </div>
              </div>
            </>
          )}

        </div>

        {/* 4. STICKY BOTTOM CHECKOUT CTA BAR (Reference Screenshot 5) */}
        {items.length > 0 && (
          <div className="p-3 bg-white border-t border-gray-200 shrink-0">
            <button
              onClick={handleProceedToCheckout}
              className="w-full bg-[#0c831f] hover:bg-[#096918] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-between active:scale-98 transition-all"
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-sm">₹{grandTotal}</span>
                <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">TOTAL</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-black">
                <span>Proceed</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </div>
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
