'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Printer, Check, XCircle, Search, RefreshCw, Calendar, 
  Package, X, Clock, Download, Phone, Truck, AlertTriangle, Snowflake
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useSocket } from '@/hooks/useSocket'

export default function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // State Filters (Slot system removed)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().slice(0, 10)
  })
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10))
  
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null)
  
  // Flash tracking for real-time new orders
  const [flashingOrders, setFlashingOrders] = useState<Record<string, boolean>>({})

  // Fetch initial orders
  const { data: orders = [], isLoading: ordersLoading, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders/all')
      if (!res.ok) throw new Error('Failed to fetch orders')
      return res.json()
    }
  })

  // Fetch active drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: async () => {
      const res = await fetch('/api/drivers')
      if (!res.ok) throw new Error('Failed to fetch drivers')
      return res.json()
    }
  })

  // Connect Socket.io for live dashboard updates
  const socket = useSocket()

  useEffect(() => {
    if (!socket) return

    // Triggered when a customer places a new order
    socket.on('new_order', (newOrder: any) => {
      queryClient.setQueryData(['admin-orders'], (oldOrders: any[] | undefined) => {
        if (!oldOrders) return [newOrder]
        if (oldOrders.some(o => o.id === newOrder.id)) return oldOrders
        return [newOrder, ...oldOrders]
      })

      // Add flashing highlight animation
      setFlashingOrders(current => ({ ...current, [newOrder.id]: true }))
      setTimeout(() => {
        setFlashingOrders(current => ({ ...current, [newOrder.id]: false }))
      }, 5000)

      showToast(`⚡ New order placed: #${newOrder.orderNumber}`, 'success')
    })

    // Triggered when an order status is updated
    socket.on('order_list_update', (updatedOrder: any) => {
      queryClient.setQueryData(['admin-orders'], (oldOrders: any[] | undefined) => {
        if (!oldOrders) return [updatedOrder]
        return oldOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
      })
      showToast(`Order #${updatedOrder.orderNumber} updated to ${updatedOrder.status}`, 'info')
    })

    return () => {
      socket.off('new_order')
      socket.off('order_list_update')
    }
  }, [socket, queryClient, showToast])

  // Update order status API trigger
  const updateStatus = async (orderId: string, status: string, note?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update status')
      
      showToast(`Status updated to: ${status}`, 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error')
    }
  }

  // Assign driver API trigger
  const assignDriver = async (orderId: string, driverId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to assign driver')
      
      showToast('Driver assigned successfully', 'success')
      setAssigningOrder(null)
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    } catch (err: any) {
      showToast(err.message || 'Assignment failed', 'error')
    }
  }

  // Filter calculations (Slot filter removed)
  const getFilteredOrders = () => {
    return orders.filter((order: any) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) return false

      // 2. Date Range Filter
      if (order.createdAt || order.deliveryDate) {
        const orderDate = new Date(order.createdAt || order.deliveryDate).toISOString().slice(0, 10)
        if (fromDate && orderDate < fromDate) return false
        if (toDate && orderDate > toDate) return false
      }

      // 3. Search Filter (order #, phone, customer name, locality)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchNum = order.orderNumber?.toLowerCase().includes(query)
        const matchPhone = order.guestPhone?.includes(query) || order.user?.phone?.includes(query)
        const matchName = order.guestName?.toLowerCase().includes(query) || order.user?.name?.toLowerCase().includes(query) || order.businessName?.toLowerCase().includes(query)
        const matchAddress = order.deliveryAddress?.toLowerCase().includes(query) || order.deliveryCity?.toLowerCase().includes(query)
        
        if (!matchNum && !matchPhone && !matchName && !matchAddress) return false
      }

      return true
    })
  }

  const filtered = getFilteredOrders()

  const clearDateRange = () => {
    setFromDate('')
    setToDate('')
  }

  // ─── OPERATIONAL KPI CALCULATIONS ──────────────────────────────────────────
  const totalOrdersCount = orders.length
  const needsActionCount = orders.filter((o: any) => ['CONFIRMED', 'PACKING'].includes(o.status)).length
  const unassignedCount = orders.filter((o: any) => o.status === 'PACKED' && !o.driverId).length
  const outForDeliveryCount = orders.filter((o: any) => o.status === 'OUT_FOR_DELIVERY').length
  const deliveredOrders = orders.filter((o: any) => o.status === 'DELIVERED')
  const deliveredCount = deliveredOrders.length
  const deliveredRevenue = deliveredOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)

  // COD to collect calculation: all CASH_ON_DELIVERY orders not delivered and not cancelled
  const codPendingOrders = orders.filter((o: any) => o.paymentMethod === 'CASH_ON_DELIVERY' && !['DELIVERED', 'CANCELLED'].includes(o.status))
  const codToCollectAmount = codPendingOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
  const codOrdersCount = codPendingOrders.length

  // Real-time dynamic counts for filter pills
  const statusCounts: Record<string, number> = {
    ALL: orders.length,
    PENDING: orders.filter((o: any) => o.status === 'PENDING').length,
    CONFIRMED: orders.filter((o: any) => o.status === 'CONFIRMED').length,
    PACKING: orders.filter((o: any) => o.status === 'PACKING').length,
    PACKED: orders.filter((o: any) => o.status === 'PACKED').length,
    ASSIGNED: orders.filter((o: any) => o.status === 'ASSIGNED').length,
    OUT_FOR_DELIVERY: orders.filter((o: any) => o.status === 'OUT_FOR_DELIVERY').length,
    DELIVERED: orders.filter((o: any) => o.status === 'DELIVERED').length,
    CANCELLED: orders.filter((o: any) => o.status === 'CANCELLED').length,
  }

  // Elapsed time in stage helper
  const getTimeInStage = (dateStr: string) => {
    if (!dateStr) return '1m in stage'
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const diffMins = Math.max(1, Math.floor(diffMs / 60000))
    if (diffMins < 60) return `${diffMins}m in stage`
    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours}h ${diffMins % 60}m in stage`
  }

  // Export to CSV function
  const exportToCSV = () => {
    if (filtered.length === 0) {
      showToast('No orders to export', 'warning')
      return
    }

    const headers = ['Order Number', 'Date', 'Time', 'Customer Name', 'Phone', 'Items', 'Total Amount (Rs)', 'Payment Method', 'Payment Status', 'Delivery Status', 'Driver']
    const rows = filtered.map((o: any) => {
      const customer = o.businessName ? `${o.businessName} (${o.guestName || o.user?.name || ''})` : (o.guestName || o.user?.name || 'Customer')
      const phone = o.guestPhone || o.user?.phone || ''
      const itemsStr = (o.items || []).map((i: any) => `${i.quantity}x ${i.productName} (${i.packagingType || 'Unit'})`).join('; ')
      const driver = o.driver ? `${o.driver.name} (${o.driver.vehicleNumber})` : 'Unassigned'
      const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN')
      const timeStr = new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

      return [
        `#${o.orderNumber}`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${customer.replace(/"/g, '""')}"`,
        `"${phone}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        o.totalAmount,
        o.paymentMethod,
        o.paymentStatus,
        o.status,
        `"${driver}"`
      ]
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `orders_dispatch_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Orders exported to CSV successfully', 'success')
  }

  // Next Step Action Button helper
  const renderNextStepButton = (order: any) => {
    switch (order.status) {
      case 'PENDING':
        return (
          <button
            onClick={() => updateStatus(order.id, 'CONFIRMED')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span>Approve</span>
          </button>
        )
      case 'CONFIRMED':
        return (
          <button
            onClick={() => updateStatus(order.id, 'PACKING')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Start packing
          </button>
        )
      case 'PACKING':
        return (
          <button
            onClick={() => updateStatus(order.id, 'PACKED')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Mark packed
          </button>
        )
      case 'PACKED':
        return (
          <div className="relative">
            <button
              onClick={() => setAssigningOrder(assigningOrder === order.id ? null : order.id)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Assign driver
            </button>
            {assigningOrder === order.id && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden py-1 z-50 animate-in fade-in">
                <div className="px-3 py-1.5 border-b border-slate-100 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                  Select Driver
                </div>
                {drivers.filter((d: any) => d.isActive).map((driver: any) => (
                  <button
                    key={driver.id}
                    onClick={() => assignDriver(order.id, driver.id)}
                    className="w-full px-3 py-2 text-left hover:bg-indigo-50 hover:text-indigo-700 font-semibold text-xs truncate border-b border-slate-50 last:border-b-0 flex items-center justify-between"
                  >
                    <span>{driver.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{driver.vehicleType}</span>
                  </button>
                ))}
                {drivers.filter((d: any) => d.isActive).length === 0 && (
                  <span className="block px-3 py-2 text-slate-400 text-xs italic">No active drivers</span>
                )}
              </div>
            )}
          </div>
        )
      case 'ASSIGNED':
        return (
          <button
            onClick={() => updateStatus(order.id, 'OUT_FOR_DELIVERY')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Dispatch
          </button>
        )
      case 'OUT_FOR_DELIVERY':
        return (
          <button
            onClick={() => updateStatus(order.id, 'DELIVERED')}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark delivered</span>
          </button>
        )
      case 'DELIVERED':
        return (
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl inline-flex items-center gap-1 whitespace-nowrap">
            <Check className="w-3 h-3" /> Delivered
          </span>
        )
      default:
        return (
          <span className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl whitespace-nowrap">
            Cancelled
          </span>
        )
    }
  }

  const currentDateDisplay = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Orders dispatch</h1>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {currentDateDisplay}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time live dispatch queue and order fulfillment operations.
          </p>
        </div>

        {/* Top Actions: Export & Force Reload */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
            title="Export filtered orders to Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-amber-600 shadow-2xs transition-colors"
            title="Force reload orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. OPERATIONAL KPI SUMMARY BAR (Adopted from screenshot) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Orders */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total orders</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{totalOrdersCount}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">today in queue</span>
          </div>
        </div>

        {/* Needs Action */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Needs action</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-600">{needsActionCount}</span>
            <span className="text-[11px] text-amber-700/80 font-medium block mt-0.5">before dispatch</span>
          </div>
        </div>

        {/* Unassigned Driver */}
        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/90 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Unassigned</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-900">{unassignedCount}</span>
            <span className="text-[11px] text-amber-800/80 font-medium block mt-0.5">assign a driver</span>
          </div>
        </div>

        {/* Out for Delivery */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Out for delivery</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-blue-600">{outForDeliveryCount}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">on the road</span>
          </div>
        </div>

        {/* Delivered Today */}
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/90 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Delivered</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-900">{deliveredCount}</span>
            <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">₹{deliveredRevenue.toLocaleString('en-IN')} earned</span>
          </div>
        </div>

        {/* COD to Collect */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">COD to collect</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">₹{codToCollectAmount.toLocaleString('en-IN')}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">across {codOrdersCount} orders</span>
          </div>
        </div>
      </div>

      {/* 3. CONTROLS: SEARCH, DATE RANGE & STATUS PILLS WITH LIVE COUNTS */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3.5">
        
        {/* Row 1: Search & Date Range */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search order number, customer, phone, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Range inputs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 font-bold">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 font-bold">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none text-xs"
              />
            </div>

            {(fromDate || toDate) && (
              <button
                onClick={clearDateRange}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition-colors"
                title="Reset date filter"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Status Pills with Real-Time Dynamic Counts (Adopted from screenshot) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3 scrollbar-none">
          {[
            { key: 'ALL', label: 'All', count: statusCounts.ALL },
            { key: 'PENDING', label: 'Pending', count: statusCounts.PENDING },
            { key: 'CONFIRMED', label: 'Confirmed', count: statusCounts.CONFIRMED },
            { key: 'PACKING', label: 'Packing', count: statusCounts.PACKING },
            { key: 'PACKED', label: 'Packed', count: statusCounts.PACKED },
            { key: 'ASSIGNED', label: 'Assigned', count: statusCounts.ASSIGNED },
            { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery', count: statusCounts.OUT_FOR_DELIVERY },
            { key: 'DELIVERED', label: 'Delivered', count: statusCounts.DELIVERED },
            { key: 'CANCELLED', label: 'Cancelled', count: statusCounts.CANCELLED },
          ].map((pill) => {
            const isActive = statusFilter === pill.key
            return (
              <button
                key={pill.key}
                onClick={() => setStatusFilter(pill.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <span>{pill.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {pill.count || 0}
                </span>
              </button>
            )
          })}
        </div>

      </div>

      {/* 4. ORDERS DISPATCH TABLE (With Vertical Scrolling) */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto max-h-[calc(100vh-340px)] overflow-y-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-xs">
              <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">Order</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Driver</th>
                <th className="px-5 py-3.5 text-center">Next step</th>
                <th className="px-5 py-3.5 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {ordersLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                      <span className="text-sm font-medium">Loading live dispatch orders...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-20 text-center text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span className="text-sm font-medium">No orders found matching the filter criteria.</span>
                  </td>
                </tr>
              ) : (
                filtered.map((order: any) => {
                  const isHighlighted = flashingOrders[order.id]
                  const customerName = order.businessName ? `${order.businessName} (${order.guestName || order.user?.name || ''})` : (order.guestName || order.user?.name || 'Customer')
                  const customerPhone = order.guestPhone || order.user?.phone
                  const initials = (order.businessName || order.guestName || order.user?.name || 'U').substring(0, 2).toUpperCase()
                  
                  // Stage time calculation
                  const timeInStage = getTimeInStage(order.updatedAt || order.createdAt)
                  const isUrgent = order.status !== 'DELIVERED' && order.status !== 'CANCELLED'

                  return (
                    <tr 
                      key={order.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isHighlighted ? 'bg-amber-500/10 border-l-4 border-l-amber-500' : ''
                      }`}
                    >
                      {/* Order & Stage Time */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-sm text-slate-900">#{order.orderNumber}</span>
                          <span className={`text-[10px] font-semibold mt-0.5 ${
                            isUrgent ? 'text-amber-700' : 'text-slate-400'
                          }`}>
                            {timeInStage}
                          </span>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 truncate max-w-[150px]" title={customerName}>
                              {customerName}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {order.deliveryCity || 'Latur'} · +91 {customerPhone || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Ordered Items Snapshot with Keep Frozen tag */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1 max-w-[220px]">
                          {order.items && order.items.length > 0 ? (
                            order.items.slice(0, 2).map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1.5 truncate">
                                <span className="font-semibold text-slate-800 truncate">
                                  {item.quantity}× {item.productName}
                                </span>
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded shrink-0">
                                  <Snowflake className="w-2.5 h-2.5" /> Frozen
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">No item snapshot</span>
                          )}
                          {order.items && order.items.length > 2 && (
                            <span className="text-[10px] font-bold text-slate-400">
                              +{order.items.length - 2} more items
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount & Payment Method */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-900">₹{order.totalAmount}</span>
                          <span className={`text-[10px] font-bold mt-0.5 ${
                            order.paymentMethod === 'CASH_ON_DELIVERY' 
                              ? 'text-amber-700 font-bold' 
                              : order.paymentStatus === 'PAID' 
                              ? 'text-emerald-700' 
                              : 'text-slate-500'
                          }`}>
                            {order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Collect cash (COD)' : order.paymentMethod === 'CREDIT_ACCOUNT' ? 'B2B Credit' : 'Paid online'}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          order.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          order.status === 'PACKING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          order.status === 'PACKED' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          order.status === 'OUT_FOR_DELIVERY' ? 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse' :
                          order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Assigned Driver */}
                      <td className="px-5 py-3.5">
                        {order.driver ? (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold truncate max-w-[120px]">{order.driver.name}</span>
                          </div>
                        ) : (
                          <span className="text-amber-700/80 font-medium italic">Unassigned</span>
                        )}
                      </td>

                      {/* Next Step Action Button + Quick Contact (Adopted from screenshot) */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {renderNextStepButton(order)}

                          {/* Quick Phone / WhatsApp Call */}
                          {customerPhone && (
                            <a
                              href={`https://wa.me/91${customerPhone.replace(/\D/g, '').slice(-10)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-colors"
                              title={`Direct WhatsApp / Call +91 ${customerPhone}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Invoice Link */}
                      <td className="px-5 py-3.5 text-right">
                        <a
                          href={`/admin/orders/${order.id}/invoice`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors inline-block"
                          title="Print Tax Invoice Bill"
                        >
                          <Printer className="w-4 h-4" />
                        </a>
                      </td>

                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
