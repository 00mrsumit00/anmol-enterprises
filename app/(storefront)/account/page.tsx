'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  User, Phone, Lock, Building2, UserPlus, LogIn, LogOut, FileText, 
  ChevronRight, ShieldCheck, Clock, AlertTriangle, Store, Utensils, 
  Coffee, ShoppingBag, BadgePercent, CreditCard, Sparkles, CheckCircle2, ArrowRight, ArrowLeft,
  Package, UploadCloud, ClipboardList, BarChart3, Truck, Mail, RotateCcw, MapPin, Heart, HelpCircle, Bell, Moon
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import OtpVerificationModal from '@/components/storefront/OtpVerificationModal'
import { GoogleLogin } from '@react-oauth/google'
import { useCart } from '@/hooks/useCart'

export default function AccountPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { add, open } = useCart()

  const handleReorder = (orderItems: any[]) => {
    if (!orderItems || orderItems.length === 0) return
    let addedCount = 0
    orderItems.forEach((item: any) => {
      const price = item.unitPrice || 0
      const qty = item.quantity || 1
      add({
        variantId: item.variantId,
        productId: item.productId,
        productName: item.productName || 'McCain Product',
        productSlug: item.variant?.product?.slug || 'mccain-product',
        imageUrl: item.variant?.product?.imageUrl || item.imageUrl || '/placeholder.png',
        packagingType: item.packagingType || 'SINGLE',
        weightGrams: item.weightGrams || 1000,
        unitsInPack: item.unitsInPack || 1,
        skuCode: item.variantSku || 'SKU-REORDER',
        unitPrice: price,
        quantity: qty,
        lineTotal: price * qty
      })
      addedCount += qty
    })
    showToast(`Added ${orderItems.length} items (${addedCount} total packs) to cart!`, 'success')
    open()
  }

  // Form View state: 'login' | 'register'
  const [formMode, setFormMode] = useState<'login' | 'register'>('login')
  
  // Registration Step: 1 = Choice, 2 = Form
  const [regStep, setRegStep] = useState<1 | 2>(1)
  const [accountType, setAccountType] = useState<'CONSUMER' | 'BUSINESS'>('CONSUMER')

  // Login Form
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Customer Register Form
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  // Business Register Form
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('CAFE')
  const [gstin, setGstin] = useState('')
  const [fssaiNumber, setFssaiNumber] = useState('')
  const [monthlyVolumeEst, setMonthlyVolumeEst] = useState('50-200kg')
  const [businessAddress, setBusinessAddress] = useState('')

  // OTP Verification state
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)
  const [otpChannel, setOtpChannel] = useState<'SMS' | 'EMAIL'>('EMAIL')
  const [phoneOtpToken, setPhoneOtpToken] = useState('')
  const [emailOtpToken, setEmailOtpToken] = useState('')

  // Local user state
  const [user, setUser] = useState<any>(null)
  const [userLoading, setUserLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (e) {
      setUser(null)
    } finally {
      setUserLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  // Past orders query
  const { data: pastOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['past-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error('Failed to fetch orders')
      return res.json()
    },
    enabled: !!user
  })

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginPhone.trim() || !loginPassword.trim()) {
      return showToast('Please enter mobile number and password', 'error')
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone, password: loginPassword })
      })

      let data: any = {}
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        throw new Error('Server temporarily unavailable. Please try again.')
      }

      if (!res.ok) throw new Error(data.error || 'Login failed')

      showToast(`Welcome back, ${data.user.name}!`, 'success')
      setUser(data.user)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'))
      }
      queryClient.invalidateQueries({ queryKey: ['past-orders'] })
      
      const target = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null
      if (target) {
        router.push(target)
      } else {
        router.refresh()
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error')
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credentialResponse.credential })
      })

      let data: any = {}
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        throw new Error('Server temporarily unavailable. Please try again.')
      }

      if (!res.ok) throw new Error(data.error || 'Google Sign-In failed')

      showToast(`Welcome, ${data.user.name}!`, 'success')
      setUser(data.user)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'))
      }
      queryClient.invalidateQueries({ queryKey: ['past-orders'] })
      const target = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null
      if (target) {
        router.push(target)
      } else {
        router.refresh()
      }
    } catch (err: any) {
      showToast(err.message || 'Google Sign-In failed', 'error')
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName.trim() || !regPhone.trim() || !regPassword.trim()) {
      return showToast('Please complete all required user details', 'error')
    }

    const isB2B = accountType === 'BUSINESS'

    if (isB2B && !businessName.trim()) {
      return showToast('Please enter your business / outlet name', 'error')
    }

    // Require either Phone OTP OR Email OTP verification before completing registration
    if (!phoneOtpToken && !emailOtpToken) {
      if (regEmail.trim()) {
        setOtpChannel('EMAIL')
      } else {
        setOtpChannel('SMS')
      }
      setIsOtpModalOpen(true)
      return
    }

    await executeRegistration()
  }

  const executeRegistration = async (tokenPassed?: string) => {
    const isB2B = accountType === 'BUSINESS'
    try {
      const activePhoneToken = phoneOtpToken || (otpChannel === 'SMS' ? tokenPassed : '') || undefined
      const activeEmailToken = emailOtpToken || (otpChannel === 'EMAIL' ? tokenPassed : '') || undefined

      const payload: any = {
        name: regName,
        phone: regPhone,
        email: regEmail.trim() || undefined,
        password: regPassword,
        phoneOtpToken: activePhoneToken,
        emailOtpToken: activeEmailToken,
        isB2B,
      }

      if (isB2B) {
        payload.businessName = businessName
        payload.businessType = businessType
        payload.gstin = gstin.trim() || undefined
        payload.fssaiNumber = fssaiNumber.trim() || undefined
        payload.monthlyVolumeEst = monthlyVolumeEst
        payload.businessAddress = businessAddress.trim() || undefined
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-phone-otp-token': activePhoneToken || activeEmailToken || ''
        },
        body: JSON.stringify(payload)
      })

      let data: any = {}
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        throw new Error('Server temporarily unavailable. Please try again.')
      }

      if (!res.ok) throw new Error(data.error || 'Registration failed')

      showToast(isB2B ? 'B2B Account created successfully!' : 'Account created & verified!', 'success')
      setUser(data.user)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'))
      }
      queryClient.invalidateQueries({ queryKey: ['past-orders'] })
      
      const target = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null
      if (target) {
        router.push(target)
      } else {
        router.refresh()
      }
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'))
      }
      showToast('Logged out successfully', 'success')
      router.refresh()
    } catch (err) {
      showToast('Logout failed', 'error')
    }
  }

  if (userLoading) {
    return (
      <div className="max-w-md mx-auto py-16 flex flex-col items-center justify-center gap-3 text-center no-print">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        <p className="font-body text-xs text-gray-400 font-bold uppercase tracking-wider">
          Securing Anmol Enterprises Profile...
        </p>
      </div>
    )
  }

  return (
    <div className={user ? "max-w-7xl w-full mx-auto pb-12 no-print px-2 sm:px-4" : "max-w-xl mx-auto pb-12 no-print"}>
      {user ? (
        /* ========================================================================= */
        /* ========================= LOGGED IN USER PROFILE ======================== */
        /* ========================================================================= */
        <div className="flex flex-col gap-5">
          
          {/* User Header Profile Card (Mobile App Inspired) */}
          <div className="bg-gradient-to-br from-amber-400/20 via-orange-400/10 to-amber-100/30 rounded-3xl p-6 border border-amber-200/50 shadow-sm text-center relative overflow-hidden">
            {/* Quick Explore Store Button */}
            <div className="absolute left-4 top-4">
              <button
                onClick={() => router.push('/')}
                className="px-3 py-2 bg-white/90 hover:bg-orange-50 text-brand-orange hover:text-brand-orange-dark rounded-2xl border border-orange-200/80 transition-all tap-scale flex items-center gap-1.5 font-display text-xs font-black shadow-xs"
                title="Explore Products"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Explore More Products</span>
                <span className="sm:hidden">Store</span>
                <ShoppingBag className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="absolute right-4 top-4">
              <button
                onClick={handleLogout}
                className="p-2.5 bg-white/80 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-2xl border border-gray-200/60 transition-all tap-scale flex items-center gap-1.5 font-body text-xs font-bold shadow-xs"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

            <div className="w-20 h-20 rounded-full bg-white shadow-md text-brand-charcoal flex items-center justify-center font-accent font-black text-3xl capitalize mx-auto border-4 border-white relative">
              {user.name.charAt(0)}
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white" title="Verified Account" />
            </div>

            <h2 className="font-display text-xl font-black text-brand-charcoal mt-3 leading-tight">
              {user.name}
            </h2>
            <p className="font-body text-xs text-gray-600 font-semibold mt-0.5">
              📞 +91 {user.phone} {user.isB2B && (user.businessName || user.businessProfile?.businessName) ? `• 🏢 ${user.businessName || user.businessProfile?.businessName}` : ''}
            </p>

            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                user.role === 'ADMIN' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                user.isB2B ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-xs' :
                'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {user.role === 'ADMIN' ? '👑 Admin Privileges' : user.isB2B ? '💼 B2B Commercial Partner' : '👤 Retail Express Customer'}
              </span>
            </div>
          </div>

          {/* 3 Quick Action Cards (Your Orders | Credit/Wallet | Need Help?) */}
          <div className="grid grid-cols-3 gap-2.5">
            <a 
              href="#orders-section"
              className="bg-white hover:bg-orange-50/50 p-3.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center tap-scale transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="font-display text-xs font-black text-brand-charcoal leading-tight block">Your Orders</span>
              <span className="text-[10px] text-gray-400 font-bold mt-0.5">{pastOrders.length} placed</span>
            </a>

            <div className="bg-white hover:bg-purple-50/50 p-3.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center tap-scale transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="font-display text-xs font-black text-brand-charcoal leading-tight block">B2B Credit</span>
              <span className="text-[10px] text-purple-700 font-bold mt-0.5">
                {user.isB2B ? `₹${user.creditLimit - user.creditUsed}` : 'Standard'}
              </span>
            </div>

            <a 
              href="tel:+919888665971"
              className="bg-white hover:bg-emerald-50/50 p-3.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center tap-scale transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="font-display text-xs font-black text-brand-charcoal leading-tight block">Need Help?</span>
              <span className="text-[10px] text-emerald-700 font-bold mt-0.5">24/7 Hotline</span>
            </a>
          </div>

          {/* ==================== ADMIN & STAFF CONTROL CENTER ==================== */}
          {(user.role === 'ADMIN' || user.role === 'STAFF') && (
            <div className="bg-gradient-to-br from-brand-charcoal via-slate-900 to-brand-charcoal text-white rounded-3xl p-6 shadow-xl border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-brand-orange text-white flex items-center justify-center font-bold shadow-md shadow-brand-orange/30">
                    👑
                  </div>
                  <div>
                    <h3 className="font-display text-base font-black text-white leading-tight">
                      Admin Management Portal
                    </h3>
                    <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                      Direct access to catalog, live orders, bulk imports, and business tools
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-brand-orange/20 text-brand-yellow font-black px-2.5 py-1 rounded-full border border-brand-yellow/30 uppercase tracking-wider">
                  {user.role} ACCESS
                </span>
              </div>

              {/* Quick Action Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <Link
                  href="/admin/products"
                  className="bg-white/10 hover:bg-brand-orange text-white p-3.5 rounded-2xl border border-white/10 flex items-center justify-between group transition-all tap-scale"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20">
                      <Package className="w-4 h-4 text-brand-yellow group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <span className="font-display text-xs font-black block">Product Manager</span>
                      <span className="text-[10px] text-gray-300 font-semibold block">Add & edit products manually</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/admin/products/bulk-import"
                  className="bg-white/10 hover:bg-brand-orange text-white p-3.5 rounded-2xl border border-white/10 flex items-center justify-between group transition-all tap-scale"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20">
                      <UploadCloud className="w-4 h-4 text-emerald-400 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <span className="font-display text-xs font-black block">Bulk Import / Sync</span>
                      <span className="text-[10px] text-gray-300 font-semibold block">Add products in bulk via JSON/presets</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/admin/orders"
                  className="bg-white/10 hover:bg-brand-orange text-white p-3.5 rounded-2xl border border-white/10 flex items-center justify-between group transition-all tap-scale"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20">
                      <ClipboardList className="w-4 h-4 text-blue-400 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <span className="font-display text-xs font-black block">Orders Dispatch</span>
                      <span className="text-[10px] text-gray-300 font-semibold block">Live real-time order board</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/admin/business-accounts"
                  className="bg-white/10 hover:bg-brand-orange text-white p-3.5 rounded-2xl border border-white/10 flex items-center justify-between group transition-all tap-scale"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20">
                      <Building2 className="w-4 h-4 text-purple-400 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <span className="font-display text-xs font-black block">Business Accounts</span>
                      <span className="text-[10px] text-gray-300 font-semibold block">B2B credit tiers & GSTIN approvals</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/admin/inventory"
                  className="bg-white/10 hover:bg-brand-orange text-white p-3.5 rounded-2xl border border-white/10 flex items-center justify-between group transition-all tap-scale"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20">
                      <BarChart3 className="w-4 h-4 text-cyan-400 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <span className="font-display text-xs font-black block">Inventory Manager</span>
                      <span className="text-[10px] text-gray-300 font-semibold block">Stock levels & low inventory alerts</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/admin/drivers"
                  className="bg-white/10 hover:bg-brand-orange text-white p-3.5 rounded-2xl border border-white/10 flex items-center justify-between group transition-all tap-scale"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20">
                      <Truck className="w-4 h-4 text-amber-400 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <span className="font-display text-xs font-black block">Delivery Drivers</span>
                      <span className="text-[10px] text-gray-300 font-semibold block">Manage drivers & vehicle numbers</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </div>
          )}

          {/* ==================== EXTRAORDINARY B2B COMMERCIAL DASHBOARD ==================== */}
          {user.isB2B && (
            <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden border border-purple-500/30 flex flex-col gap-6">
              
              {/* Decorative Background Glow */}
              <div className="absolute -right-12 -top-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Top Business Header & Credentials */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-purple-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20 shrink-0">
                    🏢
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-black text-white leading-tight">
                        {user.businessName || user.businessProfile?.businessName || user.name}
                      </h3>
                      <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {user.businessProfile?.businessType || 'HOTEL / CAFE'}
                      </span>
                    </div>
                    <p className="text-xs text-purple-200/80 font-semibold mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>GSTIN: <strong className="font-mono text-white">{user.businessProfile?.gstin || 'Not Provided'}</strong></span>
                      <span>•</span>
                      <span>FSSAI: <strong className="font-mono text-white">{user.businessProfile?.fssaiNumber || 'Verified'}</strong></span>
                    </p>
                  </div>
                </div>

                {/* Verification Badge */}
                <div className="shrink-0">
                  {user.businessProfile?.verificationStatus === 'VERIFIED' ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black px-4 py-1.5 rounded-full backdrop-blur-md shadow-md">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Verified Commercial Partner</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black px-4 py-1.5 rounded-full">
                      <Clock className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Pending Verification</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Commercial Financial Ledger / Credit Hub */}
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Account Tier Card */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
                  <span className="text-[10px] text-purple-300 font-bold uppercase tracking-widest">Wholesale Loyalty Tier</span>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl select-none">
                        {user.businessProfile?.creditTier === 'GOLD' ? '🥇' : user.businessProfile?.creditTier === 'SILVER' ? '🥈' : '🥉'}
                      </span>
                      <div>
                        <span className="font-display font-black text-base text-amber-300 block leading-none">
                          {user.businessProfile?.creditTier || 'BRONZE'} TIER
                        </span>
                        <span className="text-[10px] text-purple-200 font-semibold">Bulk Box Tier Rates</span>
                      </div>
                    </div>
                    <BadgePercent className="w-5 h-5 text-amber-400" />
                  </div>
                </div>

                {/* 2. Credit Status Card */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-purple-300 font-bold uppercase tracking-widest">
                      {user.isCreditEnabled || user.businessProfile?.isCreditEnabled ? 'B2B Credit Account (Net 15-30)' : 'Wholesale Settlement Status'}
                    </span>
                    {(user.isCreditEnabled || user.businessProfile?.isCreditEnabled) ? (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        🟢 Credit Facility Active
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        🔒 Pay-On-Delivery Active
                      </span>
                    )}
                  </div>

                  {(user.isCreditEnabled || user.businessProfile?.isCreditEnabled) ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black font-display text-emerald-400">
                          ₹{Math.max(0, (user.creditLimit || 0) - (user.creditUsed || 0)).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-semibold text-purple-200">
                          Limit: ₹{(user.creditLimit || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden p-0.5">
                        <div 
                          className="bg-gradient-to-r from-emerald-400 to-amber-300 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${user.creditLimit ? Math.min(100, ((user.creditUsed || 0) / user.creditLimit) * 100) : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-xs text-purple-100 font-semibold leading-relaxed">
                        Your account is set to <strong>Pay-on-Delivery Wholesale Mode</strong>. Enjoy instant frozen food shipments with zero credit interest, settled via COD or UPI upon arrival.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Quick Bulk Reorder Banner */}
              <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold shrink-0">
                    🚚
                  </div>
                  <div>
                    <h4 className="font-display text-xs font-black text-white">Quick Commercial Re-Order</h4>
                    <p className="text-[11px] text-purple-200 font-semibold mt-0.5">
                      Reorder McCain French Fries 2.5kg cartons & Smiles at wholesale rates with 1-click.
                    </p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="bg-amber-400 hover:bg-amber-500 text-purple-950 font-display font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition-all shrink-0 tap-scale flex items-center gap-1.5"
                >
                  <span>Browse Wholesale Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          )}

          {/* Past Orders History (Mobile App Inspired with 1-Tap Reorder) */}
          <div id="orders-section" className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-display text-sm font-black text-brand-charcoal mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brand-orange" />
                <span>Your Order History & Express Deliveries</span>
              </span>
              <span className="text-[11px] font-semibold text-gray-400">
                {pastOrders.length} placed
              </span>
            </h3>

            {ordersLoading ? (
              <div className="py-8 text-center text-xs text-gray-400">Loading order history...</div>
            ) : pastOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 leading-normal">
                No orders placed yet. Explore McCain frozen express items on the homepage!
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pastOrders.map((order: any) => (
                  <div 
                    key={order.id} 
                    className="bg-gray-50/60 hover:bg-white border border-gray-100 hover:border-brand-orange/30 p-4 rounded-2xl transition-all flex flex-col gap-3 shadow-xs hover:shadow-md"
                  >
                    {/* Header Row: Status Badge & Delivery Details */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-display text-xs font-black text-brand-charcoal">
                            {order.status === 'DELIVERED' ? 'Arrived in 10-15 minutes' : `Order #${order.orderNumber}`}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-semibold block">
                            ₹{order.totalAmount} • {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        order.status === 'DELIVERED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        order.status === 'CANCELLED' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                        'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Product Thumbnails Grid Preview */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                      {order.items.slice(0, 4).map((item: any, idx: number) => (
                        <div 
                          key={idx}
                          className="w-14 h-14 rounded-xl bg-white border border-gray-200/80 p-1 flex items-center justify-center shrink-0 shadow-xs relative"
                          title={item.productName}
                        >
                          <img 
                            src={item.variant?.product?.imageUrl || item.imageUrl || '/placeholder.png'} 
                            alt={item.productName || 'Item'}
                            className="w-full h-full object-contain"
                          />
                          {item.quantity > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-brand-charcoal text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                              {item.quantity}
                            </span>
                          )}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="w-14 h-14 rounded-xl bg-gray-100 text-gray-500 font-black text-xs flex items-center justify-center shrink-0 border border-dashed border-gray-300">
                          +{order.items.length - 4} more
                        </div>
                      )}
                    </div>

                    {/* Action Bar: 1-Tap Reorder & Tax Invoice */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 mt-0.5">
                      <button
                        type="button"
                        onClick={() => handleReorder(order.items)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-display text-xs font-extrabold px-4 py-2 rounded-xl shadow-md hover:shadow-emerald-600/20 flex items-center gap-1.5 tap-scale transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reorder</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/orders/${order.id}/invoice`}
                          target="_blank"
                          className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all tap-scale"
                          title="Download Official Tax Invoice"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-700" />
                          <span>Tax Invoice</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => router.push(`/order/${order.id}`)}
                          className="p-2 text-gray-400 hover:text-brand-orange hover:bg-gray-100 rounded-xl transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* ========================= UNAUTHENTICATED FORM VIEW ===================== */
        /* ========================================================================= */
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xl flex flex-col gap-6">
          
          {/* Header Banner */}
          <div className="text-center pb-4 border-b border-gray-100">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-orange to-brand-yellow rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-md text-white">
              ❄️
            </div>
            <h2 className="font-display text-xl font-black text-brand-charcoal mt-3">
              Anmol Frozen Express
            </h2>
            <p className="font-body text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-normal">
              Direct McCain Frozen Distribution Portal for Latur & Marathwada region.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-gray-100 rounded-2xl p-1 border select-none">
            <button
              type="button"
              onClick={() => { setFormMode('login'); setRegStep(1) }}
              className={`flex-1 py-2.5 rounded-xl font-body text-xs font-black transition-all flex items-center justify-center gap-2 ${
                formMode === 'login' ? 'bg-white text-brand-charcoal shadow-sm' : 'text-gray-400'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
            <button
              type="button"
              onClick={() => { setFormMode('register'); setRegStep(1) }}
              className={`flex-1 py-2.5 rounded-xl font-body text-xs font-black transition-all flex items-center justify-center gap-2 ${
                formMode === 'register' ? 'bg-white text-brand-charcoal shadow-sm' : 'text-gray-400'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </button>
          </div>

          {formMode === 'login' ? (
            /* ===================================================================== */
            /* ============================ LOGIN FORM ============================= */
            /* ===================================================================== */
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4 font-body">
              
              {/* Phone */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-brand-charcoal uppercase tracking-wider pl-1">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5" />
                  <input
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-orange focus:bg-white transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-brand-charcoal uppercase tracking-wider pl-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5" />
                  <input
                    type="password"
                    placeholder="Enter account password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-orange focus:bg-white transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-body text-sm font-extrabold py-3.5 rounded-2xl shadow-lg hover:shadow-brand-orange/20 flex items-center justify-center gap-2 tap-scale mt-2 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Account</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-gray-200 w-full" />
                <span className="bg-white px-3 text-[10px] text-gray-400 font-extrabold uppercase tracking-widest shrink-0">OR LOGIN WITH</span>
                <div className="border-t border-gray-200 w-full" />
              </div>

              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => showToast('Google Sign-In failed', 'error')}
                  shape="pill"
                  theme="outline"
                  size="large"
                  text="continue_with"
                />
              </div>

            </form>
          ) : (
            /* ===================================================================== */
            /* ===================== 2-STEP REGISTRATION FLOW ====================== */
            /* ===================================================================== */
            <div>
              {regStep === 1 ? (
                /* ----- STEP 1: ACCOUNT TYPE SELECTION CARDS ----- */
                <div className="flex flex-col gap-4 animate-fade-in">
                  
                  <div className="text-center mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full">
                      Step 1 of 2
                    </span>
                    <h3 className="font-display text-base font-black text-brand-charcoal mt-2">
                      How will you use Anmol Enterprises?
                    </h3>
                  </div>

                  {/* Option 1: Customer Card */}
                  <div 
                    onClick={() => { setAccountType('CONSUMER'); setRegStep(2) }}
                    className={`border-2 rounded-3xl p-5 cursor-pointer transition-all flex items-start gap-4 hover:shadow-md tap-scale ${
                      accountType === 'CONSUMER' 
                        ? 'border-brand-orange bg-brand-orange-light/20' 
                        : 'border-gray-100 hover:border-brand-orange/40 bg-white'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display text-sm font-black text-brand-charcoal">
                          Individual Consumer
                        </h4>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="font-body text-xs text-gray-500 mt-1 leading-relaxed">
                        For personal consumption, family snacks, and quick home delivery in Latur. Instant signup.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Business & Wholesale Partner Card */}
                  <div 
                    onClick={() => { setAccountType('BUSINESS'); setRegStep(2) }}
                    className={`border-2 rounded-3xl p-5 cursor-pointer transition-all flex items-start gap-4 hover:shadow-md tap-scale ${
                      accountType === 'BUSINESS' 
                        ? 'border-brand-orange bg-purple-50/50' 
                        : 'border-gray-100 hover:border-brand-orange/40 bg-white'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-display text-sm font-black text-brand-charcoal">
                            Business / Wholesale Partner
                          </h4>
                          <span className="bg-purple-100 text-purple-800 text-[9px] font-black px-2 py-0.5 rounded-full">
                            B2B Credit
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="font-body text-xs text-gray-500 mt-1 leading-relaxed">
                        For Hotels, Cafes, Restaurants, Caterers & Kirana Stores. Unlocks Box/Carton pricing & Credit lines.
                      </p>
                    </div>
                  </div>

                </div>
              ) : (
                /* ----- STEP 2: REGISTRATION DETAILS FORM ----- */
                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4 font-body animate-fade-in">
                  
                  {/* Step Back Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="text-xs font-bold text-gray-500 hover:text-brand-charcoal flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Account Type</span>
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange bg-brand-orange/10 px-2.5 py-0.5 rounded-full">
                      {accountType === 'BUSINESS' ? '🏢 B2B Partner Form' : '👤 Consumer Form'}
                    </span>
                  </div>

                  {/* Common: Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-brand-charcoal uppercase tracking-wider pl-1">
                      {accountType === 'BUSINESS' ? 'Owner / Contact Person Name' : 'Full Name'} *
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5" />
                      <input
                        type="text"
                        placeholder="Enter full name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-orange focus:bg-white font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Common: Phone */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-[11px] font-bold text-brand-charcoal uppercase tracking-wider">
                        Mobile Number *
                      </label>
                      {phoneOtpToken ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : regPhone.length === 10 ? (
                        <button
                          type="button"
                          onClick={() => { setOtpChannel('SMS'); setIsOtpModalOpen(true); }}
                          className="text-[10px] font-extrabold text-brand-orange hover:underline bg-brand-orange/10 px-2 py-0.5 rounded-full"
                        >
                          Verify Phone via SMS OTP
                        </button>
                      ) : null}
                    </div>
                    <div className="relative flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5" />
                      <input
                        type="tel"
                        placeholder="Enter 10-digit number"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-orange focus:bg-white font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Common: Email */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-[11px] font-bold text-brand-charcoal uppercase tracking-wider">
                        Email Address <span className="text-gray-400 font-normal lowercase">(for Email OTP & invoices)</span>
                      </label>
                      {emailOtpToken ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : regEmail.includes('@') ? (
                        <button
                          type="button"
                          onClick={() => { setOtpChannel('EMAIL'); setIsOtpModalOpen(true); }}
                          className="text-[10px] font-extrabold text-brand-orange hover:underline bg-brand-orange/10 px-2 py-0.5 rounded-full"
                        >
                          Verify Email via OTP
                        </button>
                      ) : null}
                    </div>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5" />
                      <input
                        type="email"
                        placeholder="e.g. name@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-orange focus:bg-white font-semibold"
                      />
                    </div>
                  </div>

                  {/* Common: Password */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-brand-charcoal uppercase tracking-wider pl-1">
                      Create Password *
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5" />
                      <input
                        type="password"
                        placeholder="Min. 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-orange focus:bg-white font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* ================= EXTRA B2B BUSINESS FIELDS ================= */}
                  {accountType === 'BUSINESS' && (
                    <div className="flex flex-col gap-4 pt-2 border-t border-purple-100">
                      
                      <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
                        <span className="text-[11px] text-purple-900 font-semibold leading-tight">
                          Fill your commercial details to request instant wholesale B2B pricing & credit verification.
                        </span>
                      </div>

                      {/* Business Name */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-brand-charcoal uppercase tracking-wider pl-1">
                          Business / Outlet Name *
                        </label>
                        <div className="relative flex items-center">
                          <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5" />
                          <input
                            type="text"
                            placeholder="e.g. Grand Hotel & Bakers, Latur"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-orange focus:bg-white font-semibold"
                            required
                          />
                        </div>
                      </div>

                      {/* Business Type */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-brand-charcoal uppercase tracking-wider pl-1">
                          Business Type *
                        </label>
                        <select
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-brand-orange focus:bg-white font-semibold text-brand-charcoal cursor-pointer"
                        >
                          <option value="HOTEL">🏨 Hotel</option>
                          <option value="CAFE">☕ Cafe / Bistro</option>
                          <option value="RESTAURANT">🍽️ Restaurant / Fast Food Counter</option>
                          <option value="CATERER">🍲 Caterer / Event Supplies</option>
                          <option value="RETAILER">🏪 Kirana / Retail Store</option>
                          <option value="OTHER">🏢 Other Business</option>
                        </select>
                      </div>

                      {/* GSTIN & FSSAI (Grid) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-brand-charcoal uppercase tracking-wider pl-1">
                            GSTIN (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="27AAAAA0000A1Z5"
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value.toUpperCase())}
                            className="w-full bg-gray-50 border border-gray-200 text-xs rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-brand-orange focus:bg-white font-mono uppercase"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-brand-charcoal uppercase tracking-wider pl-1">
                            FSSAI Lic No. (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="14-digit FSSAI number"
                            value={fssaiNumber}
                            onChange={(e) => setFssaiNumber(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-gray-50 border border-gray-200 text-xs rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-brand-orange focus:bg-white font-mono"
                          />
                        </div>
                      </div>

                      {/* Monthly Volume Estimate */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-brand-charcoal uppercase tracking-wider pl-1">
                          Estimated Monthly Order Volume
                        </label>
                        <select
                          value={monthlyVolumeEst}
                          onChange={(e) => setMonthlyVolumeEst(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 text-xs rounded-2xl px-4 py-2.5 focus:outline-none focus:border-brand-orange focus:bg-white font-semibold text-brand-charcoal cursor-pointer"
                        >
                          <option value="< 50kg">Less than 50 kg / month</option>
                          <option value="50-200kg">50 kg – 200 kg / month</option>
                          <option value="200-500kg">200 kg – 500 kg / month</option>
                          <option value="500kg+">500 kg+ / month (Bulk Distributor)</option>
                        </select>
                      </div>

                      {/* Business Address */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-brand-charcoal uppercase tracking-wider pl-1">
                          Shop / Outlet Address (Latur Region)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Complete shop address for invoice & delivery mapping"
                          value={businessAddress}
                          onChange={(e) => setBusinessAddress(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 text-xs rounded-2xl p-3 focus:outline-none focus:border-brand-orange focus:bg-white font-semibold"
                        />
                      </div>

                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-body text-sm font-extrabold py-3.5 rounded-2xl shadow-lg hover:shadow-brand-orange/20 flex items-center justify-center gap-2 tap-scale mt-3"
                  >
                    <UserPlus className="w-4.5 h-4.5" />
                    <span>{accountType === 'BUSINESS' ? 'Submit B2B Business Application' : 'Create Customer Account'}</span>
                  </button>

                </form>
              )}
            </div>
          )}

          {/* Admin Prompt */}
          <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-2xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-500 leading-normal font-semibold">
              <strong>Distributor Note:</strong> The first user registered on this system is granted <strong>ADMIN</strong> privileges to manage the Dispatcher Board.
            </p>
          </div>

        </div>
      )}

      {/* SMS OTP Phone Verification Modal */}
      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        phone={regPhone}
        purpose="SIGNUP"
        onClose={() => setIsOtpModalOpen(false)}
        onVerified={(token) => {
          setPhoneOtpToken(token)
          executeRegistration(token)
        }}
      />
    </div>
  )
}
