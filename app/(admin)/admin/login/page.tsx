'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Phone, Snowflake, ArrowRight, Eye, EyeOff, Shield } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

// ─── ANIMATED GRID BACKGROUND ─────────────────────────────────────────────────

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(12,131,31,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(34,211,238,0.06) 0%, transparent 60%), #080d14',
        }}
      />
      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      {/* Floating orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #0c831f 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-10"
        style={{ background: 'radial-gradient(circle, #22d3ee 0%, transparent 70%)' }}
      />
      {/* Animated scan line */}
      <div
        className="absolute left-0 right-0 h-px opacity-20"
        style={{
          background: 'linear-gradient(90deg, transparent, #22d3ee, transparent)',
          animation: 'scanline 6s linear infinite',
          top: '30%',
        }}
      />
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100vh); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ─── INPUT FIELD ──────────────────────────────────────────────────────────────

function InputField({
  icon: Icon,
  label,
  type,
  placeholder,
  value,
  onChange,
  rightElement,
  autoComplete,
}: {
  icon: any
  label: string
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  rightElement?: React.ReactNode
  autoComplete?: string
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-[0.12em] pl-1" style={{ color: '#64748b' }}>
        {label}
      </label>
      <div
        className="relative flex items-center rounded-xl transition-all duration-200 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(34,211,238,0.35)' : 'rgba(255,255,255,0.07)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(34,211,238,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
        }}
      >
        {/* Icon zone */}
        <div
          className="absolute left-0 top-0 bottom-0 flex items-center justify-center px-3.5 pointer-events-none"
          style={{ borderRight: '1px solid rgba(255,255,255,0.05)', width: '44px' }}
        >
          <Icon className="w-4 h-4" style={{ color: focused ? '#22d3ee' : '#475569' }} strokeWidth={focused ? 2.5 : 1.8} />
        </div>
        <input
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent text-sm font-medium text-slate-200 placeholder-slate-600 pl-14 pr-4 py-3 focus:outline-none w-full"
          required
        />
        {rightElement && (
          <div className="pr-3 shrink-0">{rightElement}</div>
        )}
      </div>
    </div>
  )
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────

export default function AdminLoginPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cardVisible, setCardVisible] = useState(false)

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setCardVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user && (data.user.role === 'ADMIN' || data.user.role === 'STAFF')) {
          router.push('/admin/orders')
        }
      })
      .catch(() => {})
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim() || !password.trim()) {
      return showToast('Please enter both mobile number and password', 'error')
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      if (data.user.role !== 'ADMIN' && data.user.role !== 'STAFF') {
        throw new Error('Access denied. Administrator privileges required.')
      }
      showToast('Welcome back! Redirecting…', 'success')
      router.push('/admin/orders')
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: '#080d14' }}>
      <GridBackground />

      {/* Login Card */}
      <div
        className="relative w-full max-w-[380px] flex flex-col gap-6"
        style={{
          opacity: cardVisible ? 1 : 0,
          transform: cardVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Card top accent line */}
          <div
            className="h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, #0c831f, #22d3ee, #0c831f)' }}
          />

          <div className="p-7 flex flex-col gap-7">
            {/* Header */}
            <div className="flex flex-col items-center gap-3 text-center">
              {/* Brand icon */}
              <div
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(12,131,31,0.3) 0%, rgba(34,211,238,0.1) 100%)',
                  border: '1px solid rgba(34,211,238,0.2)',
                  boxShadow: '0 0 30px rgba(12,131,31,0.25)',
                }}
              >
                <Snowflake
                  className="w-7 h-7 text-cyan-400"
                  strokeWidth={1.8}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.6))' }}
                />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-tight leading-tight">Command Centre</h1>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mt-0.5" style={{ color: '#22d3ee' }}>
                  Anmol Enterprises • Latur
                </p>
              </div>
            </div>

            {/* Security badge */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.1)' }}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: '#22d3ee' }} strokeWidth={2} />
              <p className="text-[10px] font-medium" style={{ color: '#64748b' }}>
                Secure access — Administrators & Staff only
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <InputField
                icon={Phone}
                label="Mobile Number"
                type="tel"
                placeholder="10-digit mobile number"
                autoComplete="tel"
                value={phone}
                onChange={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
              />
              <InputField
                icon={Lock}
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Administrator password"
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-600 hover:text-slate-400 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                }
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm text-white overflow-hidden transition-all duration-200 mt-1"
                style={{
                  background: isSubmitting
                    ? 'rgba(12,131,31,0.4)'
                    : 'linear-gradient(135deg, #0c831f 0%, #0a6e19 100%)',
                  boxShadow: isSubmitting ? 'none' : '0 8px 24px rgba(12,131,31,0.35), 0 0 0 1px rgba(12,131,31,0.5)',
                  transform: 'translateZ(0)',
                }}
                onMouseEnter={e => {
                  if (!isSubmitting) {
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(12,131,31,0.5), 0 0 0 1px rgba(12,131,31,0.6)'
                    e.currentTarget.style.transform = 'translateY(-1px) translateZ(0)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(12,131,31,0.35), 0 0 0 1px rgba(12,131,31,0.5)'
                  e.currentTarget.style.transform = 'translateZ(0)'
                }}
              >
                {/* Shimmer overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', backgroundSize: '200% 100%' }}
                />

                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] font-medium" style={{ color: '#1e293b' }}>
          © {new Date().getFullYear()} Anmol Enterprises · Latur, Maharashtra · Restricted Access
        </p>
      </div>
    </div>
  )
}
