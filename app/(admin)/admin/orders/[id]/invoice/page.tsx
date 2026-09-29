'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Printer, ArrowLeft, Snowflake } from 'lucide-react'

export default function PrintInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  // Fetch order detail
  const { data: order, isLoading } = useQuery({
    queryKey: ['invoice-order', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) throw new Error('Order not found')
      return res.json()
    }
  })

  // Trigger print dialog once data is loaded
  useEffect(() => {
    if (order) {
      const timer = setTimeout(() => {
        window.print()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [order])

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-brand-charcoal text-xs font-body font-semibold">
        <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
        <span>Generating Invoice Layout...</span>
      </div>
    )
  }

  const formattedDeliveryDate = new Date(order.deliveryDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  return (
    <div className="bg-white min-h-screen text-black p-6 font-sans max-w-3xl mx-auto border border-gray-150 md:shadow-md relative">
      
      {/* 0. BACK BAR (Hidden on printing) */}
      <div className="no-print flex items-center justify-between pb-6 border-b border-gray-100 mb-6 text-sm">
        <button
          onClick={() => router.push('/admin/orders')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-md font-semibold text-gray-700 transition-all tap-scale"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dispatch Board</span>
        </button>
        
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-orange hover:bg-brand-orange-dark text-white rounded-md font-bold transition-all tap-scale shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Document</span>
        </button>
      </div>

      {/* 1. HEADER (Invoice design) */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center mb-1">
            <img
              src="/images/logo.png"
              alt="Anmol Enterprises"
              className="h-12 w-auto object-contain"
            />
          </div>
          <p className="text-[10px] text-gray-500 leading-normal max-w-xs">
            Frozen Food Distributors & Logistics<br />
            Anmol Building, Near Market Yard, Latur - 413512<br />
            Maharashtra, India • GSTIN: 27AABCA7000A1Z1
          </p>
        </div>

        <div className="text-right flex flex-col gap-1.5 select-none">
          <span className="text-xl font-black text-brand-orange tracking-widest uppercase">
            Tax Invoice
          </span>
          <div className="text-[10px] text-gray-500 font-semibold uppercase leading-tight mt-0.5">
            <p>Invoice #: <strong className="text-black">{order.orderNumber}</strong></p>
            <p>Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
            <p>Payment: {order.paymentMethod.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>

      {/* 2. CUSTOMER & DELIVERY BLOCK */}
      <div className="grid grid-cols-2 gap-6 border-t border-b border-gray-200 py-4 mb-6 text-xs leading-normal">
        <div>
          <span className="font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
            Billed To:
          </span>
          <p className="font-bold text-black text-sm">{order.businessName || order.guestName || order.user?.name}</p>
          {order.businessName && <p className="font-semibold text-gray-600">Attn: {order.guestName || order.user?.name}</p>}
          <p className="text-gray-500 mt-1 max-w-xs">{order.deliveryAddress}</p>
          <p className="text-gray-500 font-bold mt-1">📞 Phone: +91 {order.guestPhone || order.user?.phone}</p>
        </div>

        <div className="text-right">
          <span className="font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
            Delivery Schedule:
          </span>
          <p className="font-bold text-black">{formattedDeliveryDate}</p>
          <p className="font-semibold text-brand-orange mt-0.5 uppercase tracking-wide">
            {order.deliverySlot} Slot (9 AM - 8 PM)
          </p>
          {order.driver && (
            <p className="text-gray-500 mt-2 font-medium">
              Dispatched via: <strong className="text-black">{order.driver.name}</strong> ({order.driver.vehicleNumber})
            </p>
          )}
        </div>
      </div>

      {/* 3. ITEMS TABLE */}
      <div className="mb-6">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-gray-300 text-gray-400 font-bold uppercase tracking-wider select-none">
              <th className="py-2">SKU Code</th>
              <th className="py-2">Product Description</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Unit Rate</th>
              <th className="py-2 text-right">Total (INR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.items.map((item: any) => (
              <tr key={item.id} className="py-2">
                <td className="py-3 font-semibold text-gray-500">{item.variantSku}</td>
                <td className="py-3 font-bold text-brand-charcoal">
                  {item.productName} ({item.packagingType} • {item.weightGrams}g)
                </td>
                <td className="py-3 text-center font-bold">{item.quantity}</td>
                <td className="py-3 text-right">₹{item.unitPrice.toFixed(2)}</td>
                <td className="py-3 text-right font-bold">₹{item.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. TOTALS BLOCK */}
      <div className="flex justify-between items-start gap-8 pt-4 border-t-2 border-gray-300">
        
        {/* Mock QR Code representation linking to the tracking page */}
        <div className="flex items-center gap-3 border border-gray-100 p-2 rounded-card select-none">
          <div className="w-16 h-16 bg-gray-100 border border-gray-200 flex flex-col items-center justify-center p-1.5 relative">
            {/* Minimal SVG representation of QR */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-brand-charcoal">
              <rect x="0" y="0" width="25" height="25" fill="currentColor" />
              <rect x="75" y="0" width="25" height="25" fill="currentColor" />
              <rect x="0" y="75" width="25" height="25" fill="currentColor" />
              <rect x="25" y="25" width="10" height="10" fill="currentColor" />
              <rect x="65" y="65" width="10" height="10" fill="currentColor" />
              <rect x="40" y="40" width="20" height="20" fill="currentColor" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              Live Order Trace
            </span>
            <span className="text-[8px] text-gray-500 max-w-[120px] leading-tight mt-0.5">
              Scan this code to track delivery timeline in real-time.
            </span>
          </div>
        </div>

        {/* Totals Table */}
        <div className="w-60 flex flex-col gap-2 text-xs font-semibold text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-black font-bold">₹{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Charges</span>
            <span className="text-black font-bold">
              {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Convenience Fee</span>
            <span className="text-black font-bold">₹{(order.coldHandlingFee || order.convenienceFee || 2).toFixed(2)}</span>
          </div>
          <div className="h-px bg-gray-200 my-1" />
          <div className="flex justify-between text-sm font-black">
            <span className="text-brand-charcoal">Total Invoice Value</span>
            <span className="text-brand-orange">₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

      </div>

      {/* 5. FOOTER */}
      <div className="mt-12 pt-6 border-t border-gray-100 text-center text-[10px] text-gray-400 font-semibold select-none leading-relaxed">
        <p className="text-gray-500 font-bold uppercase tracking-wider text-brand-charcoal">
          Thank you for ordering from Anmol Frozen Express, Latur!
        </p>
        <p className="mt-1">
          For support or returns, call +91 94220 70000 or email contact@anmolexpress.in.
        </p>
      </div>

    </div>
  )
}
