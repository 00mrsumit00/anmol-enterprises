'use client'

import React, { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useToast } from '@/components/ui/Toast'
import { OrderDeliveredReviewModal } from './OrderDeliveredReviewModal'
import { Bell, Truck, Package, CheckCircle2, Snowflake, Sparkles } from 'lucide-react'

export default function OrderNotificationListener() {
  const socket = useSocket()
  const { showToast } = useToast()
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [deliveredOrderForReview, setDeliveredOrderForReview] = useState<any | null>(null)
  const [activeNotification, setActiveNotification] = useState<{
    id: string
    title: string
    message: string
    status: string
    orderNumber: string
    icon: string
  } | null>(null)

  // Fetch current user so we can join their private notification room
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user)
        }
      })
      .catch(() => {})
  }, [])

  // Join user's personal channel in Socket.io
  useEffect(() => {
    if (!socket || !currentUser?.id) return

    socket.emit('join_user', currentUser.id)

    // Optional: Request browser Notification permission for background notifications
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission()
      } catch {}
    }

    const handleOrderStatusUpdate = (order: any) => {
      // Ensure the update belongs to the current user
      if (order.userId && order.userId !== currentUser.id) return

      const orderNum = order.orderNumber || order.id?.slice(-6) || ''

      let title = ''
      let message = ''
      let icon = '🔔'

      switch (order.status) {
        case 'CONFIRMED':
          title = 'Order Confirmed ✅'
          message = `Order #${orderNum} has been accepted and confirmed by Anmol Enterprises.`
          icon = '✅'
          break
        case 'PACKING':
          title = 'Cold Chain Packing ❄️'
          message = `Order #${orderNum} is now being packed in insulated -18°C sub-zero cold bags.`
          icon = '❄️'
          break
        case 'PACKED':
          title = 'Packed & Ready 📦'
          message = `Order #${orderNum} is packed and waiting for delivery partner pickup.`
          icon = '📦'
          break
        case 'OUT_FOR_DELIVERY':
        case 'ASSIGNED':
          title = 'Out for Delivery 🚚'
          message = `Order #${orderNum} is on the way! Our rider will arrive at your address shortly.`
          icon = '🚚'
          break
        case 'DELIVERED':
          title = 'Order Delivered 🎉'
          message = `Order #${orderNum} has arrived! Please store items at -18°C in your freezer.`
          icon = '🎉'
          // Automatically trigger the Rate Your Experience review popup!
          setTimeout(() => {
            setDeliveredOrderForReview(order)
          }, 800)
          break
        default:
          return
      }

      // 1. In-app floating alert
      setActiveNotification({
        id: `${order.id}_${order.status}_${Date.now()}`,
        title,
        message,
        status: order.status,
        orderNumber: orderNum,
        icon
      })

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setActiveNotification((prev) => (prev?.orderNumber === orderNum ? null : prev))
      }, 6000)

      // 2. In-app toast
      showToast(`${title}: ${message}`, 'info')

      // 3. Browser native notification if permission granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: message,
            icon: '/icons/emblem.png',
            tag: `order-${order.id}-${order.status}`
          })
        } catch {}
      }

      // 4. Subtle device vibration if supported
      if (typeof window !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([100, 50, 100])
        } catch {}
      }
    }

    socket.on('order_status_update', handleOrderStatusUpdate)

    return () => {
      socket.off('order_status_update', handleOrderStatusUpdate)
    }
  }, [socket, currentUser?.id, showToast])

  return (
    <>
      {/* ─── LIVE STEP-BY-STEP FLOATING DELIVERY NOTIFICATION POPUP ─────────── */}
      {activeNotification && (
        <aside
          aria-label="Delivery Status Update Notification"
          className="fixed top-4 right-4 sm:right-6 max-w-sm w-full z-[9999] select-none animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
        >
          <div className="bg-slate-950/95 backdrop-blur-2xl border border-emerald-500/40 rounded-2xl p-4 text-white shadow-2xl flex items-start gap-3 relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl pointer-events-none" />

            <div className="text-2xl shrink-0 mt-0.5">{activeNotification.icon}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-extrabold text-sm text-white leading-tight">
                  {activeNotification.title}
                </h4>
                <button
                  onClick={() => setActiveNotification(null)}
                  className="text-slate-400 hover:text-white text-xs p-1 rounded-full"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                {activeNotification.message}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  Status: {activeNotification.status}
                </span>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ─── POST-DELIVERY "RATE YOUR EXPERIENCE" POPUP ─────────────────────── */}
      <OrderDeliveredReviewModal
        isOpen={!!deliveredOrderForReview}
        order={deliveredOrderForReview}
        onClose={() => setDeliveredOrderForReview(null)}
        onSuccess={() => setDeliveredOrderForReview(null)}
      />
    </>
  )
}
