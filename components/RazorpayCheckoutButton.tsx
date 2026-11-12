'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface PrefillInfo {
  name?: string
  email?: string
  contact?: string
}

export interface RazorpayCheckoutButtonProps {
  amount: number // in INR (e.g. 500 = ₹500) or paise
  isAmountInPaise?: boolean
  currency?: string
  orderId?: string
  receipt?: string
  name?: string
  description?: string
  image?: string
  prefill?: PrefillInfo
  themeColor?: string
  buttonText?: React.ReactNode
  className?: string
  disabled?: boolean
  onSuccess?: (data: { payment_id: string; order_id: string; signature: string }) => void
  onFailure?: (error: any) => void
  onDismiss?: () => void
}

export default function RazorpayCheckoutButton({
  amount,
  isAmountInPaise = false,
  currency = 'INR',
  orderId,
  receipt,
  name = 'Anmol Enterprises',
  description = 'Online Order Payment',
  image = '/icon-192.png',
  prefill,
  themeColor = '#FF6B00',
  buttonText,
  className = '',
  disabled = false,
  onSuccess,
  onFailure,
  onDismiss,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  // Dynamically load Razorpay SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  const handleCheckout = async () => {
    if (loading || disabled) return
    setLoading(true)

    try {
      // 1. Calculate amount in paise (minimum 100 paise = ₹1.00)
      const amountInPaise = isAmountInPaise ? Math.round(amount) : Math.round(amount * 100)

      if (amountInPaise < 100) {
        throw new Error('Minimum payment amount must be at least ₹1.00 (100 paise)')
      }

      // 2. Ensure script is ready
      if (typeof window !== 'undefined' && !(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
          document.body.appendChild(s)
        })
      }

      // 3. Call backend to create Razorpay Order
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
          orderId,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize payment order')
      }

      const keyId = data.key_id || data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

      // 4. Open Razorpay Standard Checkout Modal
      const options = {
        key: keyId,
        amount: data.amount,
        currency: data.currency || currency,
        name,
        description,
        image,
        order_id: data.order_id || data.razorpayOrderId,
        prefill: {
          name: prefill?.name || '',
          email: prefill?.email || '',
          contact: prefill?.contact || '',
        },
        theme: {
          color: themeColor,
        },
        handler: async function (response: any) {
          try {
            showToast('Verifying payment signature with bank...', 'info')
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                orderId,
              }),
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Payment signature verification failed')
            }

            showToast('Payment successful & verified!', 'success')
            if (onSuccess) {
              onSuccess({
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature,
              })
            }
          } catch (verErr: any) {
            console.error('Signature verification error:', verErr)
            showToast(verErr.message || 'Payment signature verification failed', 'error')
            if (onFailure) onFailure(verErr)
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            showToast('Payment window cancelled', 'warning')
            setLoading(false)
            if (onDismiss) onDismiss()
          },
        },
      }

      const rzpInstance = new (window as any).Razorpay(options)

      rzpInstance.on('payment.failed', function (resp: any) {
        const errorDesc = resp.error?.description || resp.error?.reason || 'Payment failed'
        console.error('Razorpay payment.failed event:', resp)
        showToast(errorDesc, 'error')
        setLoading(false)
        if (onFailure) onFailure(resp.error)
      })

      rzpInstance.open()
    } catch (err: any) {
      console.error('Checkout error:', err)
      showToast(err.message || 'Payment initialization failed', 'error')
      setLoading(false)
      if (onFailure) onFailure(err)
    }
  }

  const defaultButtonContent = (
    <>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4" />
      )}
      <span>
        {loading
          ? 'Connecting Gateway...'
          : `Pay ₹${isAmountInPaise ? (amount / 100).toFixed(2) : amount.toFixed(2)} Securely`}
      </span>
    </>
  )

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading || disabled}
      className={
        className ||
        'w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 active:scale-98 transition disabled:opacity-50 disabled:pointer-events-none'
      }
    >
      {buttonText || defaultButtonContent}
    </button>
  )
}
