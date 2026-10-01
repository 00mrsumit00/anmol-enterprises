'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardList, Package, BarChart3, Truck, Home, LogOut, Users } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useSocket } from '@/hooks/useSocket'
import AnimatedLogo from '@/components/storefront/AnimatedLogo'

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

  // Verify Admin privileges
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || (data.user.role !== 'ADMIN' && data.user.role !== 'STAFF')) {
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
  }, [router, showToast])

  // Connect Socket.io client and join admin room
  const socket = useSocket()
  useEffect(() => {
    if (socket) {
      socket.emit('join_admin')
    }
  }, [socket])

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

  const navLinks = [
    { name: 'Orders Dispatch', path: '/admin/orders', icon: ClipboardList },
    { name: 'Registered Users', path: '/admin/business-accounts', icon: Users },
    { name: 'Product List', path: '/admin/products', icon: Package },
    { name: 'Inventory Manager', path: '/admin/inventory', icon: BarChart3 },
    { name: 'Driver List', path: '/admin/drivers', icon: Truck },
  ]

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

  // Don't show admin layouts for invoice pages under media print
  const isInvoicePage = pathname.includes('/invoice')

  if (isInvoicePage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans">
      
      {/* 1. Sidebar (Desktop, 256px / w-64) */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-[#0F1117] text-white shrink-0 relative no-print">
        {/* Subtle top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#F59E0B] to-[#D97706]" />
        
        {/* Top brand */}
        <div>
          <div className="pt-6 pb-4 px-4 flex flex-col items-center gap-2">
            <div className="bg-white px-3 py-2.5 rounded-2xl w-full flex items-center justify-center shadow-md border border-white/10 overflow-hidden">
              <AnimatedLogo />
            </div>
            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              Admin Panel
            </span>
          </div>

          {/* Links */}
          <nav className="px-3 flex flex-col gap-1.5 mt-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = pathname === link.path
              
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                    active 
                      ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-[-3px_0_0_0_#F59E0B]' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              )}
            )}
          </nav>
        </div>

        {/* Bottom actions */}
        <div className="p-4 flex flex-col gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all text-sm font-medium"
          >
            <Home className="w-5 h-5" />
            <span>View Storefront</span>
          </Link>
          
          <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-white text-sm font-semibold truncate max-w-[120px]">
                  {admin.name}
                </span>
                <span className="text-slate-400 text-xs">Logged in</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${admin.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {admin.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-rose-400 hover:text-rose-300 bg-rose-400/10 hover:bg-rose-400/20 rounded-lg transition-all text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Mobile Bottom tab bar navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-slate-900 border-t border-slate-800 flex items-center justify-around z-50 select-none no-print shadow-xl">
        {navLinks.map((link) => {
          const Icon = link.icon
          const active = pathname === link.path
          
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`flex flex-col items-center gap-1 justify-center flex-1 h-full transition-all ${
                active ? 'text-[#F59E0B]' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wide">
                {link.name.split(' ')[0]}
              </span>
            </Link>
          )}
        )}
      </nav>

      {/* 3. Main Dashboard Workspace Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-[60px] md:pb-0 h-screen">
        
        {/* Top Header */}
        <header className="bg-white border-b border-[#E2E8F0] h-[60px] flex items-center justify-between px-6 shrink-0 no-print">
          <h1 className="text-lg font-semibold text-slate-800 capitalize">
            {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Admin Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600">Live</span>
            </div>
            
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-px h-6 bg-slate-200"></div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-700 leading-none">{admin.name}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${admin.role === 'ADMIN' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                {admin.role}
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <main className="flex-1 p-5 md:p-7 overflow-y-auto bg-[#F8FAFC]">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
