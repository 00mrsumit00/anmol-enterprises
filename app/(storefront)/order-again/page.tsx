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
  ChevronRight,
  Package,
  ArrowRight,
  Sparkles,
  Truck
} from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/ui/Toast'
import { getProductPacketImage } from '@/lib/productImages'

function ReorderBagIllustration({ isCompact = false }: { isCompact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'py-4' : 'py-8 sm:py-12'}`}>
      <svg
        viewBox="0 0 400 240"
        className={`w-full max-w-[280px] sm:max-w-[340px] select-none transition-transform hover:scale-102 ${isCompact ? 'h-32 sm:h-36' : 'h-48 sm:h-56'}`}
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

      <h2 className="font-extrabold text-xl sm:text-2xl text-gray-900 tracking-tight mt-3">
        Reordering will be easy
      </h2>
      <p className="text-xs sm:text-sm text-gray-500 max-w-sm mt-1 px-4 leading-relaxed">
        Items you order will show up here so you can buy them again easily
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
    <div className="min-h-screen bg-[#FAF9F6] pb-24 md:pb-16 select-none">
      {/* ─── STICKY HEADER ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight">
                Order Again
              </h1>
              <p className="text-[11px] text-gray-500">
                1-tap reordering & complete past order history
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition"
          >
            Browse All
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="space-y-4 py-8">
            <div className="h-44 bg-white rounded-3xl animate-pulse border border-gray-100 shadow-2xs" />
            <div className="h-28 bg-white rounded-3xl animate-pulse border border-gray-100 shadow-2xs" />
            <div className="h-28 bg-white rounded-3xl animate-pulse border border-gray-100 shadow-2xs" />
          </div>
        )}

        {/* Not Logged In State */}
        {!loading && !currentUser && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm text-center">
            <ReorderBagIllustration isCompact={false} />
            <div className="mt-4">
              <Link
                href="/account"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-98 transition"
              >
                <span>Login to View Your Orders</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Logged in, 0 Orders State (Clean Screenshot 5 replication) */}
        {!loading && currentUser && orders.length === 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm text-center">
            <ReorderBagIllustration isCompact={false} />
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Explore Frozen Express Menu</span>
              </Link>
              <Link
                href="/categories"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm px-5 py-3 rounded-2xl transition"
              >
                <span>View Categories</span>
              </Link>
            </div>
          </div>
        )}

        {/* Logged in with Orders */}
        {!loading && currentUser && orders.length > 0 && (
          <>
            {/* Top Friendly Bag Banner */}
            <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 rounded-3xl border border-amber-200/60 p-4 sm:p-6 shadow-2xs">
              <ReorderBagIllustration isCompact={true} />
            </div>

            {/* ─── SECTION 1: ITEMS YOU ORDERED BEFORE (1-TAP REORDER) ──────── */}
            {uniqueItems.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight">
                      Items Ordered Previously
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      Tap + Add to quickly drop into your active basket
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                    {uniqueItems.length} items
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {uniqueItems.map((item: any, idx: number) => {
                    const key = item.variantId || item.productId || item.productName
                    const isAdded = !!addedItemIds[key]

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        {/* Image Preview */}
                        <div className="relative aspect-square w-full rounded-xl bg-gray-50 p-2 flex items-center justify-center overflow-hidden mb-2">
                          <img
                            src={item.imageUrl}
                            alt={item.productName || 'Product'}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                '/images/products/mccain-french-fries-420g.jpg'
                            }}
                          />
                          {item.orderCount > 1 && (
                            <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                              Ordered {item.orderCount}x
                            </span>
                          )}
                        </div>

                        {/* Name & Pricing */}
                        <div>
                          <h3 className="font-bold text-xs text-gray-900 line-clamp-2 leading-tight">
                            {item.productName}
                          </h3>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-xs font-black text-emerald-700">
                              ₹{item.unitPrice}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">
                              {item.packagingType || 'PACK'}
                            </span>
                          </div>
                        </div>

                        {/* 1-Tap Add Button */}
                        <button
                          type="button"
                          onClick={() => handleAddSingleItem(item)}
                          className={`mt-2.5 w-full py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition-all ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
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
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ─── SECTION 2: ALL RECENT ORDERS ─────────────────────────────── */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight">
                    All Recent Orders
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Track statuses, invoices, and repeat previous complete orders
                  </p>
                </div>
                <span className="text-[11px] font-bold text-gray-400">
                  {orders.length} placed
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {orders.map((order: any) => {
                  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  const statusColor =
                    order.status === 'DELIVERED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : order.status === 'CANCELLED'
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : order.status === 'OUT_FOR_DELIVERY' || order.status === 'ASSIGNED'
                      ? 'bg-orange-50 border-orange-200 text-orange-700 animate-pulse'
                      : 'bg-amber-50 border-amber-200 text-amber-700'

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col gap-3"
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-extrabold text-xs text-gray-900">
                                Order #{order.orderNumber}
                              </h3>
                              <Link
                                href={`/chat?orderId=${order.id}&orderNumber=${order.orderNumber}`}
                                className="text-emerald-600 hover:text-emerald-700 p-1 hover:bg-emerald-50 rounded-lg transition"
                                title="Chat with store about this order"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">
                              ₹{order.totalAmount} • {orderDate}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${statusColor}`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Items Thumbnails Row */}
                      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                        {(order.items || []).slice(0, 5).map((item: any, idx: number) => {
                          const productSlug =
                            item.product?.slug ||
                            item.variant?.product?.slug ||
                            (item.productName ? item.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '')
                          const rawImg = item.product?.imageUrl || item.variant?.product?.imageUrl || item.imageUrl
                          const imgSrc = getProductPacketImage(productSlug, rawImg)

                          return (
                            <div
                              key={idx}
                              className="w-13 h-13 rounded-xl bg-gray-50 border border-gray-200/80 p-1 flex items-center justify-center shrink-0 relative overflow-hidden"
                              title={item.productName}
                            >
                              <img
                                src={imgSrc}
                                alt={item.productName || 'Item'}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src =
                                    '/images/products/mccain-french-fries-420g.jpg'
                                }}
                              />
                              {item.quantity > 1 && (
                                <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                                  {item.quantity}
                                </span>
                              )}
                            </div>
                          )
                        })}
                        {(order.items || []).length > 5 && (
                          <div className="w-13 h-13 rounded-xl bg-gray-100 text-gray-500 font-black text-xs flex items-center justify-center shrink-0 border border-dashed border-gray-300">
                            +{order.items.length - 5}
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                        <button
                          type="button"
                          onClick={() => handleReorderOrder(order.items)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md hover:shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reorder All</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/chat?orderId=${order.id}&orderNumber=${order.orderNumber}`}
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Chat</span>
                          </Link>

                          {order.status !== 'PENDING' && (
                            <Link
                              href={`/admin/orders/${order.id}/invoice`}
                              target="_blank"
                              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                            >
                              <FileText className="w-3.5 h-3.5 text-gray-500" />
                              <span>Invoice</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
