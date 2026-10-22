'use client'

import React, { useState } from 'react'
import { Star, X, Sparkles, CheckCircle2, ShieldCheck, Heart } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useToast } from '@/components/ui/Toast'

interface OrderDeliveredReviewModalProps {
  isOpen: boolean
  order: {
    id: string
    orderNumber: string
    totalAmount?: number
  } | null
  isFirstOrder?: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function OrderDeliveredReviewModal({
  isOpen,
  order,
  isFirstOrder = false,
  onClose,
  onSuccess
}: OrderDeliveredReviewModalProps) {
  const { showToast } = useToast()
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [serviceGrade, setServiceGrade] = useState<'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR'>('EXCELLENT')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !order) return null

  const handleStarClick = (num: number) => {
    setRating(num)
    if (num >= 4) setServiceGrade('EXCELLENT')
    else if (num === 3) setServiceGrade('GOOD')
    else setServiceGrade('AVERAGE')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          serviceGrade,
          comment: comment.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        })
      } catch {}

      showToast('🎉 Thank you for rating! Your review has been saved.', 'success')
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      showToast(err.message || 'Error submitting review', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 flex flex-col gap-4 text-center">
        
        {/* Close Button (Hidden on First Order to make review mandatory) */}
        {!isFirstOrder && (
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
            aria-label="Close review modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top Celebration Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
          <Sparkles className="w-8 h-8" />
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Order Delivered
            </span>
            {isFirstOrder && (
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                1st Order Review
              </span>
            )}
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 mt-2">
            Rate Your Experience
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {isFirstOrder
              ? `Welcome to Anmol Enterprises! Since this is your first delivery (Order #${order.orderNumber}), please share your feedback so we can serve you best!`
              : `Order #${order.orderNumber} has arrived! How was the freshness and delivery service?`}
          </p>
        </div>

        {/* Star Rating Selector */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const activeStar = (hoverRating !== null ? hoverRating : rating) >= star
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => handleStarClick(star)}
                className="p-1 text-3xl transition-transform hover:scale-125 focus:outline-none"
                title={`${star} Stars`}
              >
                <Star
                  className={`w-9 h-9 transition-colors ${
                    activeStar
                      ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            )
          })}
        </div>

        {/* Service Grade Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {[
            { grade: 'EXCELLENT', label: '⭐ Excellent' },
            { grade: 'GOOD', label: '👍 Good' },
            { grade: 'AVERAGE', label: '😐 Average' },
            { grade: 'POOR', label: '👎 Needs Improvement' }
          ].map((item) => (
            <button
              key={item.grade}
              type="button"
              onClick={() => setServiceGrade(item.grade as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                serviceGrade === item.grade
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Optional Review Comment */}
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional: How was the temperature, crispiness, or rider service?"
          className="w-full text-xs p-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
          maxLength={500}
        />

        {/* Submit & Cancel Buttons */}
        <div className="flex items-center gap-3 mt-1">
          {!isFirstOrder && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              Later
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`${isFirstOrder ? 'w-full' : 'flex-[2]'} py-3 text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/20 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
