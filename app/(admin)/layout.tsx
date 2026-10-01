'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ClipboardList, Package, BarChart3, Truck, Home, LogOut,
  Users, Snowflake, Bell, ChevronRight, Activity, Menu, X
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useSocket } from '@/hooks/useSocket'

// ─── NAV STRUCTURE ────────────────────────────────────────────────────────────

const navLinks = [
  {
    group: 'Operations',
    items: [
      { name: 'Orders', label: 'Dispatch & Track', path: '/admin/orders', icon: ClipboardList, accent: '#22d3ee', badge: null },
      { name: 'Inventory', label: 'Stock Control', path: '/admin/inventory', icon: BarChart3, accent: '#a78bfa', badge: null },
      { name: 'Drivers', label: 'Fleet Manager', path: '/admin/drivers', icon: Truck, accent: '#fb923c', badge: null },
    ]
  },
  {
    group: 'Catalogue',
    items: [
      { name: 'Products', label: 'Product Catalogue', path: '/admin/products', icon: Package, accent: '#34d399', badge: null },
    ]
  },
  {
    group: 'Customers',
    items: [
      { name: 'Users', label: 'Retail & B2B', path: '/admin/business-accounts', icon: Users, accent: '#f472b6', badge: null },
    ]
  },
]

// ─── ANIMATED PULSE DOT ───────────────────────────────────────────────────────

function PulseDot({ color = '#22d3ee' }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ backgroundColor: color }}
      />
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
    </span>
  )
}

// ─── NAV ITEM ────────────────────────────────────────────────────────────────

