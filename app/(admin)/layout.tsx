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
      await fetch('/api/auth/logout', { method: 'POST' })
      showToast('Logged out successfully', 'success')
      router.push('/')
    } catch (err) {
      showToast('Logout failed', 'error')
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
      <div className="min-h-screen bg-brand-charcoal flex flex-col items-center justify-center gap-3 text-white">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        <p className="font-body text-xs text-gray-400 font-semibold tracking-wider uppercase">
          Verifying credentials...
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
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      
      {/* 1. Sidebar (Desktop, 240px) */}
      <aside className="hidden md:flex flex-col justify-between w-60 bg-brand-charcoal text-white shrink-0 border-r border-white/5 select-none no-print">
        
        {/* Top brand */}
        <div>
          <div className="p-3 border-b border-white/5 bg-brand-charcoal-soft flex items-center justify-center">
            <div className="bg-white/95 px-2.5 py-1 rounded-2xl shadow-xs border border-white/20 w-full flex items-center justify-center overflow-hidden">
              <AnimatedLogo />
            </div>
          </div>

          {/* Links */}
          <nav className="p-4 flex flex-col gap-1 font-body text-sm font-semibold">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = pathname === link.path
              
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-card transition-all tap-scale ${
                    active 
                      ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/15 font-bold' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              )}
            )}
          </nav>
        </div>

        {/* Bottom actions */}
        <div className="p-4 border-t border-white/5 flex flex-col gap-1 font-body text-sm font-semibold">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white rounded-card hover:bg-white/5 transition-all tap-scale"
          >
            <Home className="w-4.5 h-4.5" />
            <span>Go to Storefront</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:text-rose-500 rounded-card hover:bg-rose-500/5 transition-all text-left tap-scale"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Logout</span>
          </button>
        </div>

      </aside>

      {/* 2. Mobile Bottom tab bar navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-charcoal border-t border-white/5 flex items-center justify-around z-50 select-none no-print">
        {navLinks.map((link) => {
          const Icon = link.icon
          const active = pathname === link.path
          
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`flex flex-col items-center gap-0.5 justify-center flex-1 transition-all ${
                active ? 'text-brand-orange font-bold' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-body">
                {link.name.split(' ')[0]}
              </span>
            </Link>
          )}
        )}
      </nav>

      {/* 3. Main Dashboard Workspace Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0 select-none no-print">
          <h1 className="font-display text-base sm:text-lg font-black text-brand-charcoal capitalize">
            {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Admin Dashboard'}
          </h1>
          <div className="flex items-center gap-3 font-body text-xs font-semibold">
            <span className="text-gray-400 uppercase tracking-widest bg-gray-100 border px-2.5 py-1 rounded-pill">
              {admin.role}
            </span>
            <span className="text-brand-charcoal">{admin.name}</span>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  )
}
