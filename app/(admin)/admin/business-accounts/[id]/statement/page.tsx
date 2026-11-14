'use client'

import React, { Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Printer, ArrowLeft, Building2, Phone, Mail, FileText, Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

function AdminCustomerBankStatementContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const userId = params?.id as string
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-customer-bank-statement', userId, from, to],
    queryFn: async () => {
      if (!userId) return null
      let url = `/api/admin/users/${userId}/ledger`
      if (from && to) {
        url = `/api/admin/users/${userId}/ledger?from=${from}&to=${to}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch ledger statement')
      return res.json()
    },
    enabled: Boolean(userId)
  })

  const customer = data?.customer || {}
  const period = data?.period || {}
  const summary = data?.summary || {}
  const transactions = data?.transactions || []
  const openingBalance = data?.openingBalance || 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-600">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-sm font-bold">Generating Official Statement Document...</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-800">
        <p className="text-base font-bold text-rose-600 mb-3">Failed to load ledger statement</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white text-slate-900 select-none">
      {/* ─── FLOATING ACTION BAR (Hidden in print) ─────────────────────────── */}
      <div className="max-w-[210mm] mx-auto mb-6 flex items-center justify-between no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-md">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Registered Accounts</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Admin Statement View • Formatted for <strong>A4 Portrait</strong>
          </span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* ─── OFFICIAL BANK STATEMENT DOCUMENT (A4 Standard) ────────────────── */}
      <div className="max-w-[210mm] mx-auto bg-white p-8 sm:p-10 rounded-3xl print:rounded-none border border-slate-200 print:border-none shadow-xl print:shadow-none space-y-6">
        
        {/* 1. Official Header & Letterhead */}
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
                McCain Foods India • Cold-Chain Frozen Food Wholesale & Commercial Credit Ledger
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                Raje Shivaji Nagar, Barshi Road, Opp. Kiya Motors, Latur - 413512, Maharashtra<br />
                <strong>GSTIN:</strong> 27AGEPT8074F1Z0 | <strong>FSSAI:</strong> 11524049000286 | <strong>Phone:</strong> 02382 222424 | <strong>Email:</strong> anmolenterprizes2026@gmail.com
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Official Document
              </span>
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                Account Statement
              </h2>
              <div className="text-[11px] font-mono text-slate-600 mt-1">
                <p><strong>Period:</strong> {period.formattedFrom || '-'} to {period.formattedTo || '-'}</p>
                <p><strong>Generated:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Account Holder & Statement Metadata (Bank Box Grid) */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Account Holder Details
            </span>
            <p className="text-sm font-extrabold text-slate-900">
              {customer.businessName || customer.name}
            </p>
            <p className="text-slate-600">
              <strong>Contact:</strong> {customer.name} • +91 {customer.phone}
            </p>
            <p className="text-slate-600">
              <strong>Email:</strong> {customer.email}
            </p>
            <p className="text-slate-600">
              <strong>GSTIN:</strong> {customer.gstin || 'Unregistered'}
            </p>
          </div>

          <div className="space-y-1 sm:text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Facility & Credit Terms
            </span>
            <p className="text-sm font-extrabold text-slate-900 font-mono">
              A/C ID: AE-B2B-{customer.id ? customer.id.slice(-6).toUpperCase() : '000000'}
            </p>
            <p className="text-slate-600">
              <strong>Facility Type:</strong> Revolving B2B Credit Account
            </p>
            <p className="text-slate-600 font-mono">
              <strong>Approved Credit Limit:</strong> ₹{(customer.creditLimit || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-slate-600 font-mono">
              <strong>Current Available Limit:</strong> ₹{(customer.creditAvailable || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* 3. 4-Box Bank Financial Summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Opening Balance (B/F)</span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 block mt-1 font-mono">
              ₹{openingBalance.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">As of {period.formattedFrom}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-rose-500 block">Total Debits (+)</span>
            <span className="text-base sm:text-lg font-extrabold text-rose-600 block mt-1 font-mono">
              ₹{(summary.totalDebit || 0).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Invoiced Orders</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Total Credits (-)</span>
            <span className="text-base sm:text-lg font-extrabold text-emerald-700 block mt-1 font-mono">
              ₹{(summary.totalCredit || 0).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Payments & Top-ups</span>
          </div>

          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-900 block">Closing Balance</span>
            <span className="text-base sm:text-lg font-extrabold text-amber-950 block mt-1 font-mono">
              ₹{(summary.closingBalance || 0).toFixed(2)}
            </span>
            <span className="text-[10px] text-amber-700 font-black block mt-0.5">Net Outstanding Due</span>
          </div>
        </div>

        {/* 4. Bank Statement Transactions Table */}
        <div className="space-y-2 pt-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-300">
                <th className="py-2.5 px-2.5 w-24">Date</th>
                <th className="py-2.5 px-2.5 w-28">Ref / Inv #</th>
                <th className="py-2.5 px-2.5">Description / Particulars</th>
                <th className="py-2.5 px-2.5 w-24">Mode</th>
                <th className="py-2.5 px-2.5 text-right w-24 text-rose-600">Debit (₹)</th>
                <th className="py-2.5 px-2.5 text-right w-24 text-emerald-700">Credit (₹)</th>
                <th className="py-2.5 px-2.5 text-right w-28">Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Opening Balance Row */}
              <tr className="bg-slate-50/50 font-semibold italic text-[11px] text-slate-600">
                <td className="py-2.5 px-2.5 font-mono">{period.formattedFrom}</td>
                <td className="py-2.5 px-2.5 font-mono">-</td>
                <td className="py-2.5 px-2.5 font-bold text-slate-800">OPENING BALANCE B/F</td>
                <td className="py-2.5 px-2.5">-</td>
                <td className="py-2.5 px-2.5 text-right font-mono">0.00</td>
                <td className="py-2.5 px-2.5 text-right font-mono">0.00</td>
                <td className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-900">
                  ₹{openingBalance.toFixed(2)}
                </td>
              </tr>

              {/* Transactions */}
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                    No transactions recorded for this account in the selected period.
                  </td>
                </tr>
              ) : (
                transactions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/40">
                    <td className="py-2.5 px-2.5 font-mono text-slate-500 text-[11px]">{t.formattedDate}</td>
                    <td className="py-2.5 px-2.5 font-mono font-bold text-slate-800 text-[11px]">{t.invoiceNumber}</td>
                    <td className="py-2.5 px-2.5 text-slate-800 max-w-[200px] truncate" title={t.particulars}>
                      {t.particulars}
                    </td>
                    <td className="py-2.5 px-2.5 text-[10px] font-semibold uppercase text-slate-500">{t.paymentMethod}</td>
                    <td className="py-2.5 px-2.5 text-right font-mono font-bold text-rose-600">
                      {t.debit > 0 ? `₹${t.debit.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono font-bold text-emerald-700">
                      {t.credit > 0 ? `₹${t.credit.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono font-extrabold text-slate-900">
                      ₹{t.runningBalance.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}

              {/* Totals Row */}
              <tr className="bg-slate-100/80 font-black text-xs border-t-2 border-slate-300">
                <td colSpan={4} className="py-3 px-2.5 uppercase tracking-wider text-slate-700">
                  Statement Totals & Closing Outstanding
                </td>
                <td className="py-3 px-2.5 text-right font-mono text-rose-700">
                  ₹{(summary.totalDebit || 0).toFixed(2)}
                </td>
                <td className="py-3 px-2.5 text-right font-mono text-emerald-800">
                  ₹{(summary.totalCredit || 0).toFixed(2)}
                </td>
                <td className="py-3 px-2.5 text-right font-mono text-amber-900 text-sm">
                  ₹{(summary.closingBalance || 0).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. Settlement Bank Account Details & Authorized Signatory */}
        <div className="pt-5 border-t-2 border-slate-900 grid grid-cols-2 gap-4 text-xs items-end">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Bank Remittance Clearance Details</span>
            <p className="text-slate-800 font-bold">M/S ANMOL ENTERPRISES</p>
            <p className="text-slate-600">Bank: <strong>HDFC Bank / ICICI Bank</strong> • Current A/C</p>
            <p className="text-slate-600 font-mono">A/C No: <strong>023820260012</strong> • IFSC: <strong>HDFC0000238</strong></p>
            <p className="text-slate-600 font-mono">UPI ID: <strong>anmolenterprises@icici</strong></p>
          </div>

          <div className="text-center space-y-1">
            <div className="w-44 border-b border-dashed border-slate-400 mx-auto mb-1" />
            <span className="text-[10px] uppercase font-black text-slate-800 block">
              For M/S Anmol Enterprises
            </span>
            <span className="text-[9px] text-slate-500 block font-semibold">
              Authorized Accounts Signatory (Computer Generated)
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function AdminCustomerBankStatementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-600">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
          <p className="text-sm font-bold">Generating Official Statement Document...</p>
        </div>
      }
    >
      <AdminCustomerBankStatementContent />
    </Suspense>
  )
}
