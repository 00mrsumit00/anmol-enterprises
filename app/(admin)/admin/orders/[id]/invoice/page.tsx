'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { 
  Printer, ArrowLeft, Clock, ShieldCheck, CheckCircle2, Phone, Mail, 
  MapPin, AlertCircle, RefreshCw, Send, Check, Loader2, QrCode
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

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
  const { showToast } = useToast()
  const orderId = params.id as string

  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

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

  const handleSendEmail = async () => {
    if (!order) return
    setIsSendingEmail(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/send-invoice-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: order.user?.email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to email invoice')
      setEmailSent(true)
      showToast('Tax Invoice successfully emailed to customer!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to send email', 'error')
    } finally {
      setIsSendingEmail(false)
    }
  }

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-slate-800 text-xs font-semibold bg-gray-50">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-600 font-bold">Generating Official Tax Invoice...</span>
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

  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  })

  // Calculations for 5% GST (McCain frozen food standard HSN 20041000 / Poultry 02071400)
  const gstRate = 0.05
  const taxableSubtotal = order.subtotal / (1 + gstRate)
  const totalCgst = taxableSubtotal * 0.025
  const totalSgst = taxableSubtotal * 0.025
  const totalGst = totalCgst + totalSgst
  const grossValue = taxableSubtotal
  const netReceivable = order.totalAmount
  const roundOff = netReceivable - (taxableSubtotal + totalGst + (order.deliveryFee || 0) + (order.coldHandlingFee || 0) - (order.discountAmount || 0))

  // Dynamic UPI Payment QR Code (Encodes Anmol Enterprises HDFC Current Account UPI)
  const upiQrString = encodeURIComponent(
    `upi://pay?pa=50200019285385@hdfcbank&pn=Anmol%20Enterprises&am=${netReceivable.toFixed(2)}&cu=INR&tn=Invoice%20${order.orderNumber}`
  )
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=4&data=${upiQrString}`

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/admin/orders')
    }
  }

  const buyerName = order.businessName || order.guestName || order.user?.name || 'Valued Customer'
  const buyerGstin = order.user?.businessProfile?.gstin || order.user?.gstin || ''
  const buyerFssai = order.user?.businessProfile?.fssaiNumber || ''
  const buyerPhone = order.guestPhone || order.user?.phone || ''

  return (
    <div className="bg-white min-h-screen text-black p-4 sm:p-8 font-sans max-w-4xl mx-auto border border-gray-300 md:shadow-lg relative print:p-0 print:border-none print:shadow-none text-xs">
      
      {/* 0. ACTION BAR (Hidden on printing) */}
      <div className="no-print flex items-center justify-between pb-4 border-b border-gray-200 mb-6 text-sm">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-gray-700 transition-all active:scale-95 shadow-xs text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        
        <div className="flex items-center gap-2">
          {/* Email Invoice Button */}
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={isSendingEmail}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
            title="Email Tax Invoice to Customer"
          >
            {isSendingEmail ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : emailSent ? (
              <Check className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Mail className="w-3.5 h-3.5" />
            )}
            <span>{emailSent ? 'Invoice Emailed' : 'Email Invoice to Customer'}</span>
          </button>

          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
          </span>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 bg-[#0c831f] hover:bg-[#0a6d1a] text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Bill (PDF)</span>
          </button>
        </div>
      </div>

      {/* ─── INVOICE OUTER BORDER BOX (Matching Offline Bill) ─────────────────── */}
      <div className="border-2 border-black">
        
        {/* Top Header Row with Copies Indicator */}
        <div className="border-b-2 border-black p-2 flex items-center justify-between">
          <div className="flex-1 text-center font-black text-base sm:text-lg tracking-wider uppercase">
            TAX INVOICE
          </div>
          <div className="text-[9px] font-semibold space-y-0.5 border-l border-black pl-3 text-right">
            <div>Original for Recipient &nbsp;&nbsp;&nbsp;[ &nbsp; ]</div>
            <div>Duplicate for Transporter [ &nbsp; ]</div>
            <div>Triplicate for Supplier &nbsp;&nbsp;&nbsp;&nbsp;[ &nbsp; ]</div>
          </div>
        </div>

        {/* ─── SUPPLIER & BUYER GRID ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-black">
          
          {/* Supplier Info (Left: 6 cols) */}
          <div className="md:col-span-6 p-3 border-b-2 md:border-b-0 md:border-r-2 border-black leading-snug">
            <h2 className="font-black text-sm uppercase tracking-tight">M/s Anmol Enterprises</h2>
            <p className="font-semibold text-gray-800 text-[11px]">
              Raje Shivaji Nagar ,Barshi Road,Opp Kiy Moters , Mean Road Latur<br />
              Latur-413512
            </p>
            <div className="mt-2 space-y-0.5 text-[11px] font-medium text-gray-900">
              <div><strong>FSSAI NO:-</strong> 11524049000286</div>
              <div className="flex justify-between">
                <span><strong>State:</strong> Maharashtra</span>
                <span><strong>State Code:</strong> 27</span>
              </div>
              <div><strong>Ph./Mob:</strong> 02382 222424</div>
              <div><strong>GSTIN No:</strong> <span className="font-mono font-bold">27AGEPT8074F1Z0</span></div>
              <div><strong>FSSAI No:</strong> 21520354000259</div>
            </div>
          </div>

          {/* Buyer & Bill Metadata (Right: 6 cols) */}
          <div className="md:col-span-6 grid grid-cols-1 divide-y divide-black">
            
            {/* Buyer Block */}
            <div className="p-3 leading-snug">
              <span className="font-bold text-[10px] uppercase text-gray-600 block">Buyer:</span>
              <h3 className="font-black text-sm uppercase text-gray-900">{buyerName}</h3>
              <p className="text-[11px] text-gray-800 font-medium">
                {order.deliveryAddress || 'Latur City'}<br />
                Latur - {order.deliveryPincode || '413512'}
              </p>
              <div className="mt-1 space-y-0.5 text-[10px]">
                <div><strong>Statecode/Name:</strong> 27 Maharashtra</div>
                {buyerPhone && <div><strong>Ph/Mob No:</strong> +91 {buyerPhone}</div>}
                <div><strong>GSTIN No:</strong> <span className="font-mono font-bold">{buyerGstin || 'Unregistered'}</span></div>
                {buyerFssai && <div><strong>FSSAI No:</strong> {buyerFssai}</div>}
              </div>
            </div>

            {/* Metadata Strip */}
            <div className="p-2.5 grid grid-cols-2 gap-2 text-[10px] bg-gray-50/50">
              <div>
                <div><strong>Bill Date:</strong> {invoiceDate}</div>
                <div><strong>Inv No.:</strong> <span className="font-mono font-bold">{order.orderNumber}</span></div>
                <div><strong>Salesman:</strong> Direct Distribution</div>
              </div>
              <div className="text-right">
                <div><strong>Route:</strong> Latur Local Cold-Chain</div>
                <div><strong>Payment:</strong> {order.paymentMethod.replace(/_/g, ' ')}</div>
                <div><strong>Status:</strong> {order.paymentStatus}</div>
              </div>
            </div>

          </div>
        </div>

        {/* ─── ITEMS TABLE (Matching Offline Bill Format) ────────────────────── */}
        <div className="border-b-2 border-black overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-gray-100 border-b border-black text-gray-900 font-black uppercase text-[9px] tracking-wider">
                <th className="py-2 px-2 text-center w-8 border-r border-black">S. No</th>
                <th className="py-2 px-2 text-center w-18 border-r border-black">HSN Code</th>
                <th className="py-2 px-2 border-r border-black">Item Description</th>
                <th className="py-2 px-1 text-center w-12 border-r border-black">P-CS</th>
                <th className="py-2 px-1 text-right w-16 border-r border-black">SRP Rate</th>
                <th className="py-2 px-1 text-right w-18 border-r border-black">Gross Amt</th>
                <th className="py-2 px-1 text-right w-14 border-r border-black">Disc Amt</th>
                <th className="py-2 px-1 text-right w-18 border-r border-black">Taxable Amt</th>
                <th className="py-2 px-1 text-center w-10 border-r border-black">GST %</th>
                <th className="py-2 px-2 text-right w-20">NetAmt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/30 font-medium">
              {order.items.map((item: any, idx: number) => {
                const lineTotal = item.lineTotal || (item.unitPrice * item.quantity)
                const taxableVal = lineTotal / 1.05
                const srpRate = item.unitPrice / 1.05
                const hsnCode = item.productName?.toLowerCase().includes('chicken') ? '02071400' : '20041000'

                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="py-1.5 px-2 text-center border-r border-black">{idx + 1}</td>
                    <td className="py-1.5 px-2 text-center font-mono border-r border-black">{hsnCode}</td>
                    <td className="py-1.5 px-2 border-r border-black">
                      <span className="font-bold text-gray-900 block">{item.productName}</span>
                      <span className="text-[9px] text-gray-500 font-normal">
                        Pack: {item.packagingType} ({item.weightGrams}g)
                      </span>
                    </td>
                    <td className="py-1.5 px-1 text-center font-bold border-r border-black">{item.quantity}</td>
                    <td className="py-1.5 px-1 text-right font-mono border-r border-black">{srpRate.toFixed(2)}</td>
                    <td className="py-1.5 px-1 text-right font-mono border-r border-black">{taxableVal.toFixed(2)}</td>
                    <td className="py-1.5 px-1 text-right font-mono border-r border-black">0.00</td>
                    <td className="py-1.5 px-1 text-right font-mono font-semibold border-r border-black">{taxableVal.toFixed(2)}</td>
                    <td className="py-1.5 px-1 text-center border-r border-black">5%</td>
                    <td className="py-1.5 px-2 text-right font-black font-mono text-gray-900">{lineTotal.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 border-t-2 border-black font-black text-[10px]">
                <td colSpan={3} className="py-1.5 px-2 text-center uppercase border-r border-black">Total Units</td>
                <td className="py-1.5 px-1 text-center border-r border-black">
                  {order.items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0)}
                </td>
                <td colSpan={3} className="border-r border-black"></td>
                <td className="py-1.5 px-1 text-right font-mono border-r border-black">
                  {taxableSubtotal.toFixed(2)}
                </td>
                <td className="border-r border-black"></td>
                <td className="py-1.5 px-2 text-right font-mono">
                  {order.subtotal.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ─── HSN TAX BREAKDOWN & TOTALS GRID ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-black">
          
          {/* Left: HSN Summary + Bank Details (7 cols) */}
          <div className="md:col-span-7 border-b-2 md:border-b-0 md:border-r-2 border-black p-3 flex flex-col justify-between">
            
            {/* HSN Table */}
            <div>
              <span className="font-bold text-[10px] uppercase text-gray-700 block mb-1">
                GST Tax Summary
              </span>
              <table className="w-full text-[9px] border border-black text-center border-collapse">
                <thead className="bg-gray-100 font-bold border-b border-black">
                  <tr>
                    <th className="p-1 border-r border-black">HSN/SAC</th>
                    <th className="p-1 border-r border-black">Taxable Value</th>
                    <th className="p-1 border-r border-black">CGST (2.5%)</th>
                    <th className="p-1 border-r border-black">SGST (2.5%)</th>
                    <th className="p-1">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <tr>
                    <td className="p-1 border-r border-black font-semibold">20041000</td>
                    <td className="p-1 border-r border-black">{taxableSubtotal.toFixed(2)}</td>
                    <td className="p-1 border-r border-black">{totalCgst.toFixed(2)}</td>
                    <td className="p-1 border-r border-black">{totalSgst.toFixed(2)}</td>
                    <td className="p-1 font-bold">{totalGst.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-gray-50 border-t border-black font-black">
                    <td className="p-1 border-r border-black">Total</td>
                    <td className="p-1 border-r border-black">{taxableSubtotal.toFixed(2)}</td>
                    <td className="p-1 border-r border-black">{totalCgst.toFixed(2)}</td>
                    <td className="p-1 border-r border-black">{totalSgst.toFixed(2)}</td>
                    <td className="p-1">{totalGst.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bank Details & QR Code */}
            <div className="mt-3 pt-3 border-t border-black/40 flex items-center justify-between gap-3">
              <div className="space-y-0.5 text-[10px] leading-tight">
                <span className="font-black uppercase tracking-wider text-gray-900 block mb-1">
                  Company's Bank Details
                </span>
                <div><strong>Bank Name :</strong> HDFC Bank CURRENT A/C 385</div>
                <div><strong>A/c No. :</strong> <span className="font-mono font-bold">50200019285385</span></div>
                <div><strong>Branch & IFS Code:</strong> MG Road Latur & HDFC0000360</div>
                <div className="text-[9px] text-gray-600 mt-1">Scan QR to pay instantly via PhonePe / GPay / Paytm</div>
              </div>

              {/* Dynamic QR Code */}
              <div className="text-center shrink-0 border border-black p-1 bg-white">
                <img
                  src={qrCodeUrl}
                  alt="UPI QR Code"
                  className="w-18 h-18 object-contain"
                />
                <span className="text-[8px] font-bold block uppercase mt-0.5">UPI Scan & Pay</span>
              </div>
            </div>

          </div>

          {/* Right: Totals Calculation Summary (5 cols) */}
          <div className="md:col-span-5 p-3 flex flex-col justify-between text-[11px]">
            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span className="text-gray-700">Gross Value:</span>
                <span className="font-mono font-bold text-gray-900">₹{grossValue.toFixed(2)}</span>
              </div>

              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span className="text-gray-700">Tax Amount (+):</span>
                <span className="font-mono text-gray-900">₹{totalGst.toFixed(2)}</span>
              </div>

              {(order.deliveryFee || 0) > 0 && (
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="text-gray-700">Delivery Charges:</span>
                  <span className="font-mono text-gray-900">₹{order.deliveryFee.toFixed(2)}</span>
                </div>
              )}

              {(order.coldHandlingFee || 0) > 0 && (
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="text-gray-700">Cold-Chain Handling Fee:</span>
                  <span className="font-mono text-gray-900">₹{order.coldHandlingFee.toFixed(2)}</span>
                </div>
              )}

              {(order.discountAmount || 0) > 0 && (
                <div className="flex justify-between border-b border-gray-200 pb-1 text-emerald-700">
                  <span>Discount / Coupon Applied (-):</span>
                  <span className="font-mono font-bold">-₹{order.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between border-b border-gray-200 pb-1 text-gray-600">
                <span>Round Off:</span>
                <span className="font-mono">{roundOff >= 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}</span>
              </div>

              <div className="flex justify-between pt-2 border-t-2 border-black text-sm font-black">
                <span>Net Receivable Amt:</span>
                <span className="font-mono text-base text-[#0c831f]">₹{netReceivable.toFixed(2)}</span>
              </div>
            </div>

            {/* Amount In Words */}
            <div className="mt-3 pt-2 border-t border-black/30">
              <span className="text-[9px] font-bold text-gray-600 uppercase block">Amount in words:</span>
              <p className="text-[10px] font-bold text-gray-900 italic mt-0.5">
                {numberToWordsINR(netReceivable)}
              </p>
            </div>

          </div>

        </div>

        {/* ─── DECLARATION & SIGNATURE BLOCK (Matching Offline Bill) ──────────── */}
        <div className="p-3">
          <p className="text-[9px] text-gray-700 leading-tight">
            <strong>Declaration:</strong><br />
            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. FOOD & DRUG LIC.NO.11524049000286
          </p>

          <div className="flex items-end justify-between pt-6 mt-4 text-[10px] font-bold">
            <div className="border-t border-black pt-1 w-44 text-center">
              BUYER'S SIGNATURE
            </div>

            <div className="text-right">
              <div className="text-[11px] font-black uppercase">For : M/s Anmol Enterprises</div>
              <div className="mt-8 border-t border-black pt-1 w-44 text-center ml-auto">
                Authorised Signatory
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* System Footer Note */}
      <div className="mt-3 text-center text-[9px] text-gray-400 select-none">
        This is an official computer-generated tax invoice issued by M/s Anmol Enterprises, Barshi Road, Latur. Valid under the Indian IT & GST Act.
      </div>

    </div>
  )
}
