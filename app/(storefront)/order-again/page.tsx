'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  RotateCcw,
  Plus,
  Check,
  MessageSquare,
  FileText,
  CheckCircle2,
  Clock,
  Package,
  ArrowRight,
  Sparkles,
  Search,
  X,
  CreditCard,
  Truck,
  AlertCircle
} from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/ui/Toast'
import { getProductPacketImage } from '@/lib/productImages'

function ReorderBagIllustration({ isCompact = false }: { isCompact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'py-3' : 'py-8 sm:py-12'}`}>
      <svg
        viewBox="0 0 400 240"
        className={`w-full max-w-[280px] sm:max-w-[340px] select-none transition-transform hover:scale-102 ${isCompact ? 'h-28 sm:h-32' : 'h-48 sm:h-56'}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Background Clouds */}
        <path
          d="M60 80 Q75 60 95 70 Q115 50 135 70 Q145 80 140 90 L50 90 Q45 80 60 80 Z"
          fill="#ECE7DE"
          opacity="0.8"
        />
        <path
          d="M270 95 Q285 75 305 85 Q325 65 345 85 Q355 95 350 105 L260 105 Q255 95 270 95 Z"
          fill="#ECE7DE"
          opacity="0.8"
        />

        {/* Leaves / Greens behind bag */}
        <path
          d="M145 100 C135 60 150 40 160 50 C170 30 185 45 175 75 C185 60 195 70 185 95 Z"
          fill="#4A7C59"
        />
        <path
          d="M210 95 C205 50 230 35 245 45 C255 30 270 45 260 70 C270 60 275 80 260 100 Z"
          fill="#3E9B52"
        />

        {/* Carrot */}
        <path d="M215 90 L228 55 Q235 60 230 75 L225 90 Z" fill="#E65100" />
        <ellipse cx="228" cy="56" rx="5" ry="3" fill="#FB8C00" />

        {/* Mango / Lemon */}
        <ellipse cx="195" cy="80" rx="22" ry="20" fill="#FFD54F" />

        {/* Red Ketchup / Sauce Bottle (left) */}
        <rect x="95" y="118" width="28" height="60" rx="6" fill="#D32F2F" />
        <rect x="103" y="106" width="12" height="12" rx="2" fill="#FFA000" />
        <rect x="95" y="145" width="28" height="18" fill="#F5F5F5" />
        <rect x="99" y="152" width="20" height="5" rx="2" fill="#FFA000" />

        {/* Water Bottle (left-center) */}
        <rect x="123" y="98" width="30" height="80" rx="8" fill="#E1F5FE" stroke="#81D4FA" strokeWidth="1.5" />
        <rect x="132" y="86" width="12" height="12" rx="2" fill="#2E7D32" />
        <rect x="123" y="130" width="30" height="24" fill="#00C853" />
        <circle cx="138" cy="142" r="4" fill="#FFFFFF" />

        {/* Center Grocery Bag with Anmol branding */}
        <path
          d="M150 90 H250 V180 C250 183 248 185 245 185 H155 C152 185 150 183 150 180 Z"
          fill="#FFB300"
        />
        <path
          d="M150 90 H170 V185 H155 C152 185 150 183 150 180 Z"
          fill="#FFA000"
        />
        {/* Anmol text on bag */}
        <text
          x="200"
          y="142"
          textAnchor="middle"
          fill="#1E293B"
          fontSize="18"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5"
        >
          anmol
        </text>
        <circle cx="228" cy="130" r="2.5" fill="#EF4444" />

        {/* Milk Cartons (right) */}
        <path d="M250 115 L268 98 L285 115 V175 H250 Z" fill="#ECEFF1" stroke="#CFD8DC" strokeWidth="1" />
        <rect x="250" y="132" width="35" height="22" fill="#FBC02D" />
        
        <path d="M275 125 L292 108 L310 125 V180 H275 Z" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="1" />
        <rect x="275" y="140" width="35" height="26" fill="#2E7D32" />
        <ellipse cx="292.5" cy="153" rx="7" ry="4" fill="#FFFFFF" />

        {/* Green Apple in front */}
        <circle cx="245" cy="162" r="21" fill="#43A047" />
        <path d="M245 141 Q248 135 252 133" stroke="#5D4037" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M248 136 Q255 136 257 141 Q252 142 248 136 Z" fill="#81C784" />
        <circle cx="250" cy="166" r="2" fill="#FFFFFF" opacity="0.6" />
      </svg>

      <h2 className="font-extrabold text-lg sm:text-xl text-gray-900 tracking-tight mt-2">
        Reordering Made Effortless
      </h2>
      <p className="text-xs sm:text-sm text-gray-500 max-w-sm mt-0.5 px-4 leading-relaxed">
        Everything you order appears here so you can re-stock your kitchen in 1 tap
      </p>
    </div>
  )
}

