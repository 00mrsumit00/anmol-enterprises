'use client'

import React, { useState, useEffect } from 'react'
import {
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  DollarSign,
  Navigation,
  LogOut,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function DriverPortalPage() {
  const { showToast } = useToast()

  const [driver, setDriver] = useState<any>(null)
  const [phoneInput, setPhoneInput] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState({ totalDelivered: 0, totalEarnings: 0, activeOrders: 0 })
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [deliveringOrderId, setDeliveringOrderId] = useState<string | null>(null)

  // Check saved driver profile in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('anmol_driver_profile')
    if (saved) {
      try {
        const d = JSON.parse(saved)
        setDriver(d)
        loadDriverOrders(d.id)
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
      loadDriverOrders(data.driver.id)
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const loadDriverOrders = async (driverId: string) => {
    setIsLoadingOrders(true)
    try {
      const res = await fetch(`/api/driver/orders?driverId=${driverId}`)
      const data = await res.json()
      if (res.ok) {
        setOrders(data.orders || [])
        setStats(data.stats || { totalDelivered: 0, totalEarnings: 0, activeOrders: 0 })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const handleMarkDelivered = async (orderId: string) => {
    if (!driver) return
    const distanceStr = window.prompt('Distance travelled in km (from Latur Cold Storage):', '4.5')
    if (!distanceStr) return

    setDeliveringOrderId(orderId)
    try {
      const res = await fetch(`/api/driver/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driver.id,
          distanceKm: parseFloat(distanceStr) || 4.5,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update delivery')

      showToast(`Order marked Delivered! Earned ₹${data.commission.totalCommission} commission.`, 'success')
      loadDriverOrders(driver.id)
    } catch (err: any) {
      showToast(err.message || 'Failed to mark delivery', 'error')
    } finally {
      setDeliveringOrderId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('anmol_driver_profile')
    setDriver(null)
    setOrders([])
    showToast('Logged out', 'info')
  }

  // ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
  if (!driver) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20">
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
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || phoneInput.length < 10}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-sm shadow-md transition disabled:opacity-50"
            >
              {isLoggingIn ? 'Verifying...' : 'Login to Driver Portal'}
            </button>
          </form>

          <p className="text-[11px] text-slate-500">
            Assigned driver accounts are registered by Anmol Enterprises Admin.
          </p>
        </div>
      </div>
    )
  }

  // ─── ACTIVE DRIVER DASHBOARD ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-none">{driver.name}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{driver.vehicleNumber} ({driver.vehicleType})</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDriverOrders(driver.id)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Earnings & Stats Bar */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned</span>
            <p className="text-xl font-black text-amber-400 mt-0.5">{stats.activeOrders}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Delivered</span>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{stats.totalDelivered}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Earned</span>
            <p className="text-xl font-black text-white mt-0.5">₹{stats.totalEarnings}</p>
          </div>
        </div>

        {/* Assigned Orders List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Today's Dispatch Deliveries ({orders.length})
          </h3>

          {isLoadingOrders ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-sm">
              No orders assigned right now. Keep your phone active!
            </div>
          ) : (
            orders.map((order) => {
              const isDelivered = order.status === 'DELIVERED'
              const phone = order.guestPhone || order.deliveryPhone || ''

              return (
                <div
                  key={order.id}
                  className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition ${
                    isDelivered ? 'border-emerald-500/30 opacity-75' : 'border-slate-800 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-black text-xs text-orange-400">
                        #{order.orderNumber}
                      </span>
                      <h4 className="font-bold text-sm text-white mt-0.5">
                        {order.guestName || order.deliveryName || 'Customer'}
                      </h4>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isDelivered ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Delivery Address */}
                  <div className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/60 p-2.5 rounded-xl">
                    <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium leading-relaxed">{order.deliveryAddress}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {order.deliveryCity} - {order.deliveryPincode} (Slot: {order.deliverySlot})
                      </p>
                    </div>
                  </div>

                  {/* Payment & Items summary */}
                  <div className="flex items-center justify-between text-xs px-1 text-slate-400 font-semibold">
                    <span>Amount: ₹{order.totalAmount} ({order.paymentMethod.replace(/_/g, ' ')})</span>
                    <span>{order.items?.length || 0} item(s)</span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                    {/* Google Maps link */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.deliveryAddress}, ${order.deliveryCity}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition text-blue-400"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Maps
                    </a>

                    {/* Phone call shortcut */}
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center justify-center transition text-emerald-400"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Mark Delivered button */}
                    {!isDelivered ? (
                      <button
                        onClick={() => handleMarkDelivered(order.id)}
                        disabled={deliveringOrderId === order.id}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {deliveringOrderId === order.id ? 'Marking...' : 'Delivered'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Commission: ₹{order.driverCommission?.totalCommission || 25}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
