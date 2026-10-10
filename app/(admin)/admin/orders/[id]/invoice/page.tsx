'use client'

import React, { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Printer, ArrowLeft, Clock, ShieldCheck, CheckCircle2, Phone, Mail, MapPin, AlertCircle, RefreshCw } from 'lucide-react'

function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount)
  if (rounded === 0) return 'Rupees Zero Only'

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const numToWords = (n: number): string => {
    if (n < 20) return a[n]
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '')
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + numToWords(n % 100) : '')
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numToWords(n % 1000) : '')
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + numToWords(n % 100000) : '')
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + numToWords(n % 10000000) : '')
  }

  return 'Rupees ' + numToWords(rounded) + ' Only'
}

export default function PrintInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  // Fetch order detail
  const { data: order, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['invoice-order', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to load order (HTTP ${res.status})`)
      }
      return res.json()
    },
    retry: 2
  })

  // Trigger print dialog only if order is CONFIRMED / active
  useEffect(() => {
    if (order && order.status !== 'PENDING') {
      const timer = setTimeout(() => {
        window.print()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [order])

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white max-w-md w-full rounded-2xl border border-red-200 p-8 shadow-lg text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 px-3 py-1 rounded-full">
              Invoice Error
            </span>
            <h2 className="text-xl font-black text-gray-900 mt-3">
              Unable to Generate Tax Invoice
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {(error as Error)?.message || 'Could not fetch order details from the server.'}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full mt-2">
            <button
              onClick={() => router.push('/admin/orders')}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </button>
            <button
              onClick={() => refetch()}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-brand-charcoal text-xs font-semibold bg-gray-50">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-600 font-bold">Generating Tax Invoice...</span>
      </div>
    )
  }

  // Gate: User can only see tax invoice after order is confirmed
  if (order.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white max-w-md w-full rounded-3xl border border-gray-200 p-8 shadow-xl text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
              Order Status: Pending Confirmation
            </span>
            <h2 className="text-xl font-black text-gray-900 mt-3">
              Tax Invoice Not Ready Yet
            </h2>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Order <strong className="text-gray-800">#{order.orderNumber}</strong> is currently pending confirmation. The official Tax Invoice draft will be automatically generated and made available once the order is confirmed.
            </p>
          </div>
          <div className="w-full flex flex-col gap-2 pt-2">
            <button
              onClick={() => router.push('/account')}
              className="w-full py-2.5 px-4 bg-[#0c831f] hover:bg-[#0a6d1a] text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              Return to My Account
            </button>
            <button
              onClick={() => router.push(`/order/${order.id}`)}
              className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-all"
            >
              Track Order Status
            </button>
          </div>
        </div>
      </div>
    )
  }

  const formattedDeliveryDate = new Date(order.deliveryDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  // Calculations for 5% GST (McCain frozen food standard HSN 20041000)
  const gstRate = 0.05
  const taxableSubtotal = order.subtotal / (1 + gstRate)
  const totalCgst = taxableSubtotal * 0.025
  const totalSgst = taxableSubtotal * 0.025
  const totalGst = totalCgst + totalSgst
  const deliveryFee = order.deliveryFee || 0
  const coldHandlingFee = order.coldHandlingFee || order.convenienceFee || 0

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/account')
    }
  }

  return (
    <div className="bg-white min-h-screen text-black p-4 sm:p-8 font-sans max-w-4xl mx-auto border border-gray-200 md:shadow-lg relative print:p-0 print:border-none print:shadow-none">
      
      {/* 0. ACTION BAR (Hidden on printing) */}
      <div className="no-print flex items-center justify-between pb-4 border-b border-gray-200 mb-6 text-sm">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-gray-700 transition-all active:scale-95 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed Order
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 bg-[#0c831f] hover:bg-[#0a6d1a] text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* 1. HEADER */}
      <div className="border-b-2 border-black pb-4 mb-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-start gap-3.5">
            <img
              src="/images/logo.png"
              alt="Anmol Enterprises"
              className="h-16 w-auto object-contain"
            />
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 leading-none">
                ANMOL ENTERPRISES
              </h1>
              <span className="text-[11px] font-extrabold text-[#0c831f] tracking-wide mt-1 uppercase">
                Authorised McCain Frozen Foods Wholesale & Cold-Chain Logistics
              </span>
              <p className="text-[10px] text-gray-600 leading-tight mt-1">
                Shop No. 12-14, Anmol Commercial Complex, Near Market Yard, Latur - 413512, Maharashtra<br />
                <strong>GSTIN:</strong> 27AABCA7000A1Z1 | <strong>State Code:</strong> 27 (Maharashtra)<br />
                <strong>FSSAI Lic. No:</strong> 11521045000123 | <strong>Helpline:</strong> +91 94220 70000
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="inline-block bg-black text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-sm mb-1.5">
              Tax Invoice
            </div>
            <div className="text-[10px] text-gray-700 font-semibold leading-tight text-right space-y-0.5">
              <p>Invoice No: <strong className="text-black font-mono">INV-{order.orderNumber}</strong></p>
              <p>Invoice Date: <strong className="text-black">{invoiceDate}</strong></p>
              <p>Place of Supply: <strong className="text-black">Maharashtra (27)</strong></p>
              <p>Reverse Charge: <strong className="text-black">No</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CUSTOMER & DELIVERY BLOCK */}
      <div className="grid grid-cols-2 gap-4 border border-gray-300 rounded-lg p-3.5 mb-4 text-xs bg-gray-50/50">
        <div className="border-r border-gray-300 pr-4">
          <span className="font-black text-gray-500 uppercase tracking-wider text-[10px] block mb-1">
            Details of Receiver / Billed To:
          </span>
          <p className="font-black text-gray-900 text-sm">
            {order.businessName || order.guestName || order.user?.name || 'Valued Customer'}
          </p>
          {order.businessName && (order.guestName || order.user?.name) && (
            <p className="text-[11px] font-semibold text-gray-700">
              Attn: {order.guestName || order.user?.name}
            </p>
          )}
          <p className="text-gray-600 mt-1 leading-snug">
            {order.deliveryAddress}, {order.deliveryCity} - {order.deliveryPincode}
          </p>
          <p className="text-gray-800 font-bold mt-1">
            Phone: +91 {order.guestPhone || order.user?.phone || 'N/A'}
          </p>
          <p className="text-gray-600 text-[10px] mt-0.5">
            GSTIN: <strong className="text-black font-mono">{order.user?.gstin || 'Unregistered / Consumer'}</strong>
          </p>
        </div>

        <div className="pl-2 flex flex-col justify-between">
          <div>
            <span className="font-black text-gray-500 uppercase tracking-wider text-[10px] block mb-1">
              Dispatch & Delivery Schedule:
            </span>
            <p className="text-gray-800">
              Requested Slot: <strong className="text-black">{formattedDeliveryDate} ({order.deliverySlot})</strong>
            </p>
            <p className="text-gray-800 mt-0.5">
              Payment Method: <strong className="text-black uppercase">{order.paymentMethod.replace(/_/g, ' ')}</strong>
            </p>
            <p className="text-gray-800 mt-0.5">
              Payment Status: <strong className={`uppercase ${order.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>{order.paymentStatus}</strong>
            </p>
          </div>
          {order.driver && (
            <div className="text-[10px] text-gray-600 bg-white p-2 rounded border border-gray-200 mt-2">
              Assigned Driver: <strong>{order.driver.name}</strong> ({order.driver.phone}) • Vehicle: <strong>{order.driver.vehicleNumber}</strong>
            </div>
          )}
        </div>
      </div>

      {/* 3. ITEMS TABLE */}
      <div className="mb-4 overflow-hidden border border-gray-300 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-black uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3 w-8 text-center">#</th>
              <th className="py-2.5 px-3">Description of Goods</th>
              <th className="py-2.5 px-2 text-center w-20">HSN Code</th>
              <th className="py-2.5 px-2 text-center w-12">Qty</th>
              <th className="py-2.5 px-2 text-right w-20">Unit Rate</th>
              <th className="py-2.5 px-2 text-right w-20">Taxable Val</th>
              <th className="py-2.5 px-2 text-right w-20">GST (5%)</th>
              <th className="py-2.5 px-3 text-right w-24">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.items.map((item: any, idx: number) => {
              const itemTotal = item.lineTotal
              const itemTaxable = itemTotal / 1.05
              const itemGst = itemTotal - itemTaxable
              const unitRate = item.unitPrice / 1.05

              return (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="py-2 px-3 text-center text-gray-500 font-semibold">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <span className="font-bold text-gray-900 block">{item.productName}</span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      SKU: {item.variantSku} • Pack: {item.packagingType} ({item.weightGrams}g)
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-[11px] text-gray-600">20041000</td>
                  <td className="py-2 px-2 text-center font-bold text-gray-900">{item.quantity}</td>
                  <td className="py-2 px-2 text-right font-mono text-gray-700">₹{unitRate.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right font-mono text-gray-700">₹{itemTaxable.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right font-mono text-gray-600 text-[11px]">₹{itemGst.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-black font-mono text-gray-900">₹{itemTotal.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 4. TOTALS & SUMMARY BLOCK */}
      <div className="grid grid-cols-2 gap-6 pt-2 pb-4 border-b border-gray-300">
        <div className="flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
              Amount In Words:
            </span>
            <p className="text-xs font-bold text-gray-800 italic bg-gray-50 p-2.5 rounded border border-gray-200">
              {numberToWordsINR(order.totalAmount)}
            </p>
          </div>

          <div className="mt-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
              GST Breakdown Summary (HSN: 20041000):
            </span>
            <table className="w-full text-[10px] border border-gray-200 text-center">
              <thead className="bg-gray-100 font-bold text-gray-700">
                <tr>
                  <th className="p-1 border border-gray-200">Taxable Value</th>
                  <th className="p-1 border border-gray-200">CGST (2.5%)</th>
                  <th className="p-1 border border-gray-200">SGST (2.5%)</th>
                  <th className="p-1 border border-gray-200">Total Tax</th>
                </tr>
              </thead>
              <tbody className="font-mono text-gray-800">
                <tr>
                  <td className="p-1 border border-gray-200">₹{taxableSubtotal.toFixed(2)}</td>
                  <td className="p-1 border border-gray-200">₹{totalCgst.toFixed(2)}</td>
                  <td className="p-1 border border-gray-200">₹{totalSgst.toFixed(2)}</td>
                  <td className="p-1 border border-gray-200 font-bold">₹{totalGst.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">Taxable Subtotal</span>
            <span className="font-mono font-semibold text-gray-900">₹{taxableSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">CGST (2.5%)</span>
            <span className="font-mono text-gray-700">₹{totalCgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">SGST (2.5%)</span>
            <span className="font-mono text-gray-700">₹{totalSgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">Delivery Charges</span>
            <span className="font-mono text-gray-900 font-semibold">
              {deliveryFee === 0 ? '₹0.00 (FREE)' : `₹${deliveryFee.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">Cold-Chain Handling Fee</span>
            <span className="font-mono text-gray-900 font-semibold">₹{coldHandlingFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-black mt-1 text-sm font-black">
            <span className="text-gray-900">Total Invoice Value (INR)</span>
            <span className="font-mono text-base text-[#0c831f]">₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 5. TERMS & SIGNATURE BLOCK */}
      <div className="grid grid-cols-2 gap-6 pt-4 text-[10px] text-gray-600 leading-normal">
        <div>
          <span className="font-bold uppercase text-gray-700 block mb-1">
            Terms & Conditions:
          </span>
          <ol className="list-decimal pl-3 space-y-0.5">
            <li>Mandatory Storage: Keep frozen at -18°C or below at all times.</li>
            <li>Goods once sold are non-returnable unless damaged upon delivery handover.</li>
            <li>Any temperature excursion must be reported within 2 hours of receipt.</li>
            <li>All disputes are subject to Latur Jurisdiction only.</li>
          </ol>
        </div>

        <div className="text-right flex flex-col justify-between items-end">
          <div>
            <span className="font-black text-gray-900 text-xs block">For ANMOL ENTERPRISES</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-wider block mt-0.5">Authorised McCain Distributor</span>
          </div>
          <div className="mt-8 border-t border-gray-400 pt-1 w-44 text-center">
            <span className="font-semibold text-gray-700">Authorised Signatory</span>
          </div>
        </div>
      </div>

      {/* 6. SYSTEM FOOTER */}
      <div className="mt-6 pt-3 border-t border-gray-200 text-center text-[9px] text-gray-400 select-none">
        This is a computer-generated tax invoice issued by Anmol Enterprises, Latur. Valid without physical signature under Indian IT Act.
      </div>

    </div>
  )
}
