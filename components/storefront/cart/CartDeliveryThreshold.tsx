'use client'

import React from 'react'
import { Truck, CheckCircle2, Sparkles } from 'lucide-react'

interface CartDeliveryThresholdProps {
  subtotal: number
  freeDeliveryThreshold?: number
  isFirstOrder?: boolean
}

export default function CartDeliveryThreshold({
  subtotal,
  freeDeliveryThreshold = 500,
  isFirstOrder = false,
}: CartDeliveryThresholdProps) {
  const isFree = isFirstOrder || subtotal >= freeDeliveryThreshold
  const shortfall = Math.max(0, Math.round(freeDeliveryThreshold - subtotal))
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100))

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-xs overflow-hidden">
      {isFree ? (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
              <span>🎉 You unlocked FREE Express Delivery!</span>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                (Saved ₹49)
              </span>
            </h4>
            <p className="text-[10px] text-gray-500 font-medium">
              {isFirstOrder
                ? 'Welcome gift: Zero delivery charge on your first order.'
                : `Enjoy 10-30 min cold-chain delivery on orders above ₹${freeDeliveryThreshold}.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Truck className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <p className="text-xs font-black text-gray-900 truncate">
                Add items worth <span className="text-orange-600 font-extrabold">₹{shortfall}</span> to unlock <span className="text-emerald-700">FREE Express Delivery! 🚚💨</span>
              </p>
            </div>
            <span className="text-[10px] font-black text-gray-400 shrink-0">
              {progressPercent}%
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500 rounded-full transition-all duration-400 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
