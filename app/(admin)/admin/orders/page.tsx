'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Printer, Clock, Check, Truck, XCircle, Search,
  RefreshCw, Package, Zap, Sun, Moon, ChevronDown,
  AlertCircle, CheckCircle2, Loader2
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useSocket } from '@/hooks/useSocket'

// ─── DESIGN HELPERS ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  PENDING:          { label: 'Pending',       color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', dot: '#94a3b8' },
  CONFIRMED:        { label: 'Confirmed',     color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)',  dot: '#60a5fa' },
  PACKING:          { label: 'Packing',       color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  dot: '#fbbf24' },
  PACKED:           { label: 'Packed',        color: '#c084fc', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)', dot: '#c084fc' },
  ASSIGNED:         { label: 'Assigned',      color: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)', dot: '#818cf8' },
  OUT_FOR_DELIVERY: { label: 'Out for Del.',  color: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.2)',  dot: '#fb923c' },
  DELIVERED:        { label: 'Delivered',     color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',  dot: '#34d399' },
  CANCELLED:        { label: 'Cancelled',     color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', dot: '#f87171' },
}

const STATUS_TABS = ['ALL', 'PENDING', 'CONFIRMED', 'PACKING', 'PACKED', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot, boxShadow: `0 0 4px ${cfg.dot}` }} />
      {cfg.label}
    </span>
  )
}

// ─── GLASS CARD ───────────────────────────────────────────────────────────────

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: 'rgba(255,255,255,0.032)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {children}
    </div>
  )
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent, icon: Icon }: any) {
  return (
    <div
      className="relative flex flex-col justify-between p-4 rounded-2xl overflow-hidden group"
      style={{
        background: `linear-gradient(135deg, ${accent}10 0%, ${accent}04 100%)`,
        border: `1px solid ${accent}20`,
      }}
    >
      {/* Glow orb */}
      <div
        className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between relative z-10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: accent }} strokeWidth={2} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: accent }}>Live</span>
      </div>
      <div className="relative z-10 mt-3">
        <p className="text-2xl font-black text-white leading-none tabular-nums">{value}</p>
        <p className="text-[10px] font-semibold mt-1" style={{ color: '#64748b' }}>{label}</p>
        {sub && <p className="text-[9px] font-medium mt-0.5" style={{ color: accent }}>{sub}</p>}
      </div>
    </div>
  )
}

// ─── ACTION BUTTON ────────────────────────────────────────────────────────────

function ActionBtn({
  onClick,
  color,
  label,
  icon: Icon,
  disabled = false,
}: {
  onClick: () => void
  color: string
  label: string
  icon?: any
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all duration-150 active:scale-95 disabled:opacity-40"
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}35`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${color}28`
        e.currentTarget.style.boxShadow = `0 0 12px ${color}20`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = `${color}18`
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {Icon && <Icon className="w-3 h-3" strokeWidth={2.5} />}
      {label}
    </button>
  )
}

