'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Check, ArrowLeft, ShoppingBag, ArrowRight, Zap, ShieldCheck } from 'lucide-react'

interface OrderCelebrationModalProps {
  isOpen: boolean
  orderNumber: string
  totalAmount: number
  paymentMethod?: string
  deliverySlot?: string
  onExploreMore: () => void
  onTrackOrder: () => void
  onClose?: () => void
}

export const OrderCelebrationModal: React.FC<OrderCelebrationModalProps> = ({
  isOpen,
  orderNumber,
  totalAmount,
  paymentMethod = 'ONLINE_UPI',
  deliverySlot,
  onExploreMore,
  onTrackOrder,
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return

    // Multi-stage celebratory confetti bursts
    const fireConfetti = () => {
      // 1. Center cannon burst
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF6B00', '#FFD200', '#00A67E', '#4F46E5', '#FF4081']
      })

      // 2. Left side cannon
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0.05, y: 0.65 },
          colors: ['#FF6B00', '#FFD200', '#00A67E']
        })
      }, 200)

      // 3. Right side cannon
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 0.95, y: 0.65 },
          colors: ['#FFD200', '#00A67E', '#4F46E5']
        })
      }, 400)
    }

    fireConfetti()
  }, [isOpen])

  if (!isOpen) return null

  const isOnline = paymentMethod.includes('ONLINE') || paymentMethod.includes('UPI')

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 text-center"
        >
          {/* Top Decorative Confetti Wave Gradient */}
          <div className="h-32 bg-gradient-to-br from-brand-orange via-orange-500 to-brand-yellow relative flex items-center justify-center overflow-hidden">
            {/* Ambient glowing circles */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-xl" />
            <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-brand-yellow/30 rounded-full blur-xl" />

            {/* Pulsing Success Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', damping: 12, stiffness: 220 }}
              className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-emerald-400"
            >
              <div className="w-14 h-14 bg-gradient-to-tr from-[#00A67E] to-emerald-400 rounded-full flex items-center justify-center shadow-inner">
                <Check className="w-8 h-8 text-white stroke-[3.5]" />
              </div>
            </motion.div>
          </div>

          {/* Modal Content */}
          <div className="px-6 pt-6 pb-7">
            {/* Header / Celebration Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <span className="inline-block text-base font-black text-brand-orange uppercase tracking-wider bg-orange-50 px-3.5 py-1 rounded-full border border-orange-200/60 mb-2">
                Wohoooo! 🎉
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
                Payment Successful &amp;<br />Order is Placed!
              </h2>
              <p className="font-body text-xs text-gray-500 mt-2 max-w-xs mx-auto">
                Thank you for shopping with <strong className="text-gray-700">Anmol Enterprises</strong>. Your McCain frozen delights are booked and sent for express packing!
              </p>
            </motion.div>

            {/* Order Highlight Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-5 p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex flex-col gap-2.5 text-left text-xs font-body"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Order Number</span>
                <span className="font-display font-black text-gray-800 text-sm tracking-wide">
                  #{orderNumber}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Amount Paid</span>
                <span className="font-display font-black text-emerald-600 text-base">
                  ₹{Number(totalAmount).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                <span className="text-gray-400 font-medium">Payment Mode</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isOnline ? 'Verified UPI / Razorpay' : 'Cash on Delivery'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-gray-400 font-medium">Delivery</span>
                <span className="flex items-center gap-1 font-semibold text-brand-charcoal text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-brand-orange fill-brand-orange" />
                  Express 10-20 Mins Delivery
                </span>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-6 flex flex-col gap-2.5"
            >
              {/* PRIMARY: Explore More Products / Go Back to Store */}
              <button
                onClick={onExploreMore}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-orange to-orange-500 hover:from-brand-orange/95 hover:to-orange-500/95 text-white font-display font-black text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all transform active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Explore More Products</span>
                <ShoppingBag className="w-4 h-4" />
              </button>

              {/* SECONDARY: Track Order */}
              <button
                onClick={onTrackOrder}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gray-100 hover:bg-gray-200/80 text-gray-700 font-display font-bold text-xs transition-all active:scale-[0.98]"
              >
                <span>Track Live Order #{orderNumber}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
