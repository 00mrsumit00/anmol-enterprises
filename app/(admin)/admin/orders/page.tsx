'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Printer, User, Clock, Check, Truck, XCircle, Search, ClipboardList, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useSocket } from '@/hooks/useSocket'

export default function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // State Filters
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [slotFilter, setSlotFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
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

      // 3. Date Filter
      const orderDate = new Date(order.deliveryDate).toISOString().slice(0, 10)
      if (orderDate !== selectedDate) return false

      // 4. Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchNum = order.orderNumber.toLowerCase().includes(query)
        const matchPhone = order.guestPhone?.includes(query) || order.user?.phone?.includes(query)
        const matchName = order.guestName?.toLowerCase().includes(query) || order.user?.name?.toLowerCase().includes(query)
        
        if (!matchNum && !matchPhone && !matchName) return false
      }

      return true
    })
  }

  const filtered = getFilteredOrders()

  // Get status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 border-gray-300 text-gray-500'
      case 'CONFIRMED': return 'bg-blue-50 border-blue-200 text-blue-600'
      case 'PACKING': return 'bg-amber-50 border-amber-200 text-amber-600'
      case 'PACKED': return 'bg-purple-50 border-purple-200 text-purple-600'
      case 'ASSIGNED': return 'bg-indigo-50 border-indigo-200 text-indigo-600'
      case 'OUT_FOR_DELIVERY': return 'bg-orange-100 border-brand-orange text-brand-orange'
      case 'DELIVERED': return 'bg-emerald-50 border-emerald-200 text-[#00A67E]'
      default: return 'bg-red-50 border-red-200 text-red-600' // CANCELLED
    }
  }

  return (
    <div className="flex flex-col gap-5 no-print font-body select-none">
      
      {/* Filters Area Card */}
      <div className="bg-white p-5 rounded-card border border-gray-200 shadow-sm flex flex-col gap-4">
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-orange" />
            <h3 className="text-sm font-bold text-brand-charcoal">
              Order Filters
            </h3>
          </div>
          <button 
            onClick={() => refetch()} 
            className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-brand-orange transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Force Reload</span>
          </button>
        </div>

        {/* Input parameters grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Keyword Search */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search order #, customer phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-card pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-brand-orange"
            />
          </div>

          {/* Delivery Date */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-card px-4 py-2 text-xs focus:outline-none"
          />

          {/* Delivery Slot */}
          <select
            value={slotFilter}
            onChange={(e) => setSlotFilter(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-card px-4 py-2 text-xs focus:outline-none"
          >
            <option value="ALL">All Delivery Slots</option>
            <option value="MORNING">Morning Slots</option>
            <option value="EVENING">Evening Slots</option>
          </select>

          {/* Order Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-card px-4 py-2 text-xs focus:outline-none"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PACKING">Packing</option>
            <option value="PACKED">Packed & Cold Stored</option>
            <option value="ASSIGNED">Driver Assigned</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

        </div>
      </div>

      {/* Orders Table Board */}
      <div className="bg-white rounded-card border border-gray-200 shadow-md overflow-hidden">
        {ordersLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400 font-bold uppercase">Loading Dispatch list...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-xs text-gray-400 font-bold uppercase select-none">
            No orders match the filtered date & status.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 border-b border-gray-200 font-bold uppercase tracking-wider select-none">
                  <th className="p-4">Order Info</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Slot</th>
                  <th className="p-4">Items Summary</th>
                  <th className="p-4">Total Pay</th>
                  <th className="p-4">Delivery Status</th>
                  <th className="p-4">Delivery Agent</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((order: any) => {
                  const isHighlighted = flashingOrders[order.id]
                  const customerName = order.businessName ? `${order.businessName} (${order.guestName || order.user?.name})` : (order.guestName || order.user?.name)
                  const customerPhone = order.guestPhone || order.user?.phone

                  return (
                    <tr 
                      key={order.id} 
                      className={`transition-all duration-1000 ${
                        isHighlighted 
                          ? 'bg-brand-orange/15 shadow-inner' 
                          : 'hover:bg-gray-50/50'
                      }`}
                    >
                      {/* Order Info */}
                      <td className="p-4 font-semibold text-brand-charcoal">
                        <p className="font-bold text-[13px]">#{order.orderNumber}</p>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <p className="font-bold text-brand-charcoal leading-snug">{customerName}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">📞 +91 {customerPhone}</p>
                      </td>

                      {/* Slot */}
                      <td className="p-4 select-none">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.deliverySlot === 'MORNING' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {order.deliverySlot}
                        </span>
                      </td>

                      {/* Items summary */}
                      <td className="p-4 max-w-[200px] truncate">
                        {order.items.map((item: any, idx: number) => (
                          <p key={idx} className="truncate font-medium text-gray-600">
                            {item.quantity} × {item.productName} ({item.packagingType.substring(0, 3)})
                          </p>
                        ))}
                      </td>

                      {/* Total */}
                      <td className="p-4">
                        <p className="font-bold text-brand-charcoal text-[13px]">₹{order.totalAmount}</p>
                        <div className="mt-1 flex flex-col gap-0.5">
                          {order.paymentMethod === 'CASH_ON_DELIVERY' ? (
                            <span className="inline-block text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.5 rounded uppercase">
                              💵 COD (Pay on Delivery)
                            </span>
                          ) : order.paymentMethod === 'CREDIT_ACCOUNT' ? (
                            <span className="inline-block text-[9px] bg-purple-50 text-purple-700 border border-purple-200 font-bold px-1.5 py-0.5 rounded uppercase">
                              💼 B2B Credit
                            </span>
                          ) : order.paymentStatus === 'PAID' ? (
                            <span className="inline-block text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-1.5 py-0.5 rounded uppercase">
                              ✓ Paid Online (Razorpay)
                            </span>
                          ) : (
                            <span className="inline-block text-[9px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.5 rounded uppercase animate-pulse">
                              ⏳ Awaiting Payment
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 select-none">
                        <span className={`px-2 py-1 border rounded text-[9px] font-black tracking-wider uppercase ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Driver */}
                      <td className="p-4">
                        {order.driver ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-brand-charcoal">{order.driver.name}</span>
                            <span className="text-[9px] text-gray-400 font-semibold">{order.driver.vehicleNumber}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">None assigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* Invoice Printing */}
                          <a
                            href={`/admin/orders/${order.id}/invoice`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-gray-150 border rounded-md text-gray-500 hover:text-brand-orange hover:border-brand-orange/20 transition-all tap-scale flex items-center justify-center"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </a>

                          {/* 1. Confirm Approval */}
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => updateStatus(order.id, 'CONFIRMED')}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition-colors"
                            >
                              Approve
                            </button>
                          )}

                          {/* 2. Pack items */}
                          {order.status === 'CONFIRMED' && (
                            <button
                              onClick={() => updateStatus(order.id, 'PACKING')}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-md transition-colors"
                            >
                              Pack Items
                            </button>
                          )}

                          {/* 3. Mark packed */}
                          {order.status === 'PACKING' && (
                            <button
                              onClick={() => updateStatus(order.id, 'PACKED')}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-md transition-colors"
                            >
                              Cold Store
                            </button>
                          )}

                          {/* 4. Assign Driver */}
                          {order.status === 'PACKED' && (
                            <div className="relative">
                              <button
                                onClick={() => setAssigningOrder(assigningOrder === order.id ? null : order.id)}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-colors"
                              >
                                Assign...
                              </button>
                              
                              {/* Inline drivers absolute list */}
                              {assigningOrder === order.id && (
                                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-card shadow-2xl overflow-hidden py-1 z-[999]">
                                  <div className="px-3 py-1 border-b border-gray-100 font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                                    Select Driver
                                  </div>
                                  {drivers.filter((d: any) => d.isActive).map((driver: any) => (
                                    <button
                                      key={driver.id}
                                      onClick={() => assignDriver(order.id, driver.id)}
                                      className="w-full px-3 py-2 text-left hover:bg-indigo-50 hover:text-indigo-600 font-semibold truncate border-b border-gray-50 last:border-b-0"
                                    >
                                      {driver.name} ({driver.vehicleType})
                                    </button>
                                  ))}
                                  {drivers.filter((d: any) => d.isActive).length === 0 && (
                                    <span className="block px-3 py-2 text-gray-400 italic">No active drivers</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 5. Dispatch */}
                          {order.status === 'ASSIGNED' && (
                            <button
                              onClick={() => updateStatus(order.id, 'OUT_FOR_DELIVERY')}
                              className="px-2 py-1 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold rounded-md transition-colors"
                            >
                              Dispatch
                            </button>
                          )}

                          {/* 6. Mark Delivered */}
                          {order.status === 'OUT_FOR_DELIVERY' && (
                            <button
                              onClick={() => updateStatus(order.id, 'DELIVERED')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition-colors flex items-center gap-0.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Delivered</span>
                            </button>
                          )}

                          {/* Cancel option */}
                          {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to CANCEL order #${order.orderNumber}?`)) {
                                  updateStatus(order.id, 'CANCELLED')
                                }
                              }}
                              className="p-1 border hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 rounded-md transition-colors"
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
