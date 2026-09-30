'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { 
  Snowflake, User, LogOut, 
  LayoutDashboard, MapPin, ChevronDown, Zap, Mic, Search, Wallet
} from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/ui/Toast'
import AnimatedLogo from './AnimatedLogo'

const PLACEHOLDERS = [
  'Search "french fries"',
  'Search "crispy smiles"',
  'Search "chilli garlic bites"',
  'Search "cheese nuggets"',
  'Search "aloo tikki"',
  'Search "veggie fingers"',
  'Search "super wedges"',
  'Search "mini samosa"'
]

function NavbarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { isB2BMode } = useCart()
  const { showToast } = useToast()

  // Hide search bar on profile/account & checkout pages
  const isProfileOrCheckout = pathname.startsWith('/account') || pathname.startsWith('/checkout')

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [user, setUser] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [selectedCity, setSelectedCity] = useState('Latur City')
  const [savedAddressText, setSavedAddressText] = useState('Home - Latur City, Maharashtra')
  const [isScrolled, setIsScrolled] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  // Rotating placeholder effect every 2.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  // Read saved address from checkout info or user profile
  useEffect(() => {
    try {
      const saved = localStorage.getItem('checkout_delivery_info')
      if (saved) {
        const info = JSON.parse(saved)
        if (info.address) {
          const shortAddr = info.address.length > 26 ? `${info.address.slice(0, 24)}...` : info.address
          setSavedAddressText(`${info.city || 'Home'} - ${shortAddr}`)
          return
        }
      }
      if (user?.businessAddress) {
        setSavedAddressText(`Office - ${user.businessAddress.slice(0, 24)}...`)
      }
    } catch {}
  }, [user])

  // Track window scroll for desktop compact search bar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch logged in user reactively on mount, navigation, and auth events
  useEffect(() => {
    const fetchUser = () => {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.user) {
            setUser(data.user)
          } else {
            setUser(null)
          }
        })
        .catch(() => setUser(null))
    }

    fetchUser()

    const handleAuthEvent = () => fetchUser()
    window.addEventListener('auth-change', handleAuthEvent)
    window.addEventListener('storage', handleAuthEvent)

    return () => {
      window.removeEventListener('auth-change', handleAuthEvent)
      window.removeEventListener('storage', handleAuthEvent)
    }
  }, [pathname])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/')
    }
  }


  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
    } catch {}

    try {
      localStorage.removeItem('user')
      localStorage.removeItem('auth')
      localStorage.removeItem('token')
      sessionStorage.clear()
    } catch {}

    setUser(null)
    setShowDropdown(false)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-change'))
      window.location.href = '/'
    }
  }

  return (
    <header className="sticky top-0 z-[100] w-full bg-white no-print font-sans">

      {/* Brand Orange Gradient Top Strip */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#FF6B00] via-[#FFC700] to-[#FF6B00]" />

      {/* Main Navbar Body */}
      <div className={`border-b border-gray-200/80 transition-all duration-200 ${isScrolled ? 'shadow-md bg-white/95 backdrop-blur-md' : 'shadow-sm bg-white'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-5">

          {/* Main Navbar Bar (Single Row on Desktop, Two Rows on Mobile via CSS Order) */}
          <div className={`flex flex-wrap lg:flex-nowrap items-center justify-between gap-y-2 gap-x-3 sm:gap-x-4 transition-all duration-200 ${isScrolled ? 'py-1.5' : 'py-2'}`}>

            {/* Left: Logo + Delivery ETA (order-1) */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0 order-1">

              {/* Animated Logo */}
              <AnimatedLogo />

              {/* Delivery ETA — desktop */}
              <button
                onClick={() => setShowLocationModal(!showLocationModal)}
                className="hidden sm:flex flex-col text-left hover:bg-orange-50/70 px-2 py-1 rounded-xl transition-all select-none max-w-[240px]"
              >
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="flex items-center gap-1 font-black text-[13px] text-gray-900">
                    <Zap className="w-3.5 h-3.5 text-[#FF6B00] fill-[#FF6B00]" />
                    Express 10 Min
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200">
                    nearby
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 font-medium flex items-center gap-0.5 leading-tight mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-[#FF6B00] shrink-0" />
                  <span className="truncate">{savedAddressText}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400 shrink-0 ml-0.5" />
                </span>
              </button>

              {/* Delivery ETA — mobile compact pill */}
              <button
                onClick={() => setShowLocationModal(!showLocationModal)}
                className="flex sm:hidden flex-col text-left max-w-[140px]"
              >
                <span className="flex items-center gap-1 font-black text-xs text-gray-900 leading-tight">
                  <Zap className="w-3 h-3 text-[#FF6B00] fill-[#FF6B00]" />
                  10 Min
                </span>
                <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-0.5 leading-tight truncate">
                  <span className="truncate">{savedAddressText.split('-')[0] || selectedCity}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                </span>
              </button>
            </div>

            {/* Middle: Single Permanent Search Bar (Center on desktop, Row 2 on mobile) */}
            {!isProfileOrCheckout && (
              <div className="order-3 lg:order-2 w-full lg:w-auto lg:flex-1 max-w-none lg:max-w-xl xl:max-w-2xl lg:mx-4 sm:lg:mx-6 pb-1 lg:pb-0 transition-all duration-200">
                <form onSubmit={handleSearchSubmit} className="w-full relative">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none shrink-0" />
                    <input
                      type="text"
                      placeholder={PLACEHOLDERS[placeholderIndex]}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#f4f6fb] hover:bg-[#edf1f7] focus:bg-white border border-gray-200 focus:border-[#0c831f] text-gray-900 placeholder-gray-400 text-sm font-medium rounded-2xl pl-10 pr-10 py-2.5 focus:outline-none transition-all shadow-xs focus:shadow-md focus:shadow-emerald-600/10"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 text-gray-400 hover:text-gray-700 font-bold text-sm"
                      >
                        ✕
                      </button>
                    ) : (
                      <button
                        type="button"
                        title="Voice Search (Coming soon)"
                        className="absolute right-3.5 text-gray-400 hover:text-gray-600"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Right: Wallet + Admin badge + B2B indicator + User avatar (order-2 on mobile, lg:order-3 on desktop) */}
            <div className="flex items-center gap-2 shrink-0 order-2 lg:order-3">

              {/* Wallet Pill */}
              <Link
                href="/account"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-xs font-bold transition-all border border-emerald-200 shadow-xs active:scale-95"
                title="Wallet / Credits"
              >
                <Wallet className="w-3.5 h-3.5 text-[#0c831f]" />
                <span>₹0</span>
              </Link>

              {/* Admin Button — only for admin/staff */}
              {user && (user.role === 'ADMIN' || user.role === 'STAFF') && (
                <Link
                  href="/admin/products"
                  className="hidden md:flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-3 py-1.5 rounded-2xl shadow-sm transition-all active:scale-95"
                  title="Admin Management Portal"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              )}

              {/* B2B Mode Active Indicator (read-only pill — shows when B2B is ON) */}
              {isB2BMode && (
                <span className="hidden sm:flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-purple-200">
                  💼 B2B ON
                </span>
              )}

              {/* User Avatar (logged in) OR Guest Icon (not logged in) */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="active:scale-95 transition-all select-none"
                    title={user.name}
                  >
                    <div className="w-9 h-9 rounded-full bg-white shadow-md border-2 border-gray-100 hover:border-emerald-300 text-gray-900 font-black flex items-center justify-center text-sm uppercase relative transition-colors">
                      {(user.name || user.phone || 'U').charAt(0).toUpperCase()}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-xs" title="Logged In" />
                    </div>
                  </button>

                  {/* Invisible backdrop to close dropdown */}
                  {showDropdown && (
                    <div
                      className="fixed inset-0 z-[998]"
                      onClick={() => setShowDropdown(false)}
                    />
                  )}

                  {/* User Dropdown */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden py-2 z-[999] text-xs font-semibold">

                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FFC700] text-white font-black flex items-center justify-center text-base uppercase shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-gray-900 truncate text-sm">{user.name}</p>
                            <p className="text-[10px] text-gray-500 font-bold">+91 {user.phone}</p>
                            <span className="inline-block text-[9px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full uppercase mt-0.5">
                              {user.role}{user.isB2B ? ' · B2B' : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Admin links */}
                      {(user.role === 'ADMIN' || user.role === 'STAFF') && (
                        <>
                          <Link
                            href="/admin/products"
                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-emerald-50 text-emerald-800 font-bold"
                            onClick={() => setShowDropdown(false)}
                          >
                            <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                            👑 Admin Products & Catalog
                          </Link>
                          <Link
                            href="/admin/orders"
                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-bold"
                            onClick={() => setShowDropdown(false)}
                          >
                            <LayoutDashboard className="w-4 h-4 text-blue-600" />
                            Orders Dispatch
                          </Link>
                        </>
                      )}

                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-bold"
                        onClick={() => setShowDropdown(false)}
                      >
                        <User className="w-4 h-4 text-gray-500" />
                        My Account & Orders
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-rose-50 text-rose-600 font-bold text-left border-t border-gray-100 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Guest: clean circular icon button */
                <Link
                  href="/account"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-orange-50 hover:ring-2 hover:ring-[#FF6B00]/30 text-gray-500 hover:text-[#FF6B00] transition-all active:scale-95"
                  title="Login / Sign up"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Location City Picker Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#FF6B00]" />
                </div>
                <h3 className="font-black text-sm text-gray-900">Select Delivery City</h3>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 font-medium mt-3 mb-4">
              We deliver frozen foods at -18°C across these regional hubs:
            </p>

            <div className="flex flex-col gap-2">
              {['Latur City (Express 10-Min)', 'Osmanabad Regional', 'Nanded Metro', 'Bidar Hub'].map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setSelectedCity(city)
                    setShowLocationModal(false)
                    showToast(`Delivery area updated to ${city}`, 'info')
                  }}
                  className={`p-3 rounded-2xl text-xs font-bold text-left border transition-all flex items-center gap-2 ${
                    selectedCity === city
                      ? 'bg-orange-50 border-[#FF6B00] text-[#FF6B00]'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${selectedCity === city ? 'text-[#FF6B00]' : 'text-gray-400'}`} />
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </header>
  )
}

export default function Navbar() {
  return (
    <Suspense fallback={<header className="sticky top-0 z-[100] w-full bg-white h-16 shadow-xs border-b border-gray-100" />}>
      <NavbarContent />
    </Suspense>
  )
}