// ─── INPUT STYLE ──────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#cbd5e1',
  borderRadius: '10px',
  padding: '8px 12px',
  fontSize: '11px',
  fontWeight: 600,
  outline: 'none',
  width: '100%',
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [slotFilter, setSlotFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null)
  const [flashingOrders, setFlashingOrders] = useState<Record<string, boolean>>({})

  const { data: orders = [], isLoading: ordersLoading, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders/all')
      if (!res.ok) throw new Error('Failed to fetch orders')
      return res.json()
    },
  })

  const { data: drivers = [] } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: async () => {
      const res = await fetch('/api/drivers')
      if (!res.ok) throw new Error('Failed to fetch drivers')
      return res.json()
    },
  })

  const socket = useSocket()
  useEffect(() => {
    if (!socket) return
    socket.on('new_order', (newOrder: any) => {
      queryClient.setQueryData(['admin-orders'], (old: any[] | undefined) => {
        if (!old) return [newOrder]
        if (old.some((o) => o.id === newOrder.id)) return old
        return [newOrder, ...old]
      })
      setFlashingOrders((c) => ({ ...c, [newOrder.id]: true }))
      setTimeout(() => setFlashingOrders((c) => ({ ...c, [newOrder.id]: false })), 5000)
      showToast(`⚡ New order: #${newOrder.orderNumber}`, 'success')
    })
    socket.on('order_list_update', (updated: any) => {
      queryClient.setQueryData(['admin-orders'], (old: any[] | undefined) =>
        old ? old.map((o) => (o.id === updated.id ? updated : o)) : [updated]
      )
    })
    return () => { socket.off('new_order'); socket.off('order_list_update') }
  }, [socket, queryClient, showToast])

  const updateStatus = async (orderId: string, status: string, note?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      showToast(`Order → ${status}`, 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error')
    }
  }

  const assignDriver = async (orderId: string, driverId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      showToast('Driver assigned', 'success')
      setAssigningOrder(null)
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    } catch (err: any) {
      showToast(err.message || 'Assignment failed', 'error')
    }
  }

  const filtered = orders.filter((order: any) => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false
    if (slotFilter !== 'ALL' && order.deliverySlot !== slotFilter) return false
    const orderDate = new Date(order.deliveryDate).toISOString().slice(0, 10)
    if (orderDate !== selectedDate) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (
        !order.orderNumber.toLowerCase().includes(q) &&
        !order.guestPhone?.includes(q) &&
        !order.user?.phone?.includes(q) &&
        !order.guestName?.toLowerCase().includes(q) &&
        !order.user?.name?.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  // Stats derived from today's orders
  const todayOrders = orders.filter((o: any) => {
    const d = new Date(o.deliveryDate).toISOString().slice(0, 10)
    return d === new Date().toISOString().slice(0, 10)
  })
  const totalRevenue = todayOrders.reduce((s: number, o: any) => s + o.totalAmount, 0)
  const pendingCount = todayOrders.filter((o: any) => o.status === 'PENDING' || o.status === 'CONFIRMED').length
  const deliveredCount = todayOrders.filter((o: any) => o.status === 'DELIVERED').length
  const inTransitCount = todayOrders.filter((o: any) => o.status === 'OUT_FOR_DELIVERY' || o.status === 'ASSIGNED').length

  return (
    <div className="flex flex-col gap-5 select-none no-print" style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Package}   accent="#22d3ee" label="Today's Orders"  value={todayOrders.length}               sub={`${filtered.length} visible`} />
        <StatCard icon={Clock}     accent="#fbbf24" label="Needs Attention"  value={pendingCount}                    sub="Pending + Confirmed" />
        <StatCard icon={Truck}     accent="#fb923c" label="In Transit"       value={inTransitCount}                  sub="Assigned + OFD" />
        <StatCard icon={CheckCircle2} accent="#34d399" label="Delivered"     value={deliveredCount}                  sub={`₹${totalRevenue.toLocaleString('en-IN')} collected`} />
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <GlassCard className="p-4 flex flex-col gap-4">

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_TABS.map((s) => {
            const cfg = s === 'ALL' ? null : STATUS_CONFIG[s]
            const count = s === 'ALL' ? filtered.length : orders.filter((o: any) => o.status === s).length
            const active = statusFilter === s
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all duration-150"
                style={{
                  background: active ? (cfg ? `${cfg.color}20` : 'rgba(34,211,238,0.15)') : 'rgba(255,255,255,0.04)',
                  color: active ? (cfg?.color || '#22d3ee') : '#475569',
                  border: `1px solid ${active ? (cfg?.border || 'rgba(34,211,238,0.3)') : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                {cfg && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
                )}
                {s === 'OUT_FOR_DELIVERY' ? 'OFD' : s === 'ALL' ? 'All' : cfg?.label}
                <span
                  className="ml-0.5 px-1 py-0.5 rounded text-[9px] font-black tabular-nums"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}
                >
                  {count}
                </span>
              </button>
            )
          })}
          <button
            onClick={() => refetch()}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-150 text-slate-500 hover:text-cyan-400"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {/* Input Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            <input
              type="text"
              placeholder="Search order, customer, phone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '32px' }}
            />
          </div>
          {/* Date */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={inputStyle}
          />
          {/* Slot */}
          <select
            value={slotFilter}
            onChange={(e) => setSlotFilter(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="ALL">All Delivery Slots</option>
            <option value="MORNING">Morning Slot</option>
            <option value="EVENING">Evening Slot</option>
          </select>
        </div>
      </GlassCard>

      {/* ── Orders Table ───────────────────────────────────────────── */}
      <GlassCard className="overflow-hidden">

        {/* Table header row */}
        <div
          className="grid gap-3 px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em]"
          style={{
            gridTemplateColumns: '140px 1fr 90px 1fr 90px 120px 110px 120px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            color: '#334155',
          }}
        >
          <span>Order</span>
          <span>Customer</span>
          <span>Slot</span>
          <span>Items</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Driver</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Table body */}
        {ordersLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#22d3ee' }} />
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#334155' }}>
              Loading dispatch list…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <AlertCircle className="w-6 h-6" style={{ color: '#334155' }} />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#334155' }}>
              No orders match your filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filtered.map((order: any, idx: number) => {
              const isFlashing = flashingOrders[order.id]
              const customerName = order.businessName
                ? `${order.businessName}`
                : order.guestName || order.user?.name || '—'
              const customerPhone = order.guestPhone || order.user?.phone

              return (
                <div
                  key={order.id}
                  className="grid gap-3 px-4 py-3.5 items-center transition-all duration-500"
                  style={{
                    gridTemplateColumns: '140px 1fr 90px 1fr 90px 120px 110px 120px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: isFlashing
                      ? 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.03) 100%)'
                      : 'transparent',
                    boxShadow: isFlashing ? 'inset 3px 0 0 #fbbf24' : 'none',
                  }}
                >
                  {/* Order # */}
                  <div>
                    <p className="text-xs font-black text-slate-200 leading-tight">#{order.orderNumber}</p>
                    <p className="text-[9px] font-semibold mt-0.5 tabular-nums" style={{ color: '#475569' }}>
                      {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {isFlashing && (
                      <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider mt-1" style={{ color: '#fbbf24' }}>
                        <Zap className="w-2.5 h-2.5" />NEW
                      </span>
                    )}
                  </div>

                  {/* Customer */}
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-300 truncate leading-tight">{customerName}</p>
                    <p className="text-[9px] font-medium mt-0.5 truncate" style={{ color: '#475569' }}>
                      +91 {customerPhone}
                    </p>
                    {order.businessName && (
                      <span className="inline-block text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded mt-0.5" style={{ background: 'rgba(244,114,182,0.1)', color: '#f472b6', border: '1px solid rgba(244,114,182,0.2)' }}>B2B</span>
                    )}
                  </div>

                  {/* Slot */}
                  <div>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide"
                      style={{
                        background: order.deliverySlot === 'MORNING' ? 'rgba(251,191,36,0.1)' : 'rgba(129,140,248,0.1)',
                        color: order.deliverySlot === 'MORNING' ? '#fbbf24' : '#818cf8',
                        border: `1px solid ${order.deliverySlot === 'MORNING' ? 'rgba(251,191,36,0.2)' : 'rgba(129,140,248,0.2)'}`,
                      }}
                    >
                      {order.deliverySlot === 'MORNING' ? <Sun className="w-2.5 h-2.5" /> : <Moon className="w-2.5 h-2.5" />}
                      {order.deliverySlot === 'MORNING' ? 'AM' : 'PM'}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="min-w-0">
                    {order.items.slice(0, 2).map((item: any, i: number) => (
                      <p key={i} className="text-[10px] font-medium truncate leading-snug" style={{ color: '#475569' }}>
                        {item.quantity}× {item.productName}
                      </p>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-[9px] font-bold" style={{ color: '#334155' }}>+{order.items.length - 2} more</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <p className="text-sm font-black text-slate-200 leading-tight">₹{order.totalAmount}</p>
                    <p className="text-[9px] font-semibold mt-0.5" style={{
                      color: order.paymentMethod === 'CASH_ON_DELIVERY' ? '#34d399'
                        : order.paymentMethod === 'CREDIT_ACCOUNT' ? '#c084fc'
                        : order.paymentStatus === 'PAID' ? '#34d399' : '#fbbf24'
                    }}>
                      {order.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD'
                        : order.paymentMethod === 'CREDIT_ACCOUNT' ? 'Credit'
                        : order.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}
                    </p>
                  </div>

                  {/* Status */}
                  <StatusBadge status={order.status} />

                  {/* Driver */}
                  <div className="min-w-0">
                    {order.driver ? (
                      <div>
                        <p className="text-[10px] font-bold text-slate-300 truncate leading-tight">{order.driver.name}</p>
                        <p className="text-[9px] font-medium truncate" style={{ color: '#475569' }}>{order.driver.vehicleNumber}</p>
                      </div>
                    ) : (
                      <span className="text-[9px] font-medium italic" style={{ color: '#334155' }}>Unassigned</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    {/* Invoice */}
                    <a
                      href={`/admin/orders/${order.id}/invoice`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#22d3ee'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                      title="Print Invoice"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </a>

                    {order.status === 'PENDING' && (
                      <ActionBtn color="#60a5fa" icon={Check}    label="Confirm"   onClick={() => updateStatus(order.id, 'CONFIRMED')} />
                    )}
                    {order.status === 'CONFIRMED' && (
                      <ActionBtn color="#fbbf24" icon={Package}  label="Pack"      onClick={() => updateStatus(order.id, 'PACKING')} />
                    )}
                    {order.status === 'PACKING' && (
                      <ActionBtn color="#c084fc" icon={Package}  label="Cold Store" onClick={() => updateStatus(order.id, 'PACKED')} />
                    )}
                    {order.status === 'PACKED' && (
                      <div className="relative">
                        <ActionBtn
                          color="#818cf8"
                          icon={ChevronDown}
                          label="Assign"
                          onClick={() => setAssigningOrder(assigningOrder === order.id ? null : order.id)}
                        />
                        {assigningOrder === order.id && (
                          <div
                            className="absolute right-0 mt-1.5 min-w-[180px] rounded-xl overflow-hidden z-50"
                            style={{
                              background: '#0d1117',
                              border: '1px solid rgba(129,140,248,0.2)',
                              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                            }}
                          >
                            <div
                              className="px-3 py-2 text-[9px] font-black uppercase tracking-widest"
                              style={{ color: '#475569', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                            >
                              Select Driver
                            </div>
                            {drivers.filter((d: any) => d.isActive).map((driver: any) => (
                              <button
                                key={driver.id}
                                onClick={() => assignDriver(order.id, driver.id)}
                                className="w-full px-3 py-2.5 text-left text-[11px] font-semibold text-slate-300 transition-all"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(129,140,248,0.08)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                {driver.name}
                                <span className="text-[9px] text-slate-600 ml-1">· {driver.vehicleType}</span>
                              </button>
                            ))}
                            {drivers.filter((d: any) => d.isActive).length === 0 && (
                              <p className="px-3 py-2 text-[11px] italic text-slate-600">No active drivers</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {order.status === 'ASSIGNED' && (
                      <ActionBtn color="#fb923c" icon={Truck} label="Dispatch" onClick={() => updateStatus(order.id, 'OUT_FOR_DELIVERY')} />
                    )}
                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <ActionBtn color="#34d399" icon={Check} label="Delivered" onClick={() => updateStatus(order.id, 'DELIVERED')} />
                    )}

                    {/* Cancel */}
                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => {
                          if (confirm(`Cancel order #${order.orderNumber}?`)) updateStatus(order.id, 'CANCELLED')
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150"
                        style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: '#64748b' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.12)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(248,113,113,0.06)' }}
                        title="Cancel Order"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Table footer */}
        {!ordersLoading && filtered.length > 0 && (
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
          >
            <p className="text-[10px] font-semibold" style={{ color: '#334155' }}>
              Showing {filtered.length} of {orders.length} orders
            </p>
            <p className="text-[10px] font-bold" style={{ color: '#22d3ee' }}>
              Total: ₹{filtered.reduce((s: number, o: any) => s + o.totalAmount, 0).toLocaleString('en-IN')}
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
