'use client'

import React, { useState } from 'react'
import { X, Tag, Sparkles, Check, Lock, ArrowRight } from 'lucide-react'
import confetti from 'canvas-confetti'
import { CouponCardData } from './CartOfferTicket'

interface CartOffersModalProps {
  isOpen: boolean
  onClose: () => void
  coupons: CouponCardData[]
  appliedCouponCode: string | null
  onApplyCoupon: (code: string) => void
  onRemoveCoupon: () => void
}

export default function CartOffersModal({
  isOpen,
  onClose,
  coupons,
  appliedCouponCode,
  onApplyCoupon,
  onRemoveCoupon,
}: CartOffersModalProps) {
  const [customInput, setCustomInput] = useState('')

  if (!isOpen) return null

  const handleApply = (code: string) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0c831f', '#f59e0b', '#3b82f6', '#ec4899'],
    })
    onApplyCoupon(code)
    onClose()
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customInput.trim()) return
    handleApply(customInput.trim().toUpperCase())
  }

  return (
    <div className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 z-10 max-h-[85vh] flex flex-col overflow-hidden animate-slide-up sm:animate-zoom-in">
        
        {/* Header */}
        <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-orange-100 text-orange-600 rounded-xl">
              <Tag className="w-4 h-4" />
            </span>
            <h3 className="font-black text-sm text-gray-900">Coupons & Exclusive Offers</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Custom Code Input */}
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 px-3.5 py-2.5 text-xs font-mono font-bold uppercase rounded-xl border border-gray-300 focus:outline-none focus:border-[#0c831f] bg-gray-50"
            />
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="px-4 py-2.5 bg-[#0c831f] hover:bg-[#096918] disabled:bg-gray-200 disabled:text-gray-400 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
            >
              Apply
            </button>
          </form>

          {/* Offer Cards List */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              Available Promo Offers ({coupons.length})
            </span>

            {coupons.map((coupon) => {
              const isApplied = appliedCouponCode === coupon.code
              const isUnlocked = coupon.status === 'UNLOCKED'

              return (
                <div
                  key={coupon.code}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isApplied
                      ? 'bg-emerald-50/80 border-emerald-400 shadow-xs'
                      : isUnlocked
                      ? 'bg-white border-emerald-300 hover:border-emerald-400'
                      : 'bg-gray-50/60 border-gray-200 opacity-90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-gray-900 border border-dashed border-gray-300 px-2 py-0.5 rounded-lg bg-white">
                          {coupon.code}
                        </span>
                        <span className="text-xs font-black text-emerald-700">
                          {coupon.discountType === 'FIXED'
                            ? `Save ₹${coupon.discountValue}`
                            : `${coupon.discountValue}% OFF`}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 font-medium mt-1">
                        {coupon.description || `Applicable on orders above ₹${coupon.minOrderAmount}`}
                      </p>

                      <p className="text-[10px] text-gray-400 font-semibold mt-1">
                        Min Order: ₹{coupon.minOrderAmount}{coupon.paymentConstraint ? ` • ${coupon.paymentConstraint.replace('_', ' ')}` : ''}
                      </p>
                    </div>

                    {/* Button */}
                    {isApplied ? (
                      <button
                        onClick={onRemoveCoupon}
                        className="text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl transition shrink-0"
                      >
                        Remove
                      </button>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => handleApply(coupon.code)}
                        className="text-xs font-black text-white bg-[#0c831f] hover:bg-[#096918] px-3.5 py-1.5 rounded-xl shadow-xs transition shrink-0"
                      >
                        Apply
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-xl shrink-0">
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </div>
                    )}
                  </div>

                  {/* Shortfall info for locked */}
                  {!isUnlocked && !isApplied && (
                    <div className="mt-2 pt-2 border-t border-gray-200/60 text-[10px] text-gray-500 font-medium flex items-center justify-between">
                      <span>Add items worth <strong className="text-orange-600">₹{coupon.shortfall}</strong> more to unlock</span>
                      <span className="font-bold text-gray-400">{coupon.progressPercent}%</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>

      </div>
    </div>
  )
}
