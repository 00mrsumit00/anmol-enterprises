'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Clock, ShieldCheck, MapPin, Truck, CheckCircle2, ChevronRight, Phone, CreditCard, AlertCircle, ShoppingBag } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { useToast } from '@/components/ui/Toast'
import { OrderCelebrationModal } from '@/components/storefront/OrderCelebrationModal'

function OrderTrackingContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [order, setOrder] = useState<any>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  // Fetch initial order details
  const { data: initialOrder, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) throw new Error('Order not found')
      return res.json()
    }
  })

  // Synchronize initial query load to local state
  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder)
      if (searchParams.get('celebrate') === '1') {
        setShowCelebration(true)
      }
    }
  }, [initialOrder, searchParams])

  // Connect Socket.io client and join order room for live updates
  const socket = useSocket()

  useEffect(() => {
    if (!socket || !orderId) return

    // Join room specifically for this order
    socket.emit('join_order', orderId)

    // Listen to real-time status updates
    socket.on('order_status_update', (updatedOrder: any) => {
      if (updatedOrder.id === orderId) {
        setOrder(updatedOrder)
        showToast(`Order status updated to: ${updatedOrder.status}`, 'info')
        queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      }
    })

    return () => {
      socket.off('order_status_update')
    }
  }, [socket, orderId, queryClient, showToast])

  const [isActionLoading, setIsActionLoading] = useState(false)

  const handleRetryPayment = async () => {
    if (!order || isActionLoading) return
    setIsActionLoading(true)
    showToast('Connecting to payment gateway...', 'info')

    try {
      const rzpRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      })

      const rzpData = await rzpRes.json()
      if (!rzpRes.ok) {
        throw new Error(rzpData.error || 'Failed to initialize payment')
      }

      if (rzpData.isMock) {
        const confirmMock = window.confirm(
          `[DEV TEST MODE] Simulate successful payment for order #${order.orderNumber}?`
        )
        if (confirmMock) {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              razorpay_order_id: rzpData.razorpayOrderId,
              razorpay_payment_id: `pay_mock_${Date.now()}`,
              razorpay_signature: 'mock_signature'
            })
          })
          if (verifyRes.ok) {
            showToast('Payment successful!', 'success')
            setShowCelebration(true)
            queryClient.invalidateQueries({ queryKey: ['order', orderId] })
            return
          }
        }
        setIsActionLoading(false)
        return
      }

      if (!(window as any).Razorpay) {
        await new Promise((resolve) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = resolve
          document.body.appendChild(s)
        })
      }

      const options = {
        key: rzpData.keyId,
        amount: rzpData.amount,
        currency: rzpData.currency || 'INR',
        name: 'Anmol Frozen Express',
        description: `Order #${order.orderNumber} Payment`,
        image: '/images/logo.png',
        order_id: rzpData.razorpayOrderId,
        theme: { color: '#FF6B00' },
        handler: async function (response: any) {
          showToast('Verifying payment...', 'info')
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          })
          if (verifyRes.ok) {
            showToast('Payment verified successfully!', 'success')
            setShowCelebration(true)
            queryClient.invalidateQueries({ queryKey: ['order', orderId] })
          } else {
            showToast('Payment verification failed', 'error')
          }
        },
        modal: {
          ondismiss: function () {
            showToast('Payment window closed.', 'warning')
          }
        }
      }

      const rzpInstance = new (window as any).Razorpay(options)
      rzpInstance.open()
    } catch (err: any) {
      showToast(err.message || 'Payment retry failed', 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSwitchToCod = async () => {
    if (!order || isActionLoading) return
    const confirmSwitch = window.confirm(
      `Switch order #${order.orderNumber} to Cash on Delivery (COD)?\n\nYou can pay ₹${order.totalAmount} upon arrival.`
    )
    if (!confirmSwitch) return

    setIsActionLoading(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/switch-to-cod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Switched to Cash on Delivery!', 'success')
        setOrder(data.order)
        queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      } else {
        showToast(data.error || 'Failed to switch to COD', 'error')
      }
    } catch (err: any) {
      showToast('Network error while switching to COD', 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  if (isLoading || !order) {
    return (
      <div className="max-w-xl mx-auto py-12 flex flex-col items-center justify-center gap-4 text-center select-none no-print">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        <p className="font-body text-xs text-gray-400 font-semibold tracking-wider uppercase">
          Loading Order Tracking...
        </p>
      </div>
    )
  }

  // Determine active timeline steps based on status
  const getTimelineState = (status: string) => {
    const steps = [
      { key: 'CONFIRMED', label: 'Order Confirmed', timeKey: 'createdAt' },
      { key: 'PACKED', label: 'Packed & Ready', timeKey: 'packedAt', subtext: 'Cold storage packing done' },
      { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', timeKey: 'dispatchedAt', subtext: 'In temperature-controlled van' },
      { key: 'DELIVERED', label: 'Delivered', timeKey: 'deliveredAt' }
    ]

    let activeStepIdx = 0
    if (status === 'PENDING' || status === 'CONFIRMED') activeStepIdx = 0
    else if (status === 'PACKING' || status === 'PACKED') activeStepIdx = 1
    else if (status === 'ASSIGNED' || status === 'OUT_FOR_DELIVERY') activeStepIdx = 2
    else if (status === 'DELIVERED') activeStepIdx = 3

    return { steps, activeStepIdx }
  }

  const isCancelled = order.status === 'CANCELLED'
  const { steps, activeStepIdx } = getTimelineState(order.status)

  // Format date / slot helpers
  const formattedDeliveryDate = new Date(order.deliveryDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  })

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6 font-body">
      
      {/* Quick Store Return Navigation */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 py-2 px-3.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-brand-orange text-xs font-display font-black border border-orange-200/80 transition-all tap-scale shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Explore More Products</span>
          <ShoppingBag className="w-3.5 h-3.5 ml-0.5 opacity-90" />
        </button>

        <button
          onClick={() => router.push('/account')}
          className="text-xs text-gray-500 hover:text-brand-charcoal font-semibold underline underline-offset-4 transition-colors"
        >
          My Orders
        </button>
      </div>

      {/* 1. Dark Header */}
      <div className="bg-brand-charcoal text-white -mx-4 px-4 py-5 md:mx-0 md:px-6 md:rounded-card flex items-center justify-between gap-3 shadow-xl no-print">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/')} 
            className="p-1.5 hover:bg-white/10 rounded-pill transition-colors tap-scale"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-display text-sm sm:text-base font-black">
              #{order.orderNumber}
            </h2>
            <p className="text-[10px] text-brand-yellow font-bold uppercase tracking-wider mt-0.5">
              Live Order Status
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-pill shadow-md border ${
          isCancelled ? 'bg-red-500/10 border-red-500 text-red-500' :
          order.status === 'DELIVERED' ? 'bg-[#00A67E]/10 border-[#00A67E] text-[#00A67E]' :
          'bg-brand-orange text-white border-brand-orange pulse-glow'
        }`}>
          {order.status}
        </span>
      </div>

      {/* ETA Card with Cold Chain Protection */}
      {!isCancelled && order.status !== 'DELIVERED' && (
        <div className="bg-brand-orange-light border border-brand-orange/15 rounded-card p-4 flex items-center justify-between shadow-sm no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-orange text-white rounded-card">
              <Truck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Requested Slot
              </p>
              <p className="text-sm font-bold text-brand-charcoal mt-0.5">
                {formattedDeliveryDate}
              </p>
              <p className="text-[11px] text-brand-orange font-bold uppercase tracking-wide">
                {order.deliverySlot === 'MORNING' ? '🌅 Morning (9am - 1pm)' : '🌆 Evening (4pm - 8pm)'}
              </p>
            </div>
          </div>
          
          {/* Driver details if assigned */}
          {order.driver && (
            <div className="text-right border-l border-brand-orange/20 pl-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Driver</p>
              <p className="text-xs font-bold text-brand-charcoal mt-0.5">{order.driver.name}</p>
              <a 
                href={`tel:${order.driver.phone}`} 
                className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#00A67E] hover:underline mt-1"
              >
                <Phone className="w-3 h-3 fill-current" /> Call Driver
              </a>
            </div>
          )}
        </div>
      )}

      {/* Payment Status Card & Retry/Switch to COD options */}
      <div className={`p-4 rounded-card border shadow-sm no-print ${
        order.paymentStatus === 'PAID'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : order.paymentMethod === 'CASH_ON_DELIVERY'
          ? 'bg-gray-50 border-gray-200 text-gray-800'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              order.paymentStatus === 'PAID' 
                ? 'bg-emerald-100 text-emerald-600' 
                : order.paymentMethod === 'CASH_ON_DELIVERY'
                ? 'bg-gray-200 text-gray-700'
                : 'bg-amber-100 text-amber-600'
            }`}>
              {order.paymentStatus === 'PAID' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : order.paymentMethod === 'CASH_ON_DELIVERY' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm">
                {order.paymentStatus === 'PAID'
                  ? '✅ Payment Verified (Paid Online via Razorpay)'
                  : order.paymentMethod === 'CASH_ON_DELIVERY'
                  ? '💵 Cash on Delivery (Pay upon arrival)'
                  : '⚠️ Awaiting Online Payment'}
              </p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                {order.paymentStatus === 'PAID'
                  ? `Amount of ₹${order.totalAmount} was paid successfully. Reference: ${order.notes || 'Razorpay'}`
                  : order.paymentMethod === 'CASH_ON_DELIVERY'
                  ? `Please keep ₹${order.totalAmount} ready in cash or UPI QR code when our delivery partner arrives.`
                  : `Your order was placed, but online payment of ₹${order.totalAmount} is still pending.`}
              </p>
            </div>
          </div>

          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase shrink-0 ${
            order.paymentStatus === 'PAID' 
              ? 'bg-emerald-200 text-emerald-800' 
              : order.paymentMethod === 'CASH_ON_DELIVERY'
              ? 'bg-gray-200 text-gray-800'
              : 'bg-amber-200 text-amber-800 animate-pulse'
          }`}>
            {order.paymentStatus === 'PAID' ? 'PAID' : order.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD' : 'PENDING'}
          </span>
        </div>

        {/* Action buttons if online payment is pending */}
        {order.paymentStatus !== 'PAID' && order.paymentMethod !== 'CASH_ON_DELIVERY' && order.paymentMethod !== 'CREDIT_ACCOUNT' && !isCancelled && (
          <div className="flex flex-wrap items-center gap-2.5 mt-3 pt-3 border-t border-amber-200/60">
            <button
              onClick={handleRetryPayment}
              disabled={isActionLoading}
              className="flex-1 min-w-[140px] bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all tap-scale shadow-sm disabled:opacity-50"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isActionLoading ? 'Connecting...' : 'Pay Online Now'}</span>
            </button>
            <button
              onClick={handleSwitchToCod}
              disabled={isActionLoading}
              className="flex-1 min-w-[140px] bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all tap-scale disabled:opacity-50"
            >
              <span>💵 Switch to Cash on Delivery</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Timeline Progress Tracker */}
      <div className="bg-white border border-ice-blue-dk/20 rounded-card p-5 sm:p-6 shadow-md no-print">
        <h3 className="font-display text-sm font-bold text-brand-charcoal mb-6 border-b border-gray-100 pb-3">
          📦 Track Delivery
        </h3>

        {isCancelled ? (
          <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-card">
            <span className="text-2xl">✕</span>
            <div>
              <p className="text-sm font-bold text-red-600">Order Cancelled</p>
              <p className="text-xs text-gray-500 leading-relaxed mt-1">
                This order has been cancelled. If any payment was made, it has been refunded back to your source account.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col relative pl-6 border-l-2 border-gray-200 gap-8">
            {steps.map((step, idx) => {
              const isCompleted = idx < activeStepIdx
              const isCurrent = idx === activeStepIdx
              const isFuture = idx > activeStepIdx

              // Determine icon colors
              let iconBg = 'bg-gray-100 text-gray-400 border-gray-200'
              if (isCompleted) iconBg = 'bg-[#00A67E] text-white border-[#00A67E]'
              if (isCurrent) iconBg = 'bg-brand-orange text-white border-brand-orange pulse-glow'

              // Resolve time
              let timeText = ''
              if (idx === 0) {
                timeText = new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              } else if (order[step.timeKey]) {
                timeText = new Date(order[step.timeKey]).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              }

              return (
                <div key={idx} className="relative flex flex-col gap-0.5">
                  {/* Timeline Dot Indicator */}
                  <div className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 ${iconBg}`}>
                    {isCompleted ? '✓' : idx + 1}
                  </div>

                  {/* Header Row */}
                  <div className="flex items-center justify-between gap-4">
                    <span className={`text-sm font-bold ${isFuture ? 'text-gray-400' : 'text-brand-charcoal'}`}>
                      {step.label}
                    </span>
                    {timeText && (
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {timeText}
                      </span>
                    )}
                  </div>

                  {/* Subtext description */}
                  {step.subtext && (
                    <span className="text-[11px] text-gray-400 leading-tight">
                      {step.subtext}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. Address details */}
      <div className="bg-white border border-ice-blue-dk/20 rounded-card p-5 shadow-md no-print">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
              Delivery Address
            </span>
            <span className="text-sm font-bold text-brand-charcoal">
              {order.businessName ? `${order.businessName} (${order.guestName || order.user?.name || 'Business Partner'})` : (order.guestName || order.user?.name)}
            </span>
            <span className="text-xs text-gray-500 leading-normal mt-0.5">
              {order.deliveryAddress}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Items List details */}
      <div className="bg-white border border-ice-blue-dk/20 rounded-card p-5 shadow-md">
        <h3 className="font-display text-sm font-bold text-brand-charcoal mb-4 border-b border-gray-100 pb-3">
          🛍️ Order items ({order.items.length})
        </h3>
        
        {/* List */}
        <div className="flex flex-col gap-4">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center text-xs">
              <div className="min-w-0 pr-4">
                <p className="font-bold text-brand-charcoal truncate flex items-center gap-1.5">
                  <span>
                    {item.productName.includes('French') || item.productName.includes('fries') ? '🍟' : 
                     item.productName.includes('cheese') || item.productName.includes('Cheese') ? '🧀' : '🍗'}
                  </span>
                  <span>{item.productName}</span>
                </p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5 pl-5">
                  {item.packagingType.toLowerCase()} • {item.weightGrams}g • SKU: {item.variantSku}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display font-bold text-brand-charcoal">₹{item.lineTotal}</p>
                <p className="text-[10px] text-gray-400 pl-4">{item.quantity} × ₹{item.unitPrice}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bill Breakdown Totals */}
        <div className="h-px bg-gray-100 my-4" />
        <div className="flex flex-col gap-2 text-xs font-semibold text-gray-500">
          <div className="flex justify-between">
            <span>Items Subtotal</span>
            <span className="text-brand-charcoal">₹{order.subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="text-brand-charcoal">{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
          </div>
          <div className="flex justify-between">
            <span>Cold Protection handling</span>
            <span className="text-brand-charcoal">₹{order.coldHandlingFee}</span>
          </div>
          <div className="h-px bg-gray-100 my-1" />
          <div className="flex justify-between text-base font-black">
            <span className="text-brand-charcoal">Grand Total Paid</span>
            <span className="text-brand-orange font-display">₹{order.totalAmount}</span>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mt-1">
            <span>Payment Method</span>
            <span className="text-brand-charcoal tracking-wide">{order.paymentMethod.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      {/* 5. Store Return & Support Buttons */}
      <div className="flex gap-3 no-print">
        <button
          onClick={() => router.push('/')}
          className="flex-1 bg-gradient-to-r from-brand-orange to-orange-500 hover:from-brand-orange/95 hover:to-orange-500/95 text-white font-display font-black text-xs sm:text-sm py-3.5 rounded-pill shadow-md hover:shadow-orange-500/30 flex items-center justify-center gap-2 tap-scale transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore More Products</span>
          <ShoppingBag className="w-4 h-4" />
        </button>
        <a
          href="tel:+919422070000"
          className="flex-1 bg-brand-charcoal hover:bg-brand-charcoal/90 text-white font-bold py-3.5 rounded-pill flex items-center justify-center gap-2 tap-scale text-center text-sm"
        >
          <Phone className="w-4 h-4 fill-current text-brand-yellow" />
          <span>Call Support</span>
        </a>
      </div>

      {/* Wohoooo! Payment Successful & Order is Placed Celebration Modal */}
      {order && (
        <OrderCelebrationModal
          isOpen={showCelebration}
          orderNumber={order.orderNumber}
          totalAmount={order.totalAmount}
          paymentMethod={order.paymentMethod}
          deliverySlot={order.deliverySlot}
          onExploreMore={() => router.push('/')}
          onTrackOrder={() => setShowCelebration(false)}
          onClose={() => setShowCelebration(false)}
        />
      )}

    </div>
  )
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-10 flex justify-center"><div className="w-8 h-8 border-4 border-[#0c831f] border-t-transparent rounded-full animate-spin" /></div>}>
      <OrderTrackingContent />
    </Suspense>
  )
}
