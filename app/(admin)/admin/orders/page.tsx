'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Printer, Check, XCircle, Search, RefreshCw, Filter, 
  Sun, Moon, Calendar, DollarSign, Package, X
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useSocket } from '@/hooks/useSocket'

export default function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // State Filters
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [slotFilter, setSlotFilter] = useState('ALL')
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
        // Avoid duplicate additions
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

  // Filter calculations
  const getFilteredOrders = () => {
    return orders.filter((order: any) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) return false

      // 2. Slot Filter
      if (slotFilter !== 'ALL' && order.deliverySlot !== slotFilter) return false

      // 3. Date Range Filter
      if (order.deliveryDate) {
        const orderDate = new Date(order.deliveryDate).toISOString().slice(0, 10)
        if (fromDate && orderDate < fromDate) return false
        if (toDate && orderDate > toDate) return false
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchNum = order.orderNumber?.toLowerCase().includes(query)
        const matchPhone = order.guestPhone?.includes(query) || order.user?.phone?.includes(query)
        const matchName = order.guestName?.toLowerCase().includes(query) || order.user?.name?.toLowerCase().includes(query)
        
        if (!matchNum && !matchPhone && !matchName) return false
      }

      return true
    })
  }

  const filtered = getFilteredOrders()

  const clearDateRange = () => {
    setFromDate('')
    setToDate('')
  }

  // Get status color helper for pill badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': 
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">PENDING</span>
      case 'CONFIRMED': 
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">CONFIRMED</span>
      case 'PACKING': 
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">PACKING</span>
      case 'PACKED': 
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">PACKED</span>
      case 'ASSIGNED': 
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">ASSIGNED</span>
      case 'OUT_FOR_DELIVERY': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            OUT FOR DELIVERY
          </span>
        )
      case 'DELIVERED': 
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            <Check className="w-3 h-3" />
            DELIVERED
          </span>
        )
      case 'CANCELLED': 
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-600 line-through">CANCELLED</span>
      default: 
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{status}</span>
    }
  }

  const activeFilterCount = (statusFilter !== 'ALL' ? 1 : 0) + (slotFilter !== 'ALL' ? 1 : 0) + (searchQuery ? 1 : 0) + (fromDate || toDate ? 1 : 0)

  // Summary Metrics
  const totalOrders = filtered.length
  const totalRevenue = filtered.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)
  const deliveredCount = filtered.filter((o: any) => o.status === 'DELIVERED').length
  const cancelledCount = filtered.filter((o: any) => o.status === 'CANCELLED').length
  const pendingCount = filtered.filter((o: any) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length

  return (
    <div className="flex flex-col gap-6 font-sans bg-slate-50 min-h-screen pb-10">
      
      {/* Filter Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">
              Orders Filter
            </h3>
            {activeFilterCount > 0 && (
              <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
                {activeFilterCount} active
              </span>
            )}
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Row 1: Search & Dates */}
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order #, customer phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-400 text-sm">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              {(fromDate || toDate) && (
                <button
                  onClick={clearDateRange}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"
                  title="Clear Range"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Status Pills, Slots & Reload */}
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto scrollbar-hide">
              {['ALL', 'PENDING', 'CONFIRMED', 'PACKING', 'PACKED', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === status
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <select
                value={slotFilter}
                onChange={(e) => setSlotFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Slots</option>
                <option value="MORNING">Morning Slots</option>
                <option value="EVENING">Evening Slots</option>
              </select>

              <button 
                onClick={() => refetch()} 
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                title="Force Reload"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      {(fromDate || toDate) && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className="bg-white border border-slate-100 shadow-sm rounded-lg px-4 py-3 flex items-center gap-3 min-w-max">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Orders</p>
              <p className="text-lg font-bold text-slate-800">{totalOrders}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 shadow-sm rounded-lg px-4 py-3 flex items-center gap-3 min-w-max">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</p>
              <p className="text-lg font-bold text-slate-800">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 shadow-sm rounded-lg px-4 py-3 flex items-center gap-3 min-w-max">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Delivered</p>
              <p className="text-lg font-bold text-slate-800">{deliveredCount}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 shadow-sm rounded-lg px-4 py-3 flex items-center gap-3 min-w-max">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending / Active</p>
              <p className="text-lg font-bold text-slate-800">{pendingCount}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 shadow-sm rounded-lg px-4 py-3 flex items-center gap-3 min-w-max">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cancelled</p>
              <p className="text-lg font-bold text-slate-800">{cancelledCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        {ordersLoading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-sm text-slate-500 font-medium">Loading orders data...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-sm text-slate-500 font-medium">
            No orders match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Order Info</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Slot</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Driver</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order: any) => {
                  const isHighlighted = flashingOrders[order.id]
                  const customerName = order.businessName ? `${order.businessName} (${order.guestName || order.user?.name})` : (order.guestName || order.user?.name)
                  const customerPhone = order.guestPhone || order.user?.phone
                  
                  // Initials logic
                  const initials = (order.businessName || order.guestName || order.user?.name || 'U')
                    .substring(0, 2)
                    .toUpperCase()

                  return (
                    <tr 
                      key={order.id} 
                      className={`transition-all duration-700 ${
                        isHighlighted 
                          ? 'bg-amber-500/10 border-l-4 border-l-amber-400' 
                          : 'bg-white hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Order Info */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-slate-800 text-sm">#{order.orderNumber}</span>
                          <span className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800 max-w-[150px] truncate" title={customerName}>{customerName}</span>
                            <span className="text-[11px] text-slate-500 mt-0.5">+91 {customerPhone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Slot */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          {order.deliverySlot === 'MORNING' ? (
                            <><Sun className="w-4 h-4 text-amber-500" /><span className="text-amber-700">Morning</span></>
                          ) : (
                            <><Moon className="w-4 h-4 text-indigo-500" /><span className="text-indigo-700">Evening</span></>
                          )}
                        </div>
                      </td>

                      {/* Items summary */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">
                            {order.items.length} items
                          </span>
                          <span className="text-xs text-slate-500 max-w-[120px] truncate">
                            {order.items.map((i:any) => i.productName).join(', ')}
                          </span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">₹{order.totalAmount}</span>
                          {order.paymentMethod === 'CASH_ON_DELIVERY' ? (
                            <span className="text-[10px] text-slate-500 font-medium mt-0.5">COD</span>
                          ) : order.paymentMethod === 'CREDIT_ACCOUNT' ? (
                            <span className="text-[10px] text-slate-500 font-medium mt-0.5">B2B Credit</span>
                          ) : order.paymentStatus === 'PAID' ? (
                            <span className="text-[10px] text-emerald-600 font-medium mt-0.5">Paid Online</span>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-medium mt-0.5 animate-pulse">Awaiting Pay</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Driver */}
                      <td className="px-6 py-4">
                        {order.driver ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden shrink-0">
                              <img src={`https://ui-avatars.com/api/?name=${order.driver.name}&background=random`} alt="Driver" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-800">{order.driver.name}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          
                          <a
                            href={`/admin/orders/${order.id}/invoice`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </a>

                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => updateStatus(order.id, 'CONFIRMED')}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
                            >
                              Approve
                            </button>
                          )}

                          {order.status === 'CONFIRMED' && (
                            <button
                              onClick={() => updateStatus(order.id, 'PACKING')}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
                            >
                              Pack
                            </button>
                          )}

                          {order.status === 'PACKING' && (
                            <button
                              onClick={() => updateStatus(order.id, 'PACKED')}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
                            >
                              Cold Store
                            </button>
                          )}

                          {order.status === 'PACKED' && (
                            <div className="relative">
                              <button
                                onClick={() => setAssigningOrder(assigningOrder === order.id ? null : order.id)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
                              >
                                Assign...
                              </button>
                              
                              {assigningOrder === order.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden py-1.5 z-50">
                                  <div className="px-3 py-1.5 border-b border-slate-100 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                                    Select Driver
                                  </div>
                                  {drivers.filter((d: any) => d.isActive).map((driver: any) => (
                                    <button
                                      key={driver.id}
                                      onClick={() => assignDriver(order.id, driver.id)}
                                      className="w-full px-3 py-2 text-left hover:bg-indigo-50 hover:text-indigo-600 text-sm font-medium truncate"
                                    >
                                      {driver.name}
                                    </button>
                                  ))}
                                  {drivers.filter((d: any) => d.isActive).length === 0 && (
                                    <span className="block px-3 py-2 text-slate-400 text-xs italic">No active drivers</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {order.status === 'ASSIGNED' && (
                            <button
                              onClick={() => updateStatus(order.id, 'OUT_FOR_DELIVERY')}
                              className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
                            >
                              Dispatch
                            </button>
                          )}

                          {order.status === 'OUT_FOR_DELIVERY' && (
                            <button
                              onClick={() => updateStatus(order.id, 'DELIVERED')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full transition-colors shadow-sm flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Delivered
                            </button>
                          )}

                          {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                            <button
                              onClick={() => {
                                if (confirm(`Cancel order #${order.orderNumber}?`)) {
                                  updateStatus(order.id, 'CANCELLED')
                                }
                              }}
                              className="p-1.5 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors ml-1"
                              title="Cancel Order"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