function NavItem({ item, active, onClick }: { item: any; active: boolean; onClick?: () => void }) {
  const Icon = item.icon
  return (
    <Link
      href={item.path}
      onClick={onClick}
      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 overflow-hidden"
      style={{
        background: active
          ? `linear-gradient(135deg, ${item.accent}18 0%, ${item.accent}08 100%)`
          : 'transparent',
        border: active ? `1px solid ${item.accent}30` : '1px solid transparent',
      }}
    >
      {/* Active left border glow */}
      {active && (
        <div
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
          style={{ backgroundColor: item.accent, boxShadow: `0 0 8px ${item.accent}` }}
        />
      )}

      {/* Icon container */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
        style={{
          background: active ? `${item.accent}20` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${active ? item.accent + '40' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        <Icon
          className="w-4 h-4 transition-all duration-200"
          style={{ color: active ? item.accent : '#64748b', strokeWidth: active ? 2.5 : 1.8 }}
        />
      </div>

      {/* Label */}
      <div className="flex flex-col min-w-0">
        <span
          className="text-xs font-semibold leading-tight transition-colors duration-200 truncate"
          style={{ color: active ? '#f1f5f9' : '#64748b' }}
        >
          {item.name}
        </span>
        <span className="text-[9px] font-medium leading-tight truncate" style={{ color: active ? item.accent : '#475569' }}>
          {item.label}
        </span>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%)` }}
      />
    </Link>
  )
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar({ admin, pathname, onLogout, mobile = false, onClose }: any) {
  return (
    <aside
      className="flex flex-col h-full select-none"
      style={{
        background: 'linear-gradient(180deg, #0d1117 0%, #0a0f1a 50%, #0d1117 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        width: mobile ? '280px' : '240px',
      }}
    >
      {/* Brand Header */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Logo mark */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative"
            style={{
              background: 'linear-gradient(135deg, #0c831f 0%, #22d3ee20 100%)',
              border: '1px solid rgba(34, 211, 238, 0.2)',
              boxShadow: '0 0 20px rgba(12, 131, 31, 0.3)',
            }}
          >
            <Snowflake className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-white leading-tight truncate tracking-tight">Anmol Enterprises</p>
            <div className="flex items-center gap-1 mt-0.5">
              <PulseDot color="#22d3ee" />
              <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-widest">Live Control</span>
            </div>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 no-scrollbar">
        {navLinks.map((group) => (
          <div key={group.group}>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-600 px-3 mb-1.5">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  active={pathname === item.path}
                  onClick={mobile ? onClose : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-1 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>

        {/* Admin Info */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-xs text-white"
            style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #E05C00 100%)' }}
          >
            {admin?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate leading-tight">{admin?.name || 'Admin'}</p>
            <p className="text-[9px] text-slate-500 font-medium leading-tight">{admin?.role || 'ADMIN'}</p>
          </div>
          <div
            className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider"
            style={{ background: '#FF6B0020', color: '#FB923C', border: '1px solid #FF6B0030' }}
          >
            {admin?.role?.slice(0, 3) || 'ADM'}
          </div>
        </div>

        {/* Storefront link */}
        <Link
          href="/"
          onClick={mobile ? onClose : undefined}
          className="group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 text-slate-500 hover:text-slate-300"
          style={{ border: '1px solid transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Home className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs font-medium">View Storefront</span>
          <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 text-slate-500 hover:text-rose-400"
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

// ─── TOPBAR ──────────────────────────────────────────────────────────────────

function Topbar({ admin, pathname, onMenuClick }: any) {
  // Derive page title from path
  const pageMap: Record<string, { title: string; subtitle: string; accent: string }> = {
    '/admin/orders': { title: 'Orders Dispatch', subtitle: 'Real-time order management', accent: '#22d3ee' },
    '/admin/inventory': { title: 'Inventory', subtitle: 'Stock levels & adjustments', accent: '#a78bfa' },
    '/admin/drivers': { title: 'Driver Fleet', subtitle: 'Fleet & delivery management', accent: '#fb923c' },
    '/admin/products': { title: 'Products', subtitle: 'Catalogue management', accent: '#34d399' },
    '/admin/business-accounts': { title: 'Registered Users', subtitle: 'Retail & B2B customers', accent: '#f472b6' },
  }
  const page = pageMap[pathname] || { title: 'Dashboard', subtitle: 'Anmol Enterprises Control', accent: '#22d3ee' }

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <header
      className="shrink-0 flex items-center justify-between px-4 md:px-6 h-14 no-print"
      style={{
        background: 'rgba(10, 15, 26, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Left: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <Menu className="w-4 h-4" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black text-slate-100 leading-tight">{page.title}</h1>
            <span
              className="hidden sm:inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: `${page.accent}15`, color: page.accent, border: `1px solid ${page.accent}30` }}
            >
              <Activity className="w-2.5 h-2.5" />
              Live
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight hidden sm:block">{page.subtitle}</p>
        </div>
      </div>

      {/* Right: Time + Bell + Avatar */}
      <div className="flex items-center gap-2.5">
        {/* Clock */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-bold text-slate-300 leading-tight tabular-nums">{timeStr}</span>
          <span className="text-[9px] text-slate-600 leading-tight">{dateStr}</span>
        </div>

        {/* Notification bell */}
        <button
          className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 text-slate-400 hover:text-slate-200"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Bell className="w-3.5 h-3.5" />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }}
          />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0"
          style={{
            background: 'linear-gradient(135deg, #FF6B00 0%, #E05C00 100%)',
            boxShadow: '0 0 0 2px rgba(255, 107, 0, 0.2)',
          }}
        >
          {admin?.name?.[0]?.toUpperCase() || 'A'}
        </div>
      </div>
    </header>
  )
}

// ─── ROOT LAYOUT ─────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useToast()

  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

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
      .catch(() => router.push('/admin/login'))
      .finally(() => setLoading(false))
  }, [router, showToast])

  const socket = useSocket()
  useEffect(() => {
    if (socket) socket.emit('join_admin')
  }, [socket])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    } catch {}
    try {
      localStorage.removeItem('admin')
      localStorage.removeItem('token')
      sessionStorage.clear()
    } catch {}
    setAdmin(null)
    showToast('Signed out successfully', 'success')
    if (typeof window !== 'undefined') window.location.href = '/admin/login'
  }

  // ── Loading Screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: 'linear-gradient(135deg, #0d1117 0%, #0a0f1a 100%)' }}
      >
        {/* Animated ring */}
        <div className="relative">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0c831f 0%, #22d3ee20 100%)', border: '1px solid rgba(34,211,238,0.3)' }}
          >
            <Snowflake className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs font-black text-slate-300 tracking-wider">VERIFYING ACCESS</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Anmol Enterprises Command Centre</p>
        </div>
        {/* Loading bar */}
        <div className="w-32 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #22d3ee, #0c831f)',
              animation: 'loadbar 1.4s ease-in-out infinite',
              width: '40%',
            }}
          />
        </div>
        <style>{`
          @keyframes loadbar {
            0% { margin-left: 0%; width: 40%; }
            50% { margin-left: 60%; width: 40%; }
            100% { margin-left: 0%; width: 40%; }
          }
        `}</style>
      </div>
    )
  }

  if (!admin) return null

  // Invoice pages bypass the shell
  if (pathname.includes('/invoice')) return <>{children}</>

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ background: '#080d14' }}
    >
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <div className="hidden md:flex shrink-0" style={{ width: '240px' }}>
        <Sidebar admin={admin} pathname={pathname} onLogout={handleLogout} />
      </div>

      {/* ── Mobile Sidebar Overlay ───────────────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div
            className="md:hidden fixed inset-y-0 left-0 z-50 flex"
            style={{ animation: 'slideInLeft 0.25s cubic-bezier(0.16,1,0.3,1)' }}
          >
            <Sidebar admin={admin} pathname={pathname} onLogout={handleLogout} mobile onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Topbar */}
        <Topbar admin={admin} pathname={pathname} onMenuClick={() => setMobileOpen(true)} />

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 no-print"
          style={{ background: '#080d14' }}
        >
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center no-print"
          style={{
            height: '60px',
            background: 'rgba(10,15,26,0.95)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {navLinks.flatMap(g => g.items).map((item) => {
            const Icon = item.icon
            const active = pathname === item.path
            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all"
              >
                <div
                  className="w-8 h-7 flex items-center justify-center rounded-lg transition-all"
                  style={{
                    background: active ? `${item.accent}20` : 'transparent',
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: active ? item.accent : '#475569', strokeWidth: active ? 2.5 : 1.8 }}
                  />
                </div>
                <span
                  className="text-[8px] font-bold leading-tight"
                  style={{ color: active ? item.accent : '#475569' }}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* ── Global Animations ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
