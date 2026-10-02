'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Printer, Check, XCircle, Search, RefreshCw, Calendar, 
  DollarSign, Package, X, Clock, Download, Phone, Truck,
  AlertCircle, ChevronRight, Snowflake, AlertTriangle, MessageCircle,
  Eye, FileText, CheckCircle2, Sparkles, MapPin, User, ExternalLink
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useSocket } from '@/hooks/useSocket'

export default function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // State Filters
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().slice(0, 10)
  })
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10))
  
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null)
  
  // Interactive Modal States
  const [selectedSummaryOrder, setSelectedSummaryOrder] = useState<any | null>(null)
  const [whatsAppModalOrder, setWhatsAppModalOrder] = useState<any | null>(null)
  const [whatsAppMessage, setWhatsAppMessage] = useState<string>('')
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('DISPATCH')

  // Flash tracking for real-time new orders
  const [flashingOrders, setFlashingOrders] = useState<Record<string, boolean>>({})

  // Fetch initial orders
  const { data: orders = [], isLoading: ordersLoading, refetch, isFetching } = useQuery({
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

      // If open in summary modal, update it live too
      setSelectedSummaryOrder((current: any) => {
        if (current && current.id === updatedOrder.id) return { ...current, ...updatedOrder }
        return current
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

      // Update selected summary modal order if open
      if (selectedSummaryOrder && selectedSummaryOrder.id === orderId) {
        setSelectedSummaryOrder((prev: any) => ({ ...prev, status }))
      }
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

      const assignedD = drivers.find((d: any) => d.id === driverId)
      if (selectedSummaryOrder && selectedSummaryOrder.id === orderId && assignedD) {
        setSelectedSummaryOrder((prev: any) => ({ ...prev, driver: assignedD, driverId }))
      }
    } catch (err: any) {
      showToast(err.message || 'Assignment failed', 'error')
    }
  }

  // Filter calculations (No slot filter!)
  const getFilteredOrders = () => {
    return orders.filter((order: any) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) return false

      // 2. Date Range Filter
      const orderDate = (order.createdAt || order.deliveryDate)
        ? new Date(order.createdAt || order.deliveryDate).toISOString().slice(0, 10)
        : ''
      if (fromDate && orderDate < fromDate) return false
      if (toDate && orderDate > toDate) return false

      // 3. Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchNum = order.orderNumber?.toLowerCase().includes(query)
        const matchPhone = order.guestPhone?.includes(query) || order.user?.phone?.includes(query)
        const matchName = order.guestName?.toLowerCase().includes(query) || order.user?.name?.toLowerCase().includes(query) || order.businessName?.toLowerCase().includes(query)
        const matchAddr = order.deliveryAddress?.toLowerCase().includes(query)
        
        if (!matchNum && !matchPhone && !matchName && !matchAddr) return false
      }

      return true
    })
  }

  const filtered = getFilteredOrders()

  // Real-time KPI calculations
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayOrders = orders.filter((o: any) => {
    const d = o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : ''
    return d === todayStr
  })
  const totalTodayCount = todayOrders.length || orders.length

  // Needs action: CONFIRMED or PACKING
  const needsActionCount = orders.filter((o: any) => ['PENDING', 'CONFIRMED', 'PACKING'].includes(o.status)).length

  // Unassigned: PACKED or CONFIRMED without assigned driver
  const unassignedCount = orders.filter((o: any) => (o.status === 'PACKED' || o.status === 'CONFIRMED') && !o.driverId).length

  // Out for delivery
  const outForDeliveryCount = orders.filter((o: any) => o.status === 'OUT_FOR_DELIVERY').length

  // Delivered
  const deliveredOrders = orders.filter((o: any) => o.status === 'DELIVERED')
  const deliveredCount = deliveredOrders.length
  const deliveredEarned = deliveredOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)

  // COD to collect: CASH_ON_DELIVERY orders not cancelled and not paid yet
  const codOrders = orders.filter((o: any) => 
    o.paymentMethod === 'CASH_ON_DELIVERY' && 
    o.status !== 'CANCELLED' && 
    o.paymentStatus !== 'PAID'
  )
  const codAmount = codOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
  const codOrdersCount = codOrders.length

  // Dynamic filter pill counts
  const statusCounts = {
    ALL: orders.length,
    PENDING: orders.filter((o: any) => o.status === 'PENDING').length,
    CONFIRMED: orders.filter((o: any) => o.status === 'CONFIRMED').length,
    PACKING: orders.filter((o: any) => o.status === 'PACKING').length,
    PACKED: orders.filter((o: any) => o.status === 'PACKED').length,
    ASSIGNED: orders.filter((o: any) => o.status === 'ASSIGNED').length,
    OUT_FOR_DELIVERY: orders.filter((o: any) => o.status === 'OUT_FOR_DELIVERY').length,
    DELIVERED: orders.filter((o: any) => o.status === 'DELIVERED').length,
  }

  // Export to CSV Function
  const exportToCSV = () => {
    if (!filtered || filtered.length === 0) {
      showToast('No orders found to export', 'warning')
      return
    }

    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Items', 'Total Amount', 'Payment Method', 'Payment Status', 'Status', 'Driver', 'Delivery Address']
    const rows = filtered.map((o: any) => [
      `"${o.orderNumber || ''}"`,
      `"${new Date(o.createdAt).toLocaleString('en-IN')}"`,
      `"${(o.businessName ? `${o.businessName} (${o.guestName || o.user?.name || ''})` : (o.guestName || o.user?.name || 'Customer')).replace(/"/g, '""')}"`,
      `"${o.guestPhone || o.user?.phone || ''}"`,
      `"${o.items?.map((it: any) => `${it.quantity}x ${it.productName} (${it.packagingType})`).join(', ').replace(/"/g, '""') || ''}"`,
      o.totalAmount || 0,
      `"${o.paymentMethod || ''}"`,
      `"${o.paymentStatus || ''}"`,
      `"${o.status || ''}"`,
      `"${o.driver?.name || 'Unassigned'}"`,
      `"${(o.deliveryAddress || '').replace(/"/g, '""')}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Anmol_Enterprises_Orders_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Orders exported to CSV successfully!', 'success')
  }

  // Elapsed time helper (e.g. "24m in stage")
  const getTimeInStage = (dateStr: string) => {
    if (!dateStr) return '0m'
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `${diffMins}m in stage`
    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours}h ${diffMins % 60}m in stage`
  }

  // Predefined WhatsApp Templates generator for an order
  const getWhatsAppTemplates = (order: any) => {
    if (!order) return []
    const customerName = order.businessName ? `${order.businessName} (${order.guestName || order.user?.name || 'Customer'})` : (order.guestName || order.user?.name || 'Customer')
    const driverName = order.driver?.name || 'our dispatch team'
    const driverPhone = order.driver?.phone ? `+91 ${order.driver.phone}` : 'the store'
    const itemCount = order.items?.length || 1
    const totalAmt = order.totalAmount || 0
    const isCOD = order.paymentMethod === 'CASH_ON_DELIVERY'

    return [
      {
        key: 'DISPATCH',
        title: '🚚 Out for Delivery Notice',
        badge: 'Recommended for In-Transit',
        text: `Hello ${customerName}! 👋 Your Anmol Enterprises order #${order.orderNumber} (${itemCount} frozen items) is out for delivery with our rider ${driverName} (${driverPhone}). Total amount to collect: ₹${totalAmt} (${isCOD ? '💵 Please keep cash ready' : '✓ Paid Online'}). Our rider will reach your location shortly!`
      },
      {
        key: 'PACKING',
        title: '❄️ Order Confirmed & Packing',
        badge: 'For Confirmed Orders',
        text: `Hello ${customerName}! ✅ Your order #${order.orderNumber} has been confirmed and is being packed in our -18°C insulated cold bags at Anmol Enterprises Latur. We will dispatch it shortly!`
      },
      {
        key: 'LOCATION',
        title: '📍 Need Exact Address / Landmark',
        badge: 'For Address Help',
        text: `Hello ${customerName}, our delivery partner is in your area for order #${order.orderNumber} but needs help locating: "${order.deliveryAddress}". Could you please reply with your exact live location or nearby landmark on WhatsApp? Thank you!`
      },
      {
        key: 'DELIVERED',
        title: '🎉 Delivery Completed & Freezer Tip',
        badge: 'Post-Delivery Followup',
        text: `Hello ${customerName}! 🎉 Your order #${order.orderNumber} has been successfully delivered. Please transfer your McCain frozen snacks into your freezer immediately at -18°C to maintain maximum crispiness and freshness. Thank you for ordering from Anmol Enterprises!`
      }
    ]
  }

  // Open WhatsApp Modal and prefill appropriate template
  const handleOpenWhatsApp = (order: any) => {
    setWhatsAppModalOrder(order)
    const templates = getWhatsAppTemplates(order)
    let defaultKey = 'DISPATCH'
    if (order.status === 'CONFIRMED' || order.status === 'PACKING') defaultKey = 'PACKING'
    else if (order.status === 'DELIVERED') defaultKey = 'DELIVERED'
    
    setSelectedTemplateKey(defaultKey)
    const chosen = templates.find(t => t.key === defaultKey) || templates[0]
    setWhatsAppMessage(chosen.text)
  }

  // Handle template selection change
  const handleSelectTemplate = (template: any) => {
    setSelectedTemplateKey(template.key)
    setWhatsAppMessage(template.text)
  }

  // Send WhatsApp message
  const handleSendWhatsApp = () => {
    if (!whatsAppModalOrder) return
    const phone = (whatsAppModalOrder.guestPhone || whatsAppModalOrder.user?.phone || '').replace(/\D/g, '').slice(-10)
    if (!phone) {
      showToast('Customer phone number not available', 'error')
      return
    }

    const encoded = encodeURIComponent(whatsAppMessage)
    window.open(`https://wa.me/91${phone}?text=${encoded}`, '_blank')
    showToast('Opening WhatsApp chat...', 'success')
    setWhatsAppModalOrder(null)
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* 1. Header with Title, Date, and Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders dispatch</h1>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Real-time express dispatch management and cold-chain order logistics.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {/* 📥 Top Bar Export Button */}
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
            title="Export to Excel / CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export (CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. Operational KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total orders */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total orders</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 leading-none">{totalTodayCount}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">today</span>
          </div>
        </div>

        {/* Needs action */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Needs action</span>
          <div className="mt-2">
            <span className={`text-2xl font-black leading-none ${needsActionCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {needsActionCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">before dispatch</span>
          </div>
        </div>

        {/* Unassigned */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unassigned</span>
          <div className="mt-2">
            <span className={`text-2xl font-black leading-none ${unassignedCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {unassignedCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">assign a driver</span>
          </div>
        </div>

        {/* Out for delivery */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Out for delivery</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-orange-600 leading-none">{outForDeliveryCount}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">on the road</span>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Delivered</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-700 leading-none">{deliveredCount}</span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">₹{deliveredEarned} earned</span>
          </div>
        </div>

        {/* 💵 COD to collect */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs bg-gradient-to-br from-white to-amber-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">COD to collect</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 leading-none">₹{codAmount.toLocaleString('en-IN')}</span>
            <span className="text-[11px] text-amber-800 font-medium block mt-1">across {codOrdersCount} orders</span>
          </div>
        </div>
      </div>

      {/* 3. Search Bar & Date Range Controls */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search order number, customer, phone or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-400">Date Range:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 font-medium focus:outline-none"
            />
            <span className="text-slate-400 font-bold">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 font-medium focus:outline-none"
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(''); setToDate('') }}
                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-[11px]"
                title="Clear date filter"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* 📊 Real-time Quick Filter Pills with Dynamic Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'All', count: statusCounts.ALL },
            { id: 'CONFIRMED', label: 'Confirmed', count: statusCounts.CONFIRMED },
            { id: 'PACKING', label: 'Packing', count: statusCounts.PACKING },
            { id: 'PACKED', label: 'Packed', count: statusCounts.PACKED },
            { id: 'ASSIGNED', label: 'Assigned', count: statusCounts.ASSIGNED },
            { id: 'OUT_FOR_DELIVERY', label: 'Out for delivery', count: statusCounts.OUT_FOR_DELIVERY },
            { id: 'DELIVERED', label: 'Delivered', count: statusCounts.DELIVERED },
            { id: 'PENDING', label: 'Pending', count: statusCounts.PENDING },
          ].map((pill) => {
            const active = statusFilter === pill.id
            return (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  active 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{pill.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  active ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-600'
                }`}>
                  {pill.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Orders Data Table with Vertical Scrolling & Sticky Header */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-340px)] min-h-[380px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-xs">
              <tr className="bg-slate-50">
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Order</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Items Summary</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Driver</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ordersLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Loading orders dispatch list...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No orders found matching your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((order: any) => {
                  const isHighlighted = flashingOrders[order.id]
                  const customerName = order.businessName 
                    ? `${order.businessName} (${order.guestName || order.user?.name || 'Customer'})` 
                    : (order.guestName || order.user?.name || 'Customer')
                  const customerPhone = order.guestPhone || order.user?.phone || ''
                  const initials = customerName.slice(0, 2).toUpperCase()
                  const isCOD = order.paymentMethod === 'CASH_ON_DELIVERY'
                  const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10)

                  return (
                    <tr 
                      key={order.id}
                      className={`hover:bg-slate-50/70 transition-all ${
                        isHighlighted ? 'bg-amber-50/60 border-l-4 border-l-amber-500' : ''
                      }`}
                    >
                      {/* Order info + Time in Stage */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-sm text-slate-900 font-mono">#{order.orderNumber}</span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full w-fit mt-1 border border-amber-200/60">
                            {getTimeInStage(order.updatedAt || order.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Customer info + Locality Area */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-900 leading-none block">{customerName}</span>
                            <span className="text-[11px] text-slate-500 font-medium block mt-1 truncate max-w-[180px]">
                              {order.deliveryCity || 'Latur'} {customerPhone ? `· +91 ${customerPhone}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Items Column — With interactive "View Summary" button + mini thumbnail image stack */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <button
                            onClick={() => setSelectedSummaryOrder(order)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-amber-50 text-slate-800 hover:text-amber-900 border border-slate-200/80 hover:border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs group cursor-pointer text-left"
                            title="Click to view full Order Summary with product photos and prices"
                          >
                            {/* Product photo avatar bubbles stack */}
                            <div className="flex -space-x-2 shrink-0">
                              {order.items?.slice(0, 3).map((it: any, idx: number) => {
                                const photo = it.product?.imageUrl || '/images/products/french-fries.jpg'
                                return (
                                  <img
                                    key={idx}
                                    src={photo}
                                    alt=""
                                    className="w-5 h-5 rounded-full object-cover border-2 border-white shadow-2xs bg-white"
                                    onError={(e: any) => { e.target.src = '/images/products/french-fries.jpg' }}
                                  />
                                )
                              })}
                            </div>
                            <span>{order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}</span>
                            <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wide group-hover:underline flex items-center gap-0.5">
                              Summary <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                            </span>
                          </button>

                          {/* Quick first item preview line */}
                          {order.items?.[0] && (
                            <span className="text-[11px] text-slate-500 truncate max-w-[190px] font-medium">
                              {order.items[0].quantity}× {order.items[0].productName}
                              {order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
                            <Snowflake className="w-3 h-3 text-sky-500" /> Keep frozen
                          </span>
                        </div>
                      </td>

                      {/* Amount + COD vs Paid Online */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-sm text-slate-900">₹{order.totalAmount}</span>
                          <span className={`text-[10px] font-bold mt-0.5 ${
                            isCOD ? 'text-amber-700' : 'text-emerald-700'
                          }`}>
                            {isCOD ? 'Collect cash' : 'Paid online'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          order.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          order.status === 'PACKING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          order.status === 'PACKED' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          order.status === 'ASSIGNED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          order.status === 'OUT_FOR_DELIVERY' ? 'bg-orange-100 text-orange-800 border border-orange-200 animate-pulse' :
                          order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Driver */}
                      <td className="px-5 py-4">
                        {order.driver ? (
                          <div className="flex flex-col text-xs">
                            <span className="font-bold text-slate-900">{order.driver.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{order.driver.vehicleNumber}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Actions Column: Invoice Bill + WhatsApp Chat with Templates + Call + Single Workflow Button */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          
                          {/* Invoice Bill print */}
                          <a
                            href={`/admin/orders/${order.id}/invoice`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-700 rounded-xl transition-all shadow-2xs"
                            title="Print Invoice Bill"
                          >
                            <Printer className="w-4 h-4" />
                          </a>

                          {/* 💬 WhatsApp Chat Option with Predefined Templates (in front of Call icon) */}
                          {cleanPhone && (
                            <button
                              onClick={() => handleOpenWhatsApp(order)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl transition-all shadow-2xs active:scale-95 flex items-center justify-center cursor-pointer"
                              title={`Chat on WhatsApp with templates (+91 ${cleanPhone})`}
                            >
                              <MessageCircle className="w-4 h-4 fill-emerald-600/20" />
                            </button>
                          )}

                          {/* 📞 Phone Call */}
                          {cleanPhone && (
                            <a
                              href={`tel:+91${cleanPhone}`}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all shadow-2xs"
                              title={`Call Customer +91 ${cleanPhone}`}
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}

                          {/* Single Primary Workflow Button */}
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => updateStatus(order.id, 'CONFIRMED')}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95"
                            >
                              Approve
                            </button>
                          )}

                          {order.status === 'CONFIRMED' && (
                            <button
                              onClick={() => updateStatus(order.id, 'PACKING')}
                              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all active:scale-95"
                            >
                              Start packing
                            </button>
                          )}

                          {order.status === 'PACKING' && (
                            <button
                              onClick={() => updateStatus(order.id, 'PACKED')}
                              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all active:scale-95"
                            >
                              Mark packed
                            </button>
                          )}

                          {order.status === 'PACKED' && (
                            <div className="relative">
                              <button
                                onClick={() => setAssigningOrder(assigningOrder === order.id ? null : order.id)}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all active:scale-95"
                              >
                                Assign driver
                              </button>

                              {/* Dropdown for drivers */}
                              {assigningOrder === order.id && (
                                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl py-1.5 z-50 text-left">
                                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                    Select Driver
                                  </div>
                                  {drivers.filter((d: any) => d.isActive).map((driver: any) => (
                                    <button
                                      key={driver.id}
                                      onClick={() => assignDriver(order.id, driver.id)}
                                      className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 text-left truncate flex items-center justify-between"
                                    >
                                      <span>{driver.name}</span>
                                      <span className="text-[10px] text-slate-400 font-mono">{driver.vehicleNumber}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {order.status === 'ASSIGNED' && (
                            <button
                              onClick={() => updateStatus(order.id, 'OUT_FOR_DELIVERY')}
                              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all active:scale-95"
                            >
                              Dispatch
                            </button>
                          )}

                          {order.status === 'OUT_FOR_DELIVERY' && (
                            <button
                              onClick={() => updateStatus(order.id, 'DELIVERED')}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark delivered</span>
                            </button>
                          )}

                          {order.status === 'DELIVERED' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200/60">
                              <Check className="w-3.5 h-3.5" /> Delivered
                            </span>
                          )}

                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. RICH ORDER SUMMARY MODAL (Product Photos, Prices, Cold Specs & Print Bill) */}
      {selectedSummaryOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-hidden border border-slate-200">
            
            {/* Modal Top Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  📦
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-slate-900">
                      Order #{selectedSummaryOrder.orderNumber}
                    </h3>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      selectedSummaryOrder.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      selectedSummaryOrder.status === 'PACKING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      selectedSummaryOrder.status === 'PACKED' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      selectedSummaryOrder.status === 'OUT_FOR_DELIVERY' ? 'bg-orange-100 text-orange-800 border border-orange-200 animate-pulse' :
                      selectedSummaryOrder.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedSummaryOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Placed on {new Date(selectedSummaryOrder.createdAt).toLocaleDateString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                    })} at {new Date(selectedSummaryOrder.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedSummaryOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm transition-all"
              >
                ✕
              </button>
            </div>

            {/* Customer & Delivery Context Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
              {/* Customer */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer Details</span>
                <span className="font-extrabold text-sm text-slate-900">
                  {selectedSummaryOrder.businessName ? `${selectedSummaryOrder.businessName} (${selectedSummaryOrder.guestName || selectedSummaryOrder.user?.name || 'Customer'})` : (selectedSummaryOrder.guestName || selectedSummaryOrder.user?.name || 'Customer')}
                </span>
                <span className="text-slate-600 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  +91 {selectedSummaryOrder.guestPhone || selectedSummaryOrder.user?.phone || 'N/A'}
                </span>
                <span className="text-slate-500 font-medium flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{selectedSummaryOrder.deliveryAddress}</span>
                </span>
              </div>

              {/* Delivery Partner */}
              <div className="flex flex-col gap-1 md:border-l md:border-slate-200 md:pl-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dispatch & Driver</span>
                {selectedSummaryOrder.driver ? (
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      {selectedSummaryOrder.driver.name}
                    </span>
                    <span className="text-slate-500 text-[11px] font-mono">Vehicle: {selectedSummaryOrder.driver.vehicleNumber}</span>
                    <span className="text-slate-500 text-[11px]">Phone: +91 {selectedSummaryOrder.driver.phone}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 rounded-xl font-bold mt-1 w-fit">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>No delivery driver assigned yet</span>
                  </div>
                )}
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md w-fit mt-1 border border-sky-200/60">
                  <Snowflake className="w-3 h-3 text-sky-500" /> Cold-Chain Express (-18°C)
                </span>
              </div>
            </div>

            {/* Product Items Breakdown with Photos and Prices */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[38vh] pr-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Order Items ({selectedSummaryOrder.items?.length || 0})
              </span>

              <div className="flex flex-col gap-2.5">
                {selectedSummaryOrder.items?.map((item: any, idx: number) => {
                  const productPhoto = item.product?.imageUrl || '/images/products/french-fries.jpg'
                  const itemWeight = item.variant?.weightGrams ? `${item.variant.weightGrams}g` : `${item.weightGrams || ''}g`
                  const itemLineTotal = item.lineTotal || (item.unitPrice * item.quantity)

                  return (
                    <div 
                      key={idx}
                      className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs flex items-center justify-between gap-3 hover:border-amber-300 transition-colors"
                    >
                      {/* Product Image & Details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center p-1">
                          <img
                            src={productPhoto}
                            alt={item.productName}
                            className="w-full h-full object-contain"
                            onError={(e: any) => { e.target.src = '/images/products/french-fries.jpg' }}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-900 truncate">{item.productName}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              🟢 100% Veg
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                              {item.packagingType}
                            </span>
                            {itemWeight && <span>Weight: {itemWeight}</span>}
                            <span>•</span>
                            <span className="text-slate-700 font-semibold">₹{item.unitPrice} each</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity & Line Total */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-bold text-slate-500">Qty: {item.quantity}</span>
                        <span className="text-base font-black text-slate-900 mt-0.5">₹{itemLineTotal}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Financial Summary & Actions Bottom Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Payment Status & Total */}
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Amount</span>
                  <span className="text-2xl font-black text-slate-900 leading-none mt-0.5 block">
                    ₹{selectedSummaryOrder.totalAmount}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 mt-0.5">
                    {selectedSummaryOrder.paymentMethod === 'CASH_ON_DELIVERY' ? '💵 Cash on Delivery' : selectedSummaryOrder.paymentMethod === 'CREDIT_ACCOUNT' ? '💼 B2B Credit' : '💳 Paid Online via Razorpay'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Print Bill Button */}
                <a
                  href={`/admin/orders/${selectedSummaryOrder.id}/invoice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95"
                  title="Print Official Tax Invoice"
                >
                  <Printer className="w-4 h-4 text-amber-600" />
                  <span>Print Tax Invoice</span>
                </a>

                {/* WhatsApp button inside summary */}
                <button
                  onClick={() => {
                    const orderToChat = selectedSummaryOrder
                    setSelectedSummaryOrder(null)
                    handleOpenWhatsApp(orderToChat)
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  <span>Chat on WhatsApp</span>
                </button>

                {/* Close */}
                <button
                  onClick={() => setSelectedSummaryOrder(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 6. WHATSAPP QUICK TEMPLATES MODAL */}
      {whatsAppModalOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <MessageCircle className="w-6 h-6 fill-white/20" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    WhatsApp Chat with Customer
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Order #{whatsAppModalOrder.orderNumber} • {whatsAppModalOrder.guestName || whatsAppModalOrder.user?.name || 'Customer'} (+91 {whatsAppModalOrder.guestPhone || whatsAppModalOrder.user?.phone})
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setWhatsAppModalOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm transition-all"
              >
                ✕
              </button>
            </div>

            {/* Predefined Templates Choice */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Predefined Message Template
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {getWhatsAppTemplates(whatsAppModalOrder).map((tpl) => {
                  const isSelected = selectedTemplateKey === tpl.key

                  return (
                    <button
                      key={tpl.key}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs' 
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{tpl.title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{tpl.badge}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Live Editable Text Area */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Message Preview (Editable):</span>
                <span className="text-[10px] text-slate-400">{whatsAppMessage.length} characters</span>
              </div>
              <textarea
                rows={5}
                value={whatsAppMessage}
                onChange={(e) => setWhatsAppMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none leading-relaxed"
                placeholder="Type your WhatsApp message..."
              />
            </div>

            {/* Bottom Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setWhatsAppModalOrder(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white/20" />
                <span>Send on WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
