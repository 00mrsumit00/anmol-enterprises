'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function B2BBanner() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchMe = () => {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) setUser(data.user)
          else setUser(null)
        })
        .catch(() => setUser(null))
    }
    fetchMe()
    const onAuth = () => fetchMe()
    window.addEventListener('auth-change', onAuth)
    return () => window.removeEventListener('auth-change', onAuth)
  }, [])

  const isB2B = Boolean(user?.isB2B)

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-[#161B26] to-slate-950 border border-white/10 p-5 md:p-6 shadow-xl no-print">
      
      {/* Absolute Decorative Icon */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
        <Building2 className="w-40 h-40 text-white" />
      </div>

      <div className="max-w-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        
        {/* Left Side */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-amber-400 text-slate-950 font-black tracking-widest uppercase px-2 py-0.5 rounded-md">
              Wholesale Pricing
            </span>
            {isB2B ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-extrabold tracking-wide uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> B2B Partner Active
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Authorized McCain Regional Distribution
              </span>
            )}
          </div>

          <h3 className="font-display text-base sm:text-lg font-bold text-white tracking-tight">
            {isB2B 
              ? `Commercial Wholesale Pricing Active (${user.businessName || 'Business Partner'})`
              : 'Buying Bulk for a Hotel, Cafe, or Retail Store?'}
          </h3>

          <p className="font-body text-xs text-slate-300 max-w-xl leading-relaxed">
            {isB2B 
              ? 'Your account is verified for wholesale master cartons, direct cold-chain logistics, and dedicated account manager support.'
              : 'Order in Box or Carton packs and save up to 20% on all McCain frozen products. Business accounts are verified by admin for exclusive wholesale pricing.'}
          </p>
        </div>

        {/* Right Side Action Button (Informational Link - No Self-Conversion Toggle) */}
        <div className="shrink-0">
          {isB2B ? (
            <Link
              href="/account"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all shadow-md active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Manage B2B Account</span>
            </Link>
          ) : (
            <Link
              href="/b2b-guide"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-lg shadow-amber-400/20 active:scale-95"
            >
              <span>Explore B2B Guide</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

      </div>
    </div>
  )
}
