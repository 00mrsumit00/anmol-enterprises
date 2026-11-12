'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Zap,
  Sparkles,
  Lock
} from 'lucide-react'
import RazorpayCheckoutButton from '@/components/RazorpayCheckoutButton'
import confetti from 'canvas-confetti'

export default function RazorpayDemoPage() {
  const [testAmount, setTestAmount] = useState<number>(100)
  const [lastPayment, setLastPayment] = useState<any>(null)

  const handleSuccess = (data: any) => {
    setLastPayment(data)
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Storefront</span>
        </Link>

        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-xl text-slate-900 tracking-tight">
                  Razorpay Standard Checkout
                </h1>
                <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Test Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full-flow order creation, popup checkout & HMAC-SHA256 signature verification
              </p>
            </div>
          </div>
        </div>

        {/* Demo Payment Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select or Enter Test Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-lg">₹</span>
              <input
                type="number"
                min="1"
                step="1"
                value={testAmount}
                onChange={(e) => setTestAmount(Math.max(1, Number(e.target.value) || 1))}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl font-bold text-slate-900 text-lg outline-none transition-all"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 pt-1">
              {[1, 50, 100, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTestAmount(amt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    testAmount === amt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Checkout Button Component */}
          <div className="pt-2">
            <RazorpayCheckoutButton
              amount={testAmount}
              currency="INR"
              name="Anmol Enterprises"
              description="Standard Web Checkout Test"
              prefill={{
                name: 'Sumit Sharma',
                email: 'test@anmolenterprises.in',
                contact: '9876543210'
              }}
              onSuccess={handleSuccess}
            />
          </div>

          {/* Security & Credentials Pill */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Integration Status</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
              <div>
                <span className="block font-semibold text-slate-400 uppercase text-[9px]">Key ID:</span>
                <span className="font-mono text-slate-800">rzp_test_TzBHN...GERncf</span>
              </div>
              <div>
                <span className="block font-semibold text-slate-400 uppercase text-[9px]">Endpoints:</span>
                <span className="font-mono text-slate-800">/api/create-order, /api/verify-payment</span>
              </div>
            </div>
          </div>

          {/* Success Card */}
          {lastPayment && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Payment Verified Successfully!</span>
              </div>
              <div className="space-y-1 text-xs text-emerald-900 font-medium pt-1 font-mono">
                <p>Payment ID: <span className="font-bold">{lastPayment.payment_id}</span></p>
                <p>Order ID: <span className="font-bold">{lastPayment.order_id}</span></p>
                <p className="truncate text-[10px] text-emerald-700">Signature: {lastPayment.signature}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