export default function OrderAgainPage() {
  const { add, open } = useCart()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({})

  // Filters inspired by Admin Console
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DELIVERED' | 'ACTIVE' | 'CANCELLED'>('ALL')
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL')

  // Fetch logged in user and order history
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        setLoading(true)
        const meRes = await fetch('/api/auth/me')
        const meData = await meRes.json()

        if (meData.user) {
          if (isMounted) setCurrentUser(meData.user)
          const ordersRes = await fetch('/api/orders')
          const ordersData = await ordersRes.json()
          if (Array.isArray(ordersData) && isMounted) {
            setOrders(ordersData)
          }
        }
      } catch (err) {
        console.error('Failed to load order-again data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  // Extract unique items previously ordered
  const uniqueItems = useMemo(() => {
    const map = new Map<string, any>()
    orders.forEach((order) => {
      (order.items || []).forEach((item: any) => {
        const key = item.variantId || item.productId || item.productName
        if (!map.has(key)) {
          const productSlug =
            item.product?.slug ||
            item.variant?.product?.slug ||
            (item.productName ? item.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '')
          const rawImg = item.product?.imageUrl || item.variant?.product?.imageUrl || item.imageUrl
          const resolvedImg = getProductPacketImage(productSlug, rawImg)

          map.set(key, {
            ...item,
            productSlug,
            imageUrl: resolvedImg,
            lastOrderDate: order.createdAt,
            orderCount: 1,
          })
        } else {
          map.get(key).orderCount += 1
        }
      })
    })
    return Array.from(map.values())
  }, [orders])

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter === 'DELIVERED' && order.status !== 'DELIVERED') return false
      if (statusFilter === 'CANCELLED' && order.status !== 'CANCELLED') return false
      if (statusFilter === 'ACTIVE' && (order.status === 'DELIVERED' || order.status === 'CANCELLED')) return false

      // Date quick filter
      if (dateFilter !== 'ALL') {
        const orderTime = new Date(order.createdAt).getTime()
        const now = Date.now()
        if (dateFilter === 'TODAY') {
          const startOfToday = new Date()
          startOfToday.setHours(0, 0, 0, 0)
          if (orderTime < startOfToday.getTime()) return false
        } else if (dateFilter === 'WEEK') {
          if (now - orderTime > 7 * 24 * 60 * 60 * 1000) return false
        } else if (dateFilter === 'MONTH') {
          if (now - orderTime > 30 * 24 * 60 * 60 * 1000) return false
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchNum = (order.orderNumber || '').toLowerCase().includes(q)
        const matchStatus = (order.status || '').toLowerCase().includes(q)
        const matchItem = (order.items || []).some((item: any) =>
          (item.productName || item.product?.name || '').toLowerCase().includes(q)
        )
        if (!matchNum && !matchStatus && !matchItem) return false
      }

      return true
    })
  }, [orders, statusFilter, dateFilter, searchQuery])

  // Status counts for filter pills
  const counts = useMemo(() => {
    let delivered = 0
    let active = 0
    let cancelled = 0
    orders.forEach((o) => {
      if (o.status === 'DELIVERED') delivered++
      else if (o.status === 'CANCELLED') cancelled++
      else active++
    })
    return { all: orders.length, delivered, active, cancelled }
  }, [orders])

  const handleAddSingleItem = (item: any) => {
    const key = item.variantId || item.productId || item.productName
    const price = item.unitPrice || 0

    add({
      variantId: item.variantId || `var-${item.productId || 'temp'}`,
      productId: item.productId || 'prod-temp',
      productName: item.productName || 'McCain Product',
      productSlug: item.productSlug || 'mccain-product',
      imageUrl: item.imageUrl,
      packagingType: item.packagingType || 'SINGLE',
      weightGrams: item.weightGrams || 1000,
      unitsInPack: item.unitsInPack || 1,
      skuCode: item.variantSku || 'SKU-REORDER',
      unitPrice: price,
      quantity: 1,
      lineTotal: price,
    })

    setAddedItemIds((prev) => ({ ...prev, [key]: true }))
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [key]: false }))
    }, 1500)

    showToast(`Added ${item.productName || 'Item'} to basket!`, 'success')
  }

  const handleReorderOrder = (orderItems: any[]) => {
    if (!orderItems || orderItems.length === 0) return
    let totalPacks = 0

    orderItems.forEach((item: any) => {
      const price = item.unitPrice || 0
      const qty = item.quantity || 1
      const productSlug =
        item.product?.slug ||
        item.variant?.product?.slug ||
        (item.productName ? item.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '')
      const rawImg = item.product?.imageUrl || item.variant?.product?.imageUrl || item.imageUrl
      const resolvedImg = getProductPacketImage(productSlug, rawImg)

      add({
        variantId: item.variantId,
        productId: item.productId,
        productName: item.productName || 'McCain Product',
        productSlug: productSlug || 'mccain-product',
        imageUrl: resolvedImg,
        packagingType: item.packagingType || 'SINGLE',
        weightGrams: item.weightGrams || 1000,
        unitsInPack: item.unitsInPack || 1,
        skuCode: item.variantSku || 'SKU-REORDER',
        unitPrice: price,
        quantity: qty,
        lineTotal: price * qty,
      })
      totalPacks += qty
    })

    showToast(`Added ${orderItems.length} items (${totalPacks} packs) to basket!`, 'success')
    open()
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-16 select-none">
      {/* ─── STICKY HEADER ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                Order Again
              </h1>
              <p className="text-[11px] text-slate-500">
                1-tap reordering & complete past order history
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 rounded-xl border border-amber-200/80 transition active:scale-95 shadow-2xs"
          >
            Explore Catalog
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="space-y-4 py-6">
            <div className="h-36 bg-white rounded-3xl animate-pulse border border-slate-200/80 shadow-2xs" />
            <div className="h-28 bg-white rounded-3xl animate-pulse border border-slate-200/80 shadow-2xs" />
            <div className="h-28 bg-white rounded-3xl animate-pulse border border-slate-200/80 shadow-2xs" />
          </div>
        )}

        {/* Not Logged In State */}
        {!loading && !currentUser && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm text-center">
            <ReorderBagIllustration isCompact={false} />
            <div className="mt-5">
              <Link
                href="/account"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-amber-500/25 active:scale-95 transition"
              >
                <span>Login to View Your Orders</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Logged in, 0 Orders State */}
        {!loading && currentUser && orders.length === 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm text-center">
            <ReorderBagIllustration isCompact={false} />
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-orange-500/25 active:scale-95 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Explore Frozen Express Menu</span>
              </Link>
              <Link
                href="/categories"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-5 py-3 rounded-2xl transition"
              >
                <span>View Categories</span>
              </Link>
            </div>
          </div>
        )}

        {/* Logged in with Orders */}
        {!loading && currentUser && orders.length > 0 && (
          <>
            {/* ─── SECTION 1: ITEMS ORDERED PREVIOUSLY (1-TAP REORDER) ──────── */}
            {uniqueItems.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <h2 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                      Items Ordered Frequently
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                    {uniqueItems.length} saved products
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {uniqueItems.map((item: any, idx: number) => {
                    const key = item.variantId || item.productId || item.productName
                    const isAdded = !!addedItemIds[key]

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-amber-300"
                      >
                        {/* Constrained Image Preview with Fixed Ratio */}
                        <div className="relative w-full h-28 sm:h-32 rounded-xl bg-slate-50/80 p-2 flex items-center justify-center overflow-hidden mb-2 border border-slate-100">
                          <img
                            src={item.imageUrl}
                            alt={item.productName || 'Product'}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                '/images/products/mccain-french-fries-420g.jpg'
                            }}
                          />
                          {item.orderCount > 1 && (
                            <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                              {item.orderCount}x ordered
                            </span>
                          )}
                        </div>

                        {/* Name & Pricing */}
                        <div>
                          <h3 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight">
                            {item.productName}
                          </h3>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-xs font-black text-emerald-700">
                              ₹{item.unitPrice}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">
                              {item.packagingType || 'SINGLE'}
                            </span>
                          </div>
                        </div>

                        {/* 1-Tap Add Button */}
                        <button
                          type="button"
                          onClick={() => handleAddSingleItem(item)}
                          className={`mt-2.5 w-full py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                            isAdded
                              ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 active:scale-95'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Add to Basket</span>
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ─── SECTION 2: PAST ORDERS DISPATCH CONSOLE ─────────────────── */}
            <section className="space-y-4 pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                    Order History & Fast Reorder
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Track statuses, invoices, and re-purchase completed batches in 1-tap
                  </p>
                </div>

                {/* Date Quick Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Period:</span>
                  {[
                    { id: 'ALL', label: 'All Time' },
                    { id: 'TODAY', label: 'Today' },
                    { id: 'WEEK', label: 'Last 7 Days' },
                    { id: 'MONTH', label: 'This Month' },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setDateFilter(chip.id as any)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all border ${
                        dateFilter === chip.id
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Status Filter Toolbar (Inspired by Screenshot 2) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by order number, item name, or status..."
                    className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                      statusFilter === 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Orders ({counts.all})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('DELIVERED')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                      statusFilter === 'DELIVERED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50/60 text-emerald-700 border-emerald-200 hover:bg-emerald-100/60'
                    }`}
                  >
                    Delivered ({counts.delivered})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                      statusFilter === 'ACTIVE'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-amber-50/60 text-amber-700 border-amber-200 hover:bg-amber-100/60'
                    }`}
                  >
                    In Progress ({counts.active})
                  </button>
                  {counts.cancelled > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter('CANCELLED')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                        statusFilter === 'CANCELLED'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-rose-50/60 text-rose-700 border-rose-200 hover:bg-rose-100/60'
                      }`}
                    >
                      Cancelled ({counts.cancelled})
                    </button>
                  )}
                </div>
              </div>

              {/* Order Cards List */}
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800">No matching orders found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting your search terms or clearing the status and date filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('ALL')
                      setDateFilter('ALL')
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {filteredOrders.map((order: any) => {
                    const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    const statusStyle =
                      order.status === 'DELIVERED'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : order.status === 'CANCELLED'
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : order.status === 'OUT_FOR_DELIVERY' || order.status === 'ASSIGNED'
                        ? 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
                        : 'bg-blue-50 border-blue-200 text-blue-700'

                    const itemCount = (order.items || []).length
                    const firstItem = (order.items || [])[0]
                    const summaryText = firstItem
                      ? `${firstItem.quantity || 1}x ${firstItem.productName || 'Item'}${
                          itemCount > 1 ? ` +${itemCount - 1} more` : ''
                        }`
                      : `${itemCount} items`

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col gap-3.5"
                      >
                        {/* Order Header (Monospace ID, Time, Payment Tag, Status) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                              <Package className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                                  #{order.orderNumber}
                                </span>
                                {order.paymentMethod === 'CREDIT' ? (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                                    Pay on Credit (B2B)
                                  </span>
                                ) : order.paymentMethod === 'ONLINE' ? (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                    Paid Online
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                    COD
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                Placed on {orderDate}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${statusStyle}`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Middle Items Summary Strip (Strict Fixed Thumbnails - Eliminates Giant Image Bug) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
                            {(order.items || []).slice(0, 4).map((item: any, idx: number) => {
                              const productSlug =
                                item.product?.slug ||
                                item.variant?.product?.slug ||
                                (item.productName
                                  ? item.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                  : '')
                              const rawImg =
                                item.product?.imageUrl || item.variant?.product?.imageUrl || item.imageUrl
                              const imgSrc = getProductPacketImage(productSlug, rawImg)

                              return (
                                <div
                                  key={idx}
                                  className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shrink-0 relative overflow-hidden shadow-2xs"
                                  title={item.productName}
                                >
                                  <img
                                    src={imgSrc}
                                    alt={item.productName || 'Item'}
                                    className="w-full h-full object-contain max-h-[48px] max-w-[48px]"
                                    onError={(e) => {
                                      ;(e.target as HTMLImageElement).src =
                                        '/images/products/mccain-french-fries-420g.jpg'
                                    }}
                                  />
                                  {item.quantity > 1 && (
                                    <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs">
                                      {item.quantity}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                            {(order.items || []).length > 4 && (
                              <div className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-xl bg-slate-100 text-slate-600 font-extrabold text-xs flex items-center justify-center shrink-0 border border-dashed border-slate-300">
                                +{(order.items || []).length - 4}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:text-right">
                            <div className="flex items-center sm:justify-end gap-1.5">
                              <span className="text-xs font-bold text-slate-800">
                                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                              </span>
                              <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                                # Keep Frozen
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs mt-0.5">
                              {summaryText}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Total & Actions Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              Total Amount
                            </span>
                            <span className="text-base sm:text-lg font-extrabold text-slate-900">
                              ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleReorderOrder(order.items)}
                              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reorder All ({itemCount})</span>
                            </button>

                            <Link
                              href={`/chat?orderId=${order.id}&orderNumber=${order.orderNumber}`}
                              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                              title="Order Support Chat"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                              <span className="hidden sm:inline">Chat</span>
                            </Link>

                            {order.status !== 'PENDING' && (
                              <Link
                                href={`/admin/orders/${order.id}/invoice`}
                                target="_blank"
                                className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                                title="Download / Print Invoice"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-500" />
                                <span className="hidden sm:inline">Invoice</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
