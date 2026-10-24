'use client'

import React, { useState, useEffect } from 'react'
import {
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Wallet,
  Navigation,
  LogOut,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  Award,
  Check,
  ChevronRight,
  User,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  Package,
  Layers,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface DriverCommission {
  id: string
  orderId: string
  orderNumber?: string
  deliveryAddress?: string
  deliveryCity?: string
  orderTotal?: number
  distanceKm: number
  baseFee: number
  perKmRate: number
  totalCommission: number
  isSettled: boolean
  settledAt?: string | null
  createdAt: string
}

export default function DriverPortalPage() {
  const { showToast } = useToast()

  const [driver, setDriver] = useState<any>(null)
  const [phoneInput, setPhoneInput] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Tab State: 'DELIVERIES' | 'EARNINGS' | 'PROFILE'
  const [activeTab, setActiveTab] = useState<'DELIVERIES' | 'EARNINGS' | 'PROFILE'>('DELIVERIES')

  // Orders & Data State
  const [orders, setOrders] = useState<any[]>([])
  const [commissions, setCommissions] = useState<DriverCommission[]>([])
  const [stats, setStats] = useState({
    totalDelivered: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    unsettledEarnings: 0,
    settledEarnings: 0,
    activeOrders: 0,
  })
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)

  // Delivery Modal State
  const [deliveryModalOrder, setDeliveryModalOrder] = useState<any | null>(null)
  const [distanceKmInput, setDistanceKmInput] = useState('4.5')
  const [coldChainVerified, setColdChainVerified] = useState(true)
  const [deliveryNotesInput, setDeliveryNotesInput] = useState('')
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false)

  // Check saved driver profile in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('anmol_driver_profile')
    if (saved) {
      try {
        const d = JSON.parse(saved)
        setDriver(d)
        loadDriverData(d.id)
      } catch {}
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneInput.trim()) return

    setIsLoggingIn(true)
    try {
      const res = await fetch('/api/driver/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')

      setDriver(data.driver)
      localStorage.setItem('anmol_driver_profile', JSON.stringify(data.driver))
      showToast(`Welcome back, ${data.driver.name}!`, 'success')
      loadDriverData(data.driver.id)
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const loadDriverData = async (driverId: string) => {
    setIsLoadingOrders(true)
    try {
      const res = await fetch(`/api/driver/orders?driverId=${driverId}`)
      const data = await res.json()
      if (res.ok) {
        setOrders(data.orders || [])
        setCommissions(data.commissions || [])
        if (data.driver) {
          setDriver((prev: any) => ({ ...prev, ...data.driver }))
        }
        setStats(
          data.stats || {
            totalDelivered: 0,
            totalEarnings: 0,
            todayEarnings: 0,
            unsettledEarnings: 0,
            settledEarnings: 0,
            activeOrders: 0,
          }
        )
      }
    } catch (err) {
      console.error('Failed to load driver data:', err)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  // Action: Start Delivery Run
  const handleStartDelivery = async (orderId: string) => {
    if (!driver) return
    try {
      const res = await fetch(`/api/driver/orders/${orderId}/start-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: driver.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update status')

      showToast('Order marked Out for Delivery! Customer notified.', 'success')
      loadDriverData(driver.id)
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status', 'error')
    }
  }

  // Action: Complete Delivery
  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!driver || !deliveryModalOrder) return

    setIsSubmittingDelivery(true)
    try {
      const res = await fetch(`/api/driver/orders/${deliveryModalOrder.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driver.id,
          distanceKm: parseFloat(distanceKmInput) || 4.5,
          deliveryNotes: deliveryNotesInput.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to mark delivery')

      showToast(`🎉 Order Delivered! Earned ₹${data.commission.totalCommission} commission.`, 'success')
      setDeliveryModalOrder(null)
      setDeliveryNotesInput('')
      setDistanceKmInput('4.5')
      loadDriverData(driver.id)
    } catch (err: any) {
      showToast(err.message || 'Failed to complete delivery', 'error')
    } finally {
      setIsSubmittingDelivery(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('anmol_driver_profile')
    setDriver(null)
    setOrders([])
    setCommissions([])
    showToast('Logged out of driver portal', 'info')
  }

  // ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
  if (!driver) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex flex-col justify-center items-center px-4 py-12 font-sans select-none">
        <div className="w-full max-w-sm bg-[#121826] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/25">
            <Truck className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-xl font-black text-white">Anmol Driver Partner</h1>
            <p className="text-xs text-slate-400 mt-1">
              Cold-chain doorstep delivery fleet dispatch portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Registered Mobile Number
              </label>
              <div className="relative mt-1.5">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                  +91
                </span>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || phoneInput.length < 10}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm shadow-md transition disabled:opacity-50 active:scale-98"
            >
              {isLoggingIn ? 'Verifying Account...' : 'Login to Driver Portal'}
            </button>
          </form>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 text-left space-y-1">
            <p className="font-bold text-slate-300">Need a driver account?</p>
            <p>Driver registrations are managed by Anmol Enterprises Admin. Call <strong className="text-amber-400">+91 9112449612</strong> to activate your fleet account.</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── ACTIVE DRIVER DASHBOARD ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white pb-24 font-sans select-none">
      
      {/* ─── STICKY HEADER ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-[#121826]/95 backdrop-blur-md border-b border-slate-800/90 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-black border border-amber-500/20 shadow-xs">
            {driver.name ? driver.name.charAt(0).toUpperCase() : <Truck className="w-5 h-5" />}
          </div>
          <div className="leading-tight">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{driver.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {driver.vehicleNumber} • {driver.vehicleType}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDriverData(driver.id)}
            disabled={isLoadingOrders}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition active:scale-95 border border-slate-700/60"
            title="Refresh Deliveries"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition active:scale-95 border border-rose-500/20"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        
        {/* ─── TAB 1: ACTIVE DELIVERIES ───────────────────────────────────────── */}
        {activeTab === 'DELIVERIES' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            
            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#121826] border border-slate-800 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
                <p className="text-xl font-black text-amber-400 mt-0.5">{stats.activeOrders}</p>
              </div>
              <div className="bg-[#121826] border border-slate-800 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivered</span>
                <p className="text-xl font-black text-emerald-400 mt-0.5">{stats.totalDelivered}</p>
              </div>
              <div className="bg-[#121826] border border-slate-800 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today Earned</span>
                <p className="text-xl font-black text-white mt-0.5">₹{Math.round(stats.todayEarnings)}</p>
              </div>
            </div>

            {/* Orders Header */}
            <div className="flex items-center justify-between px-1 pt-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Assigned Orders ({orders.length})
              </h3>
              <span className="text-[11px] font-semibold text-amber-400/90">
                Latur Cold Storage Dispatch
              </span>
            </div>

            {/* Orders List */}
            {isLoadingOrders ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400 font-bold uppercase">Loading your orders...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center bg-[#121826]/70 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
                <Package className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="font-bold text-white text-sm">No Assigned Deliveries</p>
                <p className="text-xs text-slate-400">
                  You are all caught up! New orders assigned by Anmol Admin will automatically appear here.
                </p>
              </div>
            ) : (
              orders.map((order) => {
                const isDelivered = order.status === 'DELIVERED'
                const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY'
                const phone = order.guestPhone || order.deliveryPhone || ''
                const customerName = order.guestName || order.deliveryName || 'Customer'
                const fullAddress = `${order.deliveryAddress}, ${order.deliveryCity} - ${order.deliveryPincode}`

                const whatsappMsg = `Hello ${customerName}, this is ${driver.name} from Anmol Enterprises. I am out for delivery with your frozen food order #${order.orderNumber}. Expected arrival in 10-15 mins.`

                return (
                  <div
                    key={order.id}
                    className={`bg-[#121826] border rounded-3xl p-4 space-y-3.5 transition ${
                      isDelivered
                        ? 'border-emerald-500/25 opacity-80'
                        : isOutForDelivery
                        ? 'border-amber-500/60 shadow-lg shadow-amber-500/5'
                        : 'border-slate-800 shadow-md'
                    }`}
                  >
                    {/* Order Number & Status Pill */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-black text-xs text-amber-400">
                          #{order.orderNumber}
                        </span>
                        <h4 className="font-extrabold text-sm text-white mt-0.5">
                          {customerName}
                        </h4>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isDelivered
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isOutForDelivery
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Delivery Address Block */}
                    <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-semibold leading-relaxed text-slate-200">{order.deliveryAddress}</p>
                        <p className="text-[11px] text-slate-400">
                          {order.deliveryCity} - {order.deliveryPincode}
                        </p>
                        <p className="text-[10px] font-bold text-amber-300 pt-0.5">
                          ⏰ Delivery Slot: {order.deliverySlot}
                        </p>
                      </div>
                    </div>

                    {/* Payment & Items summary */}
                    <div className="flex items-center justify-between text-xs px-1 text-slate-400 font-semibold border-b border-slate-800/60 pb-2.5">
                      <span>Amount: <strong className="text-white">₹{order.totalAmount}</strong> ({order.paymentMethod.replace(/_/g, ' ')})</span>
                      <span className="text-slate-400">{order.items?.length || 0} item(s)</span>
                    </div>

                    {/* Action Shortcuts Bar */}
                    <div className="flex items-center gap-2 pt-0.5">
                      {/* Google Maps Turn-by-Turn */}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition text-blue-400 border border-blue-500/20 active:scale-95"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Maps</span>
                      </a>

                      {/* Phone call shortcut */}
                      {phone && (
                        <a
                          href={`tel:+91${phone.replace(/\D/g, '').slice(-10)}`}
                          className="py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold flex items-center justify-center transition text-emerald-400 border border-emerald-500/20 active:scale-95"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* WhatsApp connect shortcut */}
                      {phone && (
                        <a
                          href={`https://wa.me/91${phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(whatsappMsg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-xs font-bold flex items-center justify-center transition text-emerald-300 border border-emerald-500/30 active:scale-95"
                          title="WhatsApp Customer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Delivery Status Transitions */}
                      {!isDelivered && (
                        order.status === 'ASSIGNED' ? (
                          <button
                            onClick={() => handleStartDelivery(order.id)}
                            className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition active:scale-95"
                          >
                            Start Run ➔
                          </button>
                        ) : (
                          <button
                            onClick={() => setDeliveryModalOrder(order)}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Delivered</span>
                          </button>
                        )
                      )}

                      {isDelivered && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 py-1 px-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Earned ₹{order.driverCommission?.totalCommission || 25}</span>
                        </div>
                      )}
                    </div>

                  </div>
                )
              })
            )}

          </div>
        )}

        {/* ─── TAB 2: MY EARNINGS & COMMISSION STATEMENT ──────────────────────── */}
        {activeTab === 'EARNINGS' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            
            {/* Wallet Big Balance Card */}
            <div className="bg-gradient-to-br from-[#121826] to-[#1A2234] border border-amber-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  <span>Unsettled Wallet Balance (Ready for Payout)</span>
                </span>
                <p className="text-4xl font-black text-white mt-1.5">
                  ₹{Math.round(stats.unsettledEarnings)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Settled Payouts to date: <strong className="text-emerald-400 font-extrabold">₹{Math.round(stats.settledEarnings)}</strong>
                </p>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#121826] border border-slate-800 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today</span>
                <p className="text-xl font-black text-amber-400 mt-0.5">₹{Math.round(stats.todayEarnings)}</p>
              </div>
              <div className="bg-[#121826] border border-slate-800 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">All Time</span>
                <p className="text-xl font-black text-white mt-0.5">₹{Math.round(stats.totalEarnings)}</p>
              </div>
              <div className="bg-[#121826] border border-slate-800 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rides</span>
                <p className="text-xl font-black text-emerald-400 mt-0.5">{stats.totalDelivered}</p>
              </div>
            </div>

            {/* Rate Card Info */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Commission Formula</span>
                <span className="text-[11px] text-slate-400">Base ₹25 + Distance Rate ₹8/km</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase">
                Per Delivery
              </span>
            </div>

            {/* Order Commission Ledger */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                Completed Ride Statements ({commissions.length})
              </h3>

              {commissions.length === 0 ? (
                <div className="p-6 text-center bg-[#121826] rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  No completed delivery commissions recorded yet.
                </div>
              ) : (
                commissions.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3.5 rounded-2xl bg-[#121826] border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">
                          #{comm.orderNumber || 'ORD'}
                        </span>
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${
                          comm.isSettled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {comm.isSettled ? 'PAID / SETTLED' : 'UNSETTLED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Distance: {comm.distanceKm} km • {new Date(comm.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-sm text-emerald-400 block">
                        +₹{comm.totalCommission}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Base: ₹{comm.baseFee}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* ─── TAB 3: DRIVER PROFILE ─────────────────────────────────────────── */}
        {activeTab === 'PROFILE' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            
            {/* Profile Overview Card */}
            <div className="bg-[#121826] border border-slate-800 rounded-3xl p-5 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20">
                {driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
              </div>
              <div>
                <h3 className="font-black text-lg text-white">{driver.name}</h3>
                <p className="text-xs text-slate-400">+91 {driver.phone}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Authorized Delivery Partner</span>
                </div>
              </div>
            </div>

            {/* Vehicle & Operational Info */}
            <div className="bg-[#121826] border border-slate-800 rounded-3xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                Vehicle & Fleet Assignment
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-400">Assigned Vehicle Number</span>
                  <span className="font-mono font-bold text-white">{driver.vehicleNumber}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-400">Vehicle Type</span>
                  <span className="font-bold text-white">{driver.vehicleType}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-400">Base Commission</span>
                  <span className="font-bold text-emerald-400">₹25 / order</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-400">Per-KM Distance Rate</span>
                  <span className="font-bold text-emerald-400">₹8.00 / km</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-400">Joined Fleet On</span>
                  <span className="font-bold text-white">
                    {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '2026'}
                  </span>
                </div>
              </div>
            </div>

            {/* Help & Operations Helpline */}
            <div className="bg-[#121826] border border-slate-800 rounded-3xl p-4 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                Dispatch Helpline
              </h4>
              <p className="text-xs text-slate-400 px-1">
                For order reassignment, route issues, or payment queries, contact Anmol Operations directly.
              </p>
              <a
                href="tel:+919112449612"
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-98 border border-slate-700"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <span>Call Admin Helpline (+91 9112449612)</span>
              </a>
            </div>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="w-full py-3.5 rounded-2xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-400 font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout from Driver Portal</span>
            </button>

          </div>
        )}

      </div>

      {/* ─── 3-TAB BOTTOM NAVIGATION BAR (Mobile-First) ──────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#121826]/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 select-none">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('DELIVERIES')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition ${
              activeTab === 'DELIVERIES'
                ? 'text-amber-400 bg-amber-500/10 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="relative">
              <Truck className="w-5 h-5" />
              {stats.activeOrders > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
                  {stats.activeOrders}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Deliveries</span>
          </button>

          <button
            onClick={() => setActiveTab('EARNINGS')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition ${
              activeTab === 'EARNINGS'
                ? 'text-amber-400 bg-amber-500/10 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Earnings</span>
          </button>

          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition ${
              activeTab === 'PROFILE'
                ? 'text-amber-400 bg-amber-500/10 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Profile</span>
          </button>
        </div>
      </div>

      {/* ─── MODAL: COMPLETE DELIVERY & DISTANCE COMMISSION ──────────────────── */}
      {deliveryModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-slate-700/80 rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-black text-base text-white">Complete Doorstep Delivery</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Order #{deliveryModalOrder.orderNumber} for {deliveryModalOrder.guestName || deliveryModalOrder.deliveryName || 'Customer'}
            </p>

            <form onSubmit={handleConfirmDelivery} className="mt-4 space-y-4 text-xs font-semibold">
              
              {/* Distance input */}
              <div>
                <label className="text-slate-300 uppercase tracking-wider block mb-1">
                  Delivery Distance (km from Latur Hub) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="100"
                    required
                    value={distanceKmInput}
                    onChange={(e) => setDistanceKmInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    KM
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 mt-1 font-bold">
                  Estimated Commission: ₹{Math.round((25 + (parseFloat(distanceKmInput) || 0) * 8) * 100) / 100}
                </p>
              </div>

              {/* Cold-Chain Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={coldChainVerified}
                  onChange={(e) => setColdChainVerified(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 mt-0.5"
                />
                <span className="text-[11px] text-slate-300 leading-snug">
                  Cold-chain verified: Frozen products delivered cold & intact at doorstep.
                </span>
              </label>

              {/* Optional notes */}
              <div>
                <label className="text-slate-300 uppercase tracking-wider block mb-1">
                  Delivery Notes / Customer Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Handed to security / Left with family"
                  value={deliveryNotesInput}
                  onChange={(e) => setDeliveryNotesInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDelivery || !coldChainVerified}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md transition disabled:opacity-50"
                >
                  {isSubmittingDelivery ? 'Recording...' : 'Confirm Delivered'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
