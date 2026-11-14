'use client'

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { 
  Printer, ArrowLeft, TrendingUp, ShoppingBag, Truck, Package, 
  FileText, ShieldCheck, CheckCircle2, DollarSign, Calendar, Loader2
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function SalesPurchaseReportPDFContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const range = searchParams.get('range') || '30days'
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  // Fetch report data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-reports-pdf', range, startDate, endDate],
    queryFn: async () => {
      let url = `/api/admin/reports?range=${range}`
      if (startDate && endDate) {
        url = `/api/admin/reports?startDate=${startDate}&endDate=${endDate}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load report analytics')
      return res.json()
    }
  })

  const summary = data?.summary || {}
  const topProducts = data?.topProducts || []
  const purchaseBatches = data?.purchaseBatches || []
  const dailyTrends = data?.dailyTrends || []
  const paymentMethods = data?.paymentMethodCounts || {}

  // Format date label
  const rangeLabel = startDate && endDate
    ? `${startDate} to ${endDate}`
    : range === 'today'
    ? 'Today'
    : range === '7days'
    ? 'Last 7 Days'
    : range === 'year'
    ? 'Current Financial Year'
    : 'Last 30 Days'

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white text-slate-900 select-none">
      {/* ─── FLOATING ACTION BAR (Hidden on Print) ─────────────────────────── */}
      <div className="max-w-[210mm] mx-auto mb-6 flex items-center justify-between no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-md">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Print layout formatted for <strong>A4 Portrait</strong>
          </span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* ─── OFFICIAL PRINTABLE DOCUMENT (A4 Standard) ────────────────────── */}
      <div className="max-w-[210mm] mx-auto bg-white p-8 sm:p-10 rounded-3xl print:rounded-none border border-slate-200 print:border-none shadow-xl print:shadow-none space-y-6">
        
        {/* 1. Header & Distributor Letterhead */}
        <div className="border-b-2 border-slate-900 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-950 tracking-tight font-display">
                  M/S ANMOL ENTERPRISES
                </span>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-300">
                  Authorized Distributor
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 mt-0.5">
                McCain Foods India • Cold-Chain Frozen Food Wholesale & Logistics
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                Raje Shivaji Nagar, Barshi Road, Opp. Kiya Motors, Latur - 413512, Maharashtra<br />
                <strong>GSTIN:</strong> 27AGEPT8074F1Z0 | <strong>FSSAI:</strong> 11524049000286 | <strong>Phone:</strong> 02382 222424
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Official Report
              </span>
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                Sales & Purchase Audit
              </h2>
              <div className="text-[11px] font-mono text-slate-600 mt-1">
                <p><strong>Period:</strong> {rangeLabel}</p>
                <p><strong>Generated:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Executive Financial KPI Summary Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Sales Revenue</span>
            <span className="text-lg font-extrabold text-slate-900 block mt-1 font-mono">
              ₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              B2B: ₹{(summary.b2bRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Inward Purchases</span>
            <span className="text-lg font-extrabold text-slate-900 block mt-1 font-mono">
              ₹{(summary.totalPurchaseSpend || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">
              Units: {(summary.totalPurchasedUnits || 0).toLocaleString('en-IN')} packs
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Gross Profit (Est.)</span>
            <span className="text-lg font-extrabold text-emerald-700 block mt-1 font-mono">
              ₹{(summary.grossProfit || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-800 font-black block mt-0.5">
              Margin: {summary.grossMarginPercent || 0}%
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Fulfillment</span>
            <span className="text-lg font-extrabold text-slate-900 block mt-1 font-mono">
              {summary.deliveredCount || 0} / {summary.totalOrders || 0}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
              Avg Order: ₹{(summary.averageOrderValue || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* 3. Tax / GST Statutory Reconciliation Box */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/90 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
              GST & Tax Position Estimate (HSN 2004 / 2106 • Standard 18% Frozen Foods)
            </span>
            <span className="text-[10px] font-bold text-slate-500">Subject to final GSTR-3B filing</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Estimated Output GST (Sales)</span>
              <span className="text-sm font-extrabold text-slate-900 font-mono mt-0.5 block">
                ₹{(summary.outputGstEstimate || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Input Tax Credit (Purchases)</span>
              <span className="text-sm font-extrabold text-blue-700 font-mono mt-0.5 block">
                ₹{(summary.inputGstCreditEstimate || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Estimated Net Tax Payable</span>
              <span className="text-sm font-extrabold text-amber-700 font-mono mt-0.5 block">
                ₹{(summary.netGstPayable || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Sales Velocity: Top Selling Products */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
              Top Selling Products by Sales Velocity & Revenue
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">Ranked by turnover</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-2 px-2.5 w-10 text-center">#</th>
                <th className="py-2 px-2.5">Product Description</th>
                <th className="py-2 px-2.5 text-right w-28">Units Sold</th>
                <th className="py-2 px-2.5 text-right w-36">Total Sales (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400 italic">No sales recorded in this period.</td>
                </tr>
              ) : (
                topProducts.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-2.5 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                    <td className="py-2 px-2.5 font-bold text-slate-800">{p.name}</td>
                    <td className="py-2 px-2.5 text-right font-mono text-slate-700 font-semibold">{p.quantity} packs</td>
                    <td className="py-2 px-2.5 text-right font-mono font-extrabold text-slate-900">
                      ₹{p.revenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Inward Stock & Restocks: Inward Purchases Log */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
              Inward Stock & Purchases Log (McCain Foods India Supplies)
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">FEFO Batch Inward Tracking</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-2 px-2.5 w-24">Date</th>
                <th className="py-2 px-2.5 w-28">Batch / Invoice</th>
                <th className="py-2 px-2.5">Product / Category</th>
                <th className="py-2 px-2.5 text-right w-24">Inward Qty</th>
                <th className="py-2 px-2.5 text-right w-24">Cost / Pack</th>
                <th className="py-2 px-2.5 text-right w-32">Total Spend (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseBatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400 italic">No inward restock batches registered in this period.</td>
                </tr>
              ) : (
                purchaseBatches.map((b: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-2.5 font-mono text-slate-500 text-[11px]">{b.createdAt}</td>
                    <td className="py-2 px-2.5 font-mono font-bold text-slate-800 text-[11px]">
                      {b.batchNumber}
                      {b.invoiceNo && b.invoiceNo !== 'N/A' && (
                        <span className="block text-[9px] text-slate-400 font-normal">Inv: {b.invoiceNo}</span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-slate-800">
                      <span className="font-bold block">{b.productName}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{b.packagingType}</span>
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-slate-700 font-semibold">{b.quantity}</td>
                    <td className="py-2 px-2.5 text-right font-mono text-slate-600">₹{b.unitCost}</td>
                    <td className="py-2 px-2.5 text-right font-mono font-extrabold text-slate-900">
                      ₹{b.totalCost.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 6. Footer Disclaimer & Authorized Signatory Block */}
        <div className="pt-6 border-t-2 border-slate-900 flex items-end justify-between text-xs">
          <div className="space-y-1 max-w-sm">
            <p className="text-[10px] text-slate-500 leading-tight">
              <strong>Declaration:</strong> This document is an official, computer-generated Sales and Purchase Audit Report extracted directly from the Anmol Enterprises central ERP ledger.
            </p>
            <p className="text-[9px] text-slate-400 font-mono">
              Report Ref: RPT-{range.toUpperCase()}-{Date.now().toString().slice(-6)} • System Host: api.anmolenterprisess.in
            </p>
          </div>

          <div className="text-center shrink-0">
            <div className="w-40 border-b border-dashed border-slate-400 mb-1" />
            <span className="text-[10px] uppercase font-black text-slate-800 block">
              For M/S Anmol Enterprises
            </span>
            <span className="text-[9px] text-slate-400 block font-semibold">
              Authorized Accounts Signatory
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function SalesPurchaseReportPDFPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-600">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
          <p className="text-sm font-bold">Generating Executive Sales & Purchase Analytics Report...</p>
        </div>
      }
    >
      <SalesPurchaseReportPDFContent />
    </Suspense>
  )
}
