'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardList, Package, BarChart3, Truck, Home, LogOut, Users, Shield, Activity, Layers, TrendingUp, MessageSquare, Radio, Tag, Menu, X, MoreHorizontal, ChevronRight } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useSocket } from '@/hooks/useSocket'
import AnimatedLogo from '@/components/storefront/AnimatedLogo'
import { AdminThemeProvider, AdminThemeToggle } from '@/components/admin/AdminThemeProvider'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useToast()

  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Automatically close mobile slide-up drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const isLoginPage = pathname === '/admin/login'
  const isInvoicePage = pathname.includes('/invoice')

  // Verify Admin privileges — skip entirely for login page and invoice print
  useEffect(() => {
    if (isLoginPage || isInvoicePage) {
      setLoading(false)
      return
    }

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || (data.user.role !== 'SUPER_ADMIN' && data.user.role !== 'ADMIN' && data.user.role !== 'STAFF')) {
          showToast('Access Denied. Admin privileges required.', 'error')
          router.push('/admin/login')
        } else {
          setAdmin(data.user)
        }
      })
      .catch(() => {
        router.push('/admin/login')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [router, showToast, isLoginPage, isInvoicePage])

  // Connect Socket.io client and join admin room
  const socket = useSocket()
  useEffect(() => {
    if (socket && admin) {
      socket.emit('join_admin')
    }
  }, [socket, admin])

  // Ensure body and html background are dark while inside admin layout to prevent white flashing/letterboxing
  useEffect(() => {
    document.body.classList.add('bg-[#0B0F19]')
    document.documentElement.classList.add('bg-[#0B0F19]')
    return () => {
      document.body.classList.remove('bg-[#0B0F19]')
      document.documentElement.classList.remove('bg-[#0B0F19]')
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
    } catch {}

    try {
      localStorage.removeItem('admin')
      localStorage.removeItem('token')
      sessionStorage.clear()
    } catch {}

    setAdmin(null)
    showToast('Logged out successfully', 'success')
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login'
    }
  }

  // Define all available navigation modules with permission keys and role gates
  const allNavLinks = [
    { name: 'Orders Dispatch', path: '/admin/orders', icon: ClipboardList, perm: 'orders' },
    { name: 'Messages', path: '/admin/messages', icon: MessageSquare, perm: 'orders' },
    { name: 'Broadcast', path: '/admin/broadcasts', icon: Radio, minRole: 'ADMIN' },
    { name: 'Registered Users', path: '/admin/business-accounts', icon: Users, perm: 'users' },
    { name: 'Product List', path: '/admin/products', icon: Package, perm: 'products' },
    { name: 'Categories', path: '/admin/categories', icon: Layers, perm: 'products' },
    { name: 'Coupons & Offers', path: '/admin/coupons', icon: Tag, perm: 'orders' },
    { name: 'Inventory Manager', path: '/admin/inventory', icon: BarChart3, perm: 'inventory' },
    { name: 'Reports & Analytics', path: '/admin/reports', icon: TrendingUp, perm: 'orders' },
    { name: 'Staff Management', path: '/admin/sub-admins', icon: Shield, minRole: 'ADMIN' },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: Activity, minRole: 'ADMIN' },
  ]

  // Filter nav links:
  // 1. SUPER_ADMIN gets unrestricted access to all links
  // 2. ADMIN (Sub-Admin) can access Staff Management and Audit Logs + their allowed modules
  // 3. STAFF only sees operational modules permitted to them
  const navLinks = allNavLinks.filter((link) => {
    if (admin?.role === 'SUPER_ADMIN') return true
    
    // Check role gate if defined (ADMIN or higher)
    if (link.minRole === 'ADMIN') {
      return admin?.role === 'ADMIN' || admin?.role === 'SUPER_ADMIN'
    }
    
    // If permissions array is configured on the user, check permission
    if (admin?.permissions && Array.isArray(admin.permissions)) {
      return admin.permissions.includes(link.perm)
    }
    
    // Default fallback for legacy staff accounts without permissions array:
    return link.perm !== 'users'
  })

  // Partition navigation into 4 Primary Bottom Tabs + Secondary modules inside "More ☰" drawer
  const primaryPaths = ['/admin/orders', '/admin/messages', '/admin/products', '/admin/business-accounts']
  const primaryNavLinks = navLinks.filter((l) => primaryPaths.includes(l.path))
  const secondaryNavLinks = navLinks.filter((l) => !primaryPaths.includes(l.path))
  const isSecondaryActive = secondaryNavLinks.some((l) => pathname === l.path)

  // Login page & invoice print: Render raw children directly without sidebar or auth gate
  if (isLoginPage || isInvoicePage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium tracking-wide">
          Verifying access...
        </p>
      </div>
    )
  }

  if (!admin) return null

  return (
    <AdminThemeProvider>
      <div id="admin-main-container" className="fixed inset-0 w-full h-full h-[100dvh] overflow-hidden bg-[#0B0F19] flex flex-col md:flex-row font-sans text-white">
        
        {/* 1. Sidebar (Desktop, 240px - 256px / w-60 lg:w-64) */}
        <aside className="hidden md:flex flex-col justify-between w-60 lg:w-64 bg-[#0F1117] text-white shrink-0 relative no-print border-r border-slate-800/80 h-full max-h-screen overflow-hidden">
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#F59E0B] to-[#D97706]" />
          
          {/* Top brand */}
          <div className="shrink-0">
            <div className="pt-3 pb-2 px-3 flex flex-col items-center gap-1.5">
              <div className="bg-white px-2.5 py-1.5 rounded-xl w-full flex items-center justify-center shadow-md border border-white/10 overflow-hidden max-h-[44px]">
                <AnimatedLogo />
              </div>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Links */}
          <nav className="px-2.5 flex flex-col gap-1 mt-1 overflow-y-auto flex-1 min-h-0 scrollbar-none">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = pathname === link.path
              
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-2.5 px-3 py-1.5 lg:py-2 rounded-lg transition-all duration-150 text-xs font-semibold ${
                    active 
                      ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-[-3px_0_0_0_#F59E0B]' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{link.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Bottom actions */}
          <div className="p-2.5 lg:p-3 flex flex-col gap-1.5 shrink-0 border-t border-slate-800/60 bg-[#0F1117]">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all text-xs font-medium"
            >
              <Home className="w-4 h-4" />
              <span>View Storefront</span>
            </Link>
            
            <div className="bg-white/5 rounded-xl p-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-white text-xs font-bold truncate max-w-[110px]">
                    {admin.name}
                  </span>
                  <span className="text-slate-500 text-[10px]">Logged in</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  admin.role === 'SUPER_ADMIN' 
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                    : admin.role === 'ADMIN' 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {admin.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : admin.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-rose-400 hover:text-rose-300 bg-rose-400/10 hover:bg-rose-400/20 rounded-lg transition-all text-xs font-bold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-Up "More" Navigation Drawer Backdrop */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Mobile Slide-Up "More" Navigation Drawer */}
        <div 
          className={`md:hidden fixed bottom-[60px] left-0 right-0 max-h-[82vh] overflow-y-auto bg-[#0F1422] border-t border-slate-800 rounded-t-3xl z-50 p-5 shadow-2xl transition-all duration-300 ease-out ${
            mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          {/* Drawer Handle */}
          <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-4" />

          {/* Drawer Header with Admin Profile */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F59E0B] to-[#D97706] text-white font-bold flex items-center justify-center text-sm shadow-md">
                {admin.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">{admin.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mt-0.5 ${
                  admin.role === 'SUPER_ADMIN' 
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                    : admin.role === 'ADMIN' 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {admin.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : admin.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 active:scale-95 transition-all"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Secondary Modules Grid */}
          <div className="mt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
              More Admin Modules
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {secondaryNavLinks.map((link) => {
                const Icon = link.icon
                const active = pathname === link.path
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl transition-all ${
                      active
                        ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white font-semibold shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800/80'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-amber-400" />
                    <span className="text-xs truncate">{link.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Storefront & Logout Quick Actions */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800/80 text-xs font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-emerald-400" />
                <span>View Storefront</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-3 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-xs font-bold transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout from Admin</span>
            </button>
          </div>
        </div>

        {/* 2. Mobile 5-Tab Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-[#0E131F]/95 backdrop-blur-md border-t border-slate-800/90 flex items-center justify-around z-50 select-none no-print shadow-2xl px-1">
          {primaryNavLinks.map((link) => {
            const Icon = link.icon
            const active = pathname === link.path
            const shortName = link.path === '/admin/business-accounts' 
              ? 'Accounts' 
              : link.name.replace(' Dispatch', '').replace('Registered ', '').replace(' List', '')
            
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                  active ? 'text-[#F59E0B] font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${active ? 'bg-amber-400/10' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 font-medium truncate max-w-[68px]">
                  {shortName}
                </span>
              </Link>
            )
          })}

          {/* 5th Tab: More Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
              isSecondaryActive || mobileMenuOpen ? 'text-[#F59E0B] font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="More navigation options"
          >
            <div className={`relative p-1 rounded-xl transition-all ${isSecondaryActive || mobileMenuOpen ? 'bg-amber-400/10' : ''}`}>
              <Menu className="w-5 h-5" />
              {isSecondaryActive && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-amber-400 shadow-xs" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 font-medium">
              More
            </span>
          </button>
        </nav>

        {/* 3. Main Dashboard Workspace Content */}
        <div className="flex-1 flex flex-col min-w-0 pb-[65px] md:pb-0 h-full max-h-screen overflow-hidden bg-[#0B0F19]">
          
          {/* Top Header */}
          <header className="bg-[#111625] border-b border-slate-800/80 h-[50px] flex items-center justify-between px-4 sm:px-6 shrink-0 no-print">
            <h1 className="text-sm sm:text-base font-bold text-white capitalize truncate max-w-[180px] sm:max-w-none">
              {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Admin Dashboard'}
            </h1>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Live Status Indicator */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-500/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-emerald-400">Live</span>
              </div>

              {/* Theme Toggle Button (Light / Dark) */}
              <AdminThemeToggle />
              
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-px h-5 bg-slate-800"></div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold text-slate-200 leading-none">{admin.name}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  admin.role === 'SUPER_ADMIN' 
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30 font-extrabold shadow-xs' 
                    : admin.role === 'ADMIN' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {admin.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : admin.role}
                </span>
              </div>
            </div>
          </header>

          {/* Dashboard Workspace */}
          <main id="admin-main-workspace" className="flex-1 p-3 sm:p-4 md:p-5 overflow-y-auto bg-[#0B0F19]">
            <div className="max-w-[1600px] mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminThemeProvider>
  )
}
