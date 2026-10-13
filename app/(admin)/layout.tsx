'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardList, Package, BarChart3, Truck, Home, LogOut, Users, Shield, Activity } from 'lucide-react'
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
    { name: 'Registered Users', path: '/admin/business-accounts', icon: Users, perm: 'users' },
    { name: 'Product List', path: '/admin/products', icon: Package, perm: 'products' },
    { name: 'Inventory Manager', path: '/admin/inventory', icon: BarChart3, perm: 'inventory' },
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
    <div className="min-h-screen bg-[#0B0F19] flex flex-col md:flex-row font-sans text-white">
      
      {/* 1. Sidebar (Desktop, 256px / w-64) */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-[#0F1117] text-white shrink-0 relative no-print border-r border-slate-800/80">
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
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
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
      <div className="flex-1 flex flex-col min-w-0 pb-[60px] md:pb-0 h-screen bg-[#0B0F19]">
        
        {/* Top Header */}
        <header className="bg-[#111625] border-b border-slate-800/80 h-[60px] flex items-center justify-between px-6 shrink-0 no-print">
          <h1 className="text-lg font-semibold text-white capitalize">
            {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Admin Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">Live</span>
            </div>
            
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-px h-6 bg-slate-800"></div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-200 leading-none">{admin.name}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
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
        <main className="flex-1 p-5 md:p-7 overflow-y-auto bg-[#0B0F19]">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
