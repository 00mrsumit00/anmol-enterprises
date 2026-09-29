'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Phone, Snowflake, LogIn } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import AnimatedLogo from '@/components/storefront/AnimatedLogo'

export default function AdminLoginPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in as admin
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
        body: JSON.stringify({ phone, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      if (data.user.role !== 'ADMIN' && data.user.role !== 'STAFF') {
        throw new Error('Access denied. Administrator privileges required.')
      }

      showToast('Admin login successful!', 'success')
      router.push('/admin/orders')
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-charcoal flex items-center justify-center p-4 font-body select-none">
      
      {/* Login Card */}
      <div className="w-full max-w-md bg-brand-charcoal-soft border border-white/5 p-6 sm:p-8 rounded-card shadow-2xl flex flex-col gap-6 text-white">
        
        {/* Brand Logo Header */}
        <div className="text-center flex flex-col items-center">
          <div className="bg-white/95 px-4 py-2 rounded-2xl shadow-md border border-white/20 mb-2">
            <AnimatedLogo />
          </div>
          <p className="text-[10px] text-brand-yellow font-bold uppercase tracking-wider mt-1 select-none">
            Dispatcher Control Panel
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm font-semibold">
          
          {/* Mobile phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 font-bold uppercase tracking-wider pl-1">
              Dispatcher Mobile Number
            </label>
            <div className="relative flex items-center">
              <Phone className="w-4.5 h-4.5 text-gray-400 absolute left-3" />
              <input
                type="tel"
                placeholder="Enter 10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full bg-brand-charcoal border border-white/10 text-white rounded-card pl-10 pr-4 py-2.5 focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 font-bold uppercase tracking-wider pl-1">
              Security Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4.5 h-4.5 text-gray-400 absolute left-3" />
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-charcoal border border-white/10 text-white rounded-card pl-10 pr-4 py-2.5 focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-bold py-3.5 rounded-pill shadow-lg hover:shadow-brand-orange/20 flex items-center justify-center gap-2 tap-scale mt-3 transition-colors text-sm font-body"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4.5 h-4.5" />
                <span>Dispatcher Log In</span>
              </>
            )}
          </button>

        </form>

        <div className="text-center text-[10px] text-gray-500 mt-2 font-medium">
          © {new Date().getFullYear()} Anmol Enterprises. Restricted access area.
        </div>

      </div>

    </div>
  )
}
