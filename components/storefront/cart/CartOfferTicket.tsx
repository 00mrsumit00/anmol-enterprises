'use client'

import React from 'react'
import { Lock, Unlock, Check, Sparkles, ChevronRight, Tag } from 'lucide-react'
import confetti from 'canvas-confetti'

export interface CouponCardData {
  code: string
  description: string | null
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  maxDiscountAmount: number | null
  minOrderAmount: number
  status: 'UNLOCKED' | 'LOCKED' | 'DISALLOWED_STACKING' | 'INVALID'
  shortfall: number
  progressPercent: number
  potentialDiscount: number
  paymentConstraint?: 'ALL' | 'COD_ONLY' | 'ONLINE_ONLY'
  lockReason?: string
}

interface CartOfferTicketProps {
  coupons: CouponCardData[]
  appliedCouponCode: string | null
  onApplyCoupon: (code: string) => void
  onRemoveCoupon: () => void
  onViewAllOffers: () => void
  onAddItemsClick?: () => void
}

export default function CartOfferTicket({
  coupons,
  appliedCouponCode,
  onApplyCoupon,
  onRemoveCoupon,
  onViewAllOffers,
  onAddItemsClick,
}: CartOfferTicketProps) {
  if (!coupons || coupons.length === 0) return null

  const unlockedCount = coupons.filter((c) => c.status === 'UNLOCKED').length
  const totalCount = coupons.length

  // Pick top 1 or 2 relevant offers for the inline carousel/cards
  const displayCoupons = coupons.slice(0, 2)

  const handleApply = (code: string) => {
    confetti({
      particleCount: 90,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#0c831f', '#f59e0b', '#3b82f6', '#ec4899'],
    })
    onApplyCoupon(code)
  }

  return (
    <div className="space-y-2.5">
      {/* Header bar: "BEST OFFERS" + Unlocked Count + View All */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-orange-600" />
          <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-700">
            Best Offers
          </h4>
          <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100 px-1.5 py-0.2 rounded-full">
            {unlockedCount}/{totalCount} Unlocked
          </span>
        </div>

        <button
          onClick={onViewAllOffers}
          className="text-[11px] font-bold text-[#0c831f] hover:text-[#096918] flex items-center gap-0.5 transition"
        >
          <span>View all ({totalCount})</span>
          <ChevronRight className="w-3 h-3 stroke-[2.5]" />
        </button>
      </div>

      {/* Ticket Cards */}
      <div className="space-y-2">
        {displayCoupons.map((coupon) => {
          const isApplied = appliedCouponCode === coupon.code
          const isUnlocked = coupon.status === 'UNLOCKED'

          return (
            <div
              key={coupon.code}
              className={`relative rounded-2xl border transition-all overflow-hidden ${
                isApplied
                  ? 'bg-emerald-50/70 border-2 border-emerald-500 shadow-xs'
                  : isUnlocked
                  ? 'bg-gradient-to-r from-emerald-50/50 to-white border-2 border-[#0c831f] shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-white border-gray-200/90'
              }`}
            >
              {/* Ticket edge notch decorations */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#f4f6f8] rounded-full border border-gray-200 z-10" />
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#f4f6f8] rounded-full border border-gray-200 z-10" />

              <div className="p-3.5 pl-4 pr-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isApplied ? (
                        <div className="w-5 h-5 rounded-full bg-[#0c831f] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : isUnlocked ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Unlock className="w-3 h-3 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                          <Lock className="w-3 h-3 stroke-[2.5]" />
                        </div>
                      )}

                      <span className="font-mono font-black text-xs text-gray-900 border border-dashed border-gray-300 px-2 py-0.5 rounded-lg bg-gray-50">
                        {coupon.code}
                      </span>

                      <span className="text-[11px] font-black text-emerald-700">
                        {coupon.discountType === 'FIXED'
                          ? `Save ₹${coupon.discountValue}`
                          : `Save up to ₹${coupon.maxDiscountAmount || Math.round(coupon.discountValue * 5)}`}
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-500 font-medium mt-1 leading-tight">
                      {coupon.description || `Get discount on orders above ₹${coupon.minOrderAmount}`}
                    </p>
                  </div>

                  {/* Action button */}
                  {isApplied ? (
                    <button
                      onClick={onRemoveCoupon}
                      className="text-[11px] font-black text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition shrink-0"
                    >
                      Remove
                    </button>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => handleApply(coupon.code)}
                      className="text-[11px] font-black text-white bg-[#0c831f] hover:bg-[#096918] px-3 py-1 rounded-lg shadow-xs transition shrink-0 flex items-center gap-1 active:scale-95"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Apply</span>
                    </button>
                  ) : null}
                </div>

                {/* Locked State: Progress bar + Add items CTA */}
                {!isUnlocked && !isApplied && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500 font-semibold">
                        Add items worth <strong className="text-orange-600 font-black">₹{coupon.shortfall}</strong> to avail this offer
                      </span>
                      {onAddItemsClick && (
                        <button
                          onClick={onAddItemsClick}
                          className="font-black text-[#0c831f] hover:underline cursor-pointer"
                        >
                          + Add Items
                        </button>
                      )}
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                        style={{ width: `${coupon.progressPercent}%` }}
                      />
                    </div>
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
