'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  BarChart3, Plus, Package, Edit3, Check, X, Search, RefreshCw,
  AlertTriangle, ArrowDownRight, ArrowUpRight, Clock, Calendar,
  FileText, ShieldAlert, CheckCircle2, DollarSign, Layers,
  ChevronRight, Filter, AlertCircle, TrendingDown, Truck, Undo2
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useSocket } from '@/hooks/useSocket'

export default function AdminInventoryPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // Active Tab: Stock, Batches, Low stock alerts, Movement history
  const [activeTab, setActiveTab] = useState<'STOCK' | 'BATCHES' | 'LOW_STOCK' | 'MOVEMENTS'>('STOCK')

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Slide-out Drawers
  const [receiveDrawerOpen, setReceiveDrawerOpen] = useState(false)
  const [issueDrawerOpen, setIssueDrawerOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null)

  // Quick edit state
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [editStockValue, setEditStockValue] = useState('')

  // Receive Stock Form State
  const [receiveForm, setReceiveForm] = useState({
    variantId: '',
    supplier: 'McCain Foods India',
    invoiceNo: '',
    batchNumber: '',
    mfgDate: '',
    expiryDate: '',
    quantity: '',
    unitCost: '',
    notes: '',
  })
  const [isReceiving, setIsReceiving] = useState(false)

  // Issue Stock Form State
  const [issueForm, setIssueForm] = useState({
    variantId: '',
    quantity: '',
    reason: 'Damaged / Cold chain breakdown',
    notes: '',
  })
  const [isIssuing, setIsIssuing] = useState(false)

  // Fetch full inventory data
  const { data: inventoryData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-inventory-full'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/full')
      if (!res.ok) throw new Error('Failed to fetch inventory')
      return res.json()
    }
  })

  // Fetch batches
  const { data: batchesData } = useQuery({
    queryKey: ['admin-inventory-batches'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/batches')
      if (!res.ok) throw new Error('Failed to fetch batches')
      return res.json()
    },
    enabled: activeTab === 'BATCHES' || activeTab === 'STOCK'
  })

  // Fetch movements
  const { data: movementsData } = useQuery({
    queryKey: ['admin-inventory-movements'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/movements?limit=100')
      if (!res.ok) throw new Error('Failed to fetch movements')
      return res.json()
    },
    enabled: activeTab === 'MOVEMENTS'
  })

  // Hook Socket.io for live stock & movement updates
  const socket = useSocket()
  useEffect(() => {
    if (!socket) return

    socket.on('stock_update', () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-full'] })
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-batches'] })
    })

    socket.on('inventory_movement_new', () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-movements'] })
    })

    socket.on('bulk_stock_update', () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-full'] })
      showToast('Live stock updated from bulk operation', 'info')
    })

    return () => {
      socket.off('stock_update')
      socket.off('inventory_movement_new')
      socket.off('bulk_stock_update')
    }
  }, [socket, queryClient, showToast])

  const inventoryItems: any[] = inventoryData?.items || []
  const batches: any[] = batchesData?.batches || []
  const movements: any[] = movementsData?.movements || []

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>()
    inventoryItems.forEach(i => {
      if (i.categoryName) set.add(i.categoryName)
    })
    return Array.from(set)
  }, [inventoryItems])

  // Count low stock items
  const lowStockCount = useMemo(() => {
    return inventoryItems.filter(i => i.physical === 0 || i.available <= i.reorderLevel).length
  }, [inventoryItems])

  // Filtered inventory rows
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      // Tab filter
      if (activeTab === 'LOW_STOCK') {
        if (item.physical > 0 && item.available > item.reorderLevel) return false
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesProduct = item.productName.toLowerCase().includes(q)
        const matchesSku = item.skuCode.toLowerCase().includes(q)
        const matchesBatch = item.nextBatchNumber ? item.nextBatchNumber.toLowerCase().includes(q) : false
        if (!matchesProduct && !matchesSku && !matchesBatch) return false
      }

      // Category
      if (categoryFilter !== 'ALL' && item.categoryName !== categoryFilter) return false

      // Status
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'IN_STOCK' && item.status !== 'IN_STOCK') return false
        if (statusFilter === 'LOW_STOCK' && item.status !== 'LOW_STOCK') return false
        if (statusFilter === 'OUT_OF_STOCK' && item.status !== 'OUT_OF_STOCK') return false
      }

      return true
    })
  }, [inventoryItems, activeTab, searchQuery, categoryFilter, statusFilter])

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('')
    setCategoryFilter('ALL')
    setStatusFilter('ALL')
  }

  // Open Receive Drawer for a specific item
  const openReceiveDrawer = (item?: any) => {
    const target = item || inventoryItems[0]
    if (target) {
      setSelectedVariant(target)
      setReceiveForm({
        variantId: target.variantId,
        supplier: 'McCain Foods India',
        invoiceNo: '',
        batchNumber: `B${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${target.packagingType[0]}`,
        mfgDate: '',
        expiryDate: '',
        quantity: '',
        unitCost: target.unitCost ? String(target.unitCost) : '',
        notes: '',
      })
    }
    setReceiveDrawerOpen(true)
  }

  // Open Issue Drawer for a specific item
  const openIssueDrawer = (item?: any) => {
    const target = item || inventoryItems[0]
    if (target) {
      setSelectedVariant(target)
      setIssueForm({
        variantId: target.variantId,
        quantity: '',
        reason: 'Damaged / Cold chain breakdown',
        notes: '',
      })
    }
    setIssueDrawerOpen(true)
  }

  // Handle Receive Submit
  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!receiveForm.variantId) {
      showToast('Please select a product pack', 'error')
      return
    }
    const qty = parseInt(receiveForm.quantity)
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid positive quantity', 'error')
      return
    }
    if (!receiveForm.batchNumber.trim()) {
      showToast('Batch number is required for cold chain traceability', 'error')
      return
    }
    if (!receiveForm.expiryDate) {
      showToast('Expiry date is mandatory for frozen foods', 'error')
      return
    }

    setIsReceiving(true)
    try {
      const res = await fetch('/api/inventory/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: receiveForm.variantId,
          supplier: receiveForm.supplier,
          invoiceNo: receiveForm.invoiceNo || undefined,
          batchNumber: receiveForm.batchNumber.trim(),
          mfgDate: receiveForm.mfgDate || undefined,
          expiryDate: receiveForm.expiryDate,
          quantity: qty,
          unitCost: receiveForm.unitCost ? parseFloat(receiveForm.unitCost) : undefined,
          notes: receiveForm.notes || undefined,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to receive stock')

      showToast(data.message || 'Stock receipt saved successfully', 'success')
      setReceiveDrawerOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-full'] })
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-batches'] })
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-movements'] })
    } catch (err: any) {
      showToast(err.message || 'Failed to receive stock', 'error')
    } finally {
      setIsReceiving(false)
    }
  }

  // Handle Issue Submit
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issueForm.variantId) {
      showToast('Please select a product pack', 'error')
      return
    }
    const qty = parseInt(issueForm.quantity)
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid positive quantity', 'error')
      return
    }

    setIsIssuing(true)
    try {
      const res = await fetch('/api/inventory/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: issueForm.variantId,
          quantity: qty,
          reason: issueForm.reason,
          notes: issueForm.notes || undefined,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to issue stock')

      showToast(data.message || 'Stock removed successfully', 'success')
      setIssueDrawerOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-full'] })
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-batches'] })
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-movements'] })
    } catch (err: any) {
      showToast(err.message || 'Failed to issue stock', 'error')
    } finally {
      setIsIssuing(false)
    }
  }

  // Quick edit save
  const saveQuickEdit = async (variantId: string) => {
    const cleanVal = parseInt(editStockValue)
    if (isNaN(cleanVal) || cleanVal < 0) {
      showToast('Please enter a valid positive stock count', 'error')
      return
    }

    try {
      const res = await fetch('/api/inventory/quick-edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, stockCount: cleanVal })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update stock')

      showToast('Stock count updated', 'success')
      setEditingVariantId(null)
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-full'] })
    } catch (err: any) {
      showToast(err.message || 'Quick edit failed', 'error')
    }
  }

  // Days until expiry helper
  const getExpiryLabel = (dateStr: string | null) => {
    if (!dateStr) return { text: 'No batches', color: 'text-slate-400' }
    const exp = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    const formatted = exp.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    if (diffDays < 0) {
      return { text: `${formatted} (Expired)`, color: 'text-rose-600 font-bold' }
    } else if (diffDays <= 30) {
      return { text: `${formatted} (in ${diffDays} days)`, color: 'text-amber-600 font-bold' }
    }
    return { text: `${formatted} (in ${diffDays} days)`, color: 'text-slate-600' }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-4 md:p-7 font-sans">
      
      {/* ─── 1. TOP HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg">
              ❄️
            </span>
            Inventory Manager
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Cold Room Warehouse & Batch FEFO Expiry Tracking · Latur Hub
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">LIVE</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-medium">Cold Room: -18°C Optimal</span>
          </div>

          <button
            onClick={() => {
              refetch()
              showToast('Inventory refreshed', 'info')
            }}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition-all"
            title="Refresh inventory"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── 2. TABS NAVIGATION ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pt-5 pb-4 overflow-x-auto border-b border-slate-800/80">
        {[
          { id: 'STOCK', label: 'Stock', count: inventoryItems.length },
          { id: 'BATCHES', label: 'Batches & expiry', count: batches.length },
          { id: 'LOW_STOCK', label: 'Low stock alerts', count: lowStockCount, alert: lowStockCount > 0 },
          { id: 'MOVEMENTS', label: 'Movement history', count: movements.length },
        ].map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                active 
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs' 
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  tab.alert 
                    ? 'bg-rose-500 text-white' 
                    : active 
                      ? 'bg-amber-500/30 text-amber-300' 
                      : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ─── 3. TAB CONTENT ─────────────────────────────────────────────────────── */}

      {/* ── VIEW A: STOCK TAB & LOW STOCK TAB ── */}
      {(activeTab === 'STOCK' || activeTab === 'LOW_STOCK') && (
        <div className="mt-5 space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-[#111625] border border-slate-800/80 rounded-2xl p-3 md:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by product, SKU or batch number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0D121F] border border-slate-800 text-slate-100 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#0D121F] border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500/50"
              >
                <option value="ALL">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0D121F] border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500/50"
              >
                <option value="ALL">All statuses</option>
                <option value="IN_STOCK">In stock</option>
                <option value="LOW_STOCK">Low stock</option>
                <option value="OUT_OF_STOCK">Out of stock</option>
              </select>

              {(searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Reset filters
                </button>
              )}

              <button
                onClick={() => openReceiveDrawer()}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                Receive stock
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-[#111625] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
            {isLoading ? (
              <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Loading Cold Room Inventory...
                </span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
                <Package className="w-10 h-10 text-slate-600" />
                <span className="text-sm text-slate-400 font-bold">No items match your filter</span>
                <button
                  onClick={resetFilters}
                  className="mt-2 text-xs text-amber-400 hover:underline font-semibold"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0E1320] text-slate-400 font-bold uppercase tracking-wider text-[11px] select-none">
                      <th className="py-3.5 px-4">Product</th>
                      <th className="py-3.5 px-4">Pack Size</th>
                      <th className="py-3.5 px-3 text-center">Physical</th>
                      <th className="py-3.5 px-3 text-center">Reserved</th>
                      <th className="py-3.5 px-4 text-center">Available</th>
                      <th className="py-3.5 px-3 text-center">Reorder at</th>
                      <th className="py-3.5 px-4 text-right">Unit cost</th>
                      <th className="py-3.5 px-4 text-right">Stock value</th>
                      <th className="py-3.5 px-4">Next expiry</th>
                      <th className="py-3.5 px-3 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredItems.map((item) => {
                      const expiry = getExpiryLabel(item.nextExpiry)
                      const isEditing = editingVariantId === item.variantId
                      const capacityPct = item.physical > 0 ? Math.min(100, Math.round((item.available / item.physical) * 100)) : 0

                      return (
                        <tr 
                          key={item.variantId} 
                          className="hover:bg-slate-800/30 transition-colors group"
                        >
                          {/* Product */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="text-base shrink-0">{item.categoryEmoji}</span>
                              <div className="min-w-0">
                                <div className="font-bold text-white text-xs truncate max-w-[200px]" title={item.productName}>
                                  {item.productName}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {item.skuCode}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Pack size */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-300">
                              {item.packagingType === 'SINGLE' ? `Single ${item.weightGrams}g` :
                               item.packagingType === 'BOX' ? `Box of ${item.unitsInPack}` :
                               `Carton of ${item.unitsInPack}`}
                            </span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">
                              {item.weightGrams}g total
                            </span>
                          </td>

                          {/* Physical */}
                          <td className="py-3.5 px-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  value={editStockValue}
                                  onChange={(e) => setEditStockValue(e.target.value)}
                                  className="w-16 bg-slate-900 border border-amber-500 rounded px-1.5 py-0.5 text-center text-xs font-bold text-white focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  onClick={() => saveQuickEdit(item.variantId)}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                                  title="Save"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingVariantId(null)}
                                  className="p-1 bg-slate-700 hover:bg-slate-600 text-white rounded"
                                  title="Cancel"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span 
                                onClick={() => {
                                  setEditingVariantId(item.variantId)
                                  setEditStockValue(String(item.physical))
                                }}
                                className="font-bold text-slate-200 cursor-pointer hover:text-amber-400 transition-colors"
                                title="Click to quick-edit physical stock"
                              >
                                {item.physical}
                              </span>
                            )}
                          </td>

                          {/* Reserved */}
                          <td className="py-3.5 px-3 text-center">
                            <span className={`font-semibold ${item.reserved > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                              {item.reserved}
                            </span>
                          </td>

                          {/* Available + Bar */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-black text-white text-sm">
                                {item.available}
                              </span>
                              <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    item.available === 0 ? 'bg-rose-500' :
                                    item.available <= item.reorderLevel ? 'bg-amber-400' : 'bg-emerald-400'
                                  }`} 
                                  style={{ width: `${capacityPct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Reorder threshold */}
                          <td className="py-3.5 px-3 text-center text-slate-400 font-medium">
                            {item.reorderLevel}
                          </td>

                          {/* Unit cost */}
                          <td className="py-3.5 px-4 text-right font-medium text-slate-300">
                            {item.unitCost > 0 ? `₹${item.unitCost.toLocaleString('en-IN')}` : `₹${item.b2bPrice.toLocaleString('en-IN')}`}
                          </td>

                          {/* Stock value */}
                          <td className="py-3.5 px-4 text-right font-bold text-slate-200">
                            ₹{Math.round(item.stockValue).toLocaleString('en-IN')}
                          </td>

                          {/* Next expiry */}
                          <td className="py-3.5 px-4">
                            <span className={`text-[11px] block leading-tight ${expiry.color}`}>
                              {expiry.text}
                            </span>
                            {item.nextBatchNumber && (
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                Batch {item.nextBatchNumber}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3 text-center select-none">
                            {item.status === 'OUT_OF_STOCK' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                ● Out of stock
                              </span>
                            ) : item.status === 'LOW_STOCK' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                ● Low stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                ● In stock
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openReceiveDrawer(item)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-slate-700/60"
                                title="Receive new shipment from McCain"
                              >
                                Receive
                              </button>
                              <button
                                onClick={() => openIssueDrawer(item)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 rounded-lg text-[11px] font-bold transition-all border border-slate-700/60 hover:border-rose-800/40"
                                title="Issue stock (damages, defrosting, sampling)"
                              >
                                Issue
                              </button>
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
      )}

      {/* ── VIEW B: BATCHES & EXPIRY TAB ── */}
      {activeTab === 'BATCHES' && (
        <div className="mt-5 space-y-4">
          <div className="bg-[#111625] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  First-Expire, First-Out (FEFO) Batch Register
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Batches are automatically consumed earliest-expiry first during order dispatch.
                </p>
              </div>
              <button
                onClick={() => openReceiveDrawer()}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                Add Batch Receipt
              </button>
            </div>

            {batches.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No active batches registered yet. Click &quot;Add Batch Receipt&quot; to log incoming McCain stock.
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0E1320] text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Batch No</th>
                      <th className="py-3 px-4">Product & Pack</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Invoice No</th>
                      <th className="py-3 px-3 text-center">Remaining Qty</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4 text-right">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {batches.map((b) => {
                      const expiry = getExpiryLabel(b.expiryDate)
                      return (
                        <tr key={b.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-mono font-bold text-amber-400">
                            {b.batchNumber}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            {b.variant?.product?.name} ({b.variant?.packagingType})
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {b.supplier}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {b.invoiceNo || '—'}
                          </td>
                          <td className="py-3 px-3 text-center font-black text-slate-200">
                            {b.quantity} <span className="text-[10px] text-slate-500 font-normal">/ {b.initialQty}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[11px] block font-semibold ${expiry.color}`}>
                              {expiry.text}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-300">
                            ₹{b.unitCost}
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
      )}

      {/* ── VIEW C: MOVEMENT HISTORY TAB (Audit Trail) ── */}
      {activeTab === 'MOVEMENTS' && (
        <div className="mt-5 space-y-4">
          <div className="bg-[#111625] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden p-5">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Immutable Stock Movement Audit Log
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every shipment arrival, customer delivery, damage write-off, and return is permanently recorded.
              </p>
            </div>

            {movements.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No movements logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0E1320] text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-3 text-center">Type</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-3 text-center">Quantity</th>
                      <th className="py-3 px-3 text-center">Balance After</th>
                      <th className="py-3 px-4">Reason / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {movements.map((m) => {
                      const isPositive = m.type === 'RECEIVE' || m.type === 'RETURN'
                      return (
                        <tr key={m.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                            {new Date(m.createdAt).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-3 text-center select-none">
                            {m.type === 'RECEIVE' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <ArrowDownRight className="w-3 h-3" /> RECEIVE
                              </span>
                            )}
                            {m.type === 'DISPATCH' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                <Truck className="w-3 h-3" /> DISPATCH
                              </span>
                            )}
                            {m.type === 'RETURN' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                <Undo2 className="w-3 h-3" /> RETURN
                              </span>
                            )}
                            {m.type === 'ISSUE' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                <ArrowUpRight className="w-3 h-3" /> ISSUE
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            {m.variant?.product?.name} ({m.variant?.packagingType})
                          </td>
                          <td className={`py-3 px-3 text-center font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-300">
                            {m.balanceAfter}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            <span className="text-slate-300 font-medium block">{m.reason || '—'}</span>
                            {m.notes && <span className="text-[11px] text-slate-500 block">{m.notes}</span>}
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
      )}

      {/* ─── 4. SLIDE-OUT DRAWER: RECEIVE STOCK ─────────────────────────────────── */}
      {receiveDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="w-full max-w-md bg-[#111625] border-l border-slate-800 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-white">Receive stock</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Cold Room Stock In & Batch Expiry Receipt</p>
                </div>
                <button
                  onClick={() => setReceiveDrawerOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleReceiveSubmit} className="mt-5 space-y-4 text-xs">
                
                {/* Product Dropdown */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Product and pack size</label>
                  <select
                    value={receiveForm.variantId}
                    onChange={(e) => {
                      const vId = e.target.value
                      const item = inventoryItems.find(i => i.variantId === vId)
                      setSelectedVariant(item || null)
                      setReceiveForm(prev => ({ 
                        ...prev, 
                        variantId: vId,
                        unitCost: item?.unitCost ? String(item.unitCost) : prev.unitCost 
                      }))
                    }}
                    className="w-full bg-[#0D121F] border border-slate-800 text-white rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-amber-500/60"
                  >
                    {inventoryItems.map((item) => (
                      <option key={item.variantId} value={item.variantId}>
                        {item.productName} — {item.packagingType} ({item.weightGrams}g)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier & Invoice */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Supplier</label>
                    <select
                      value={receiveForm.supplier}
                      onChange={(e) => setReceiveForm(prev => ({ ...prev, supplier: e.target.value }))}
                      className="w-full bg-[#0D121F] border border-slate-800 text-white rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                    >
                      <option value="McCain Foods India">McCain Foods India</option>
                      <option value="Authorized Distributor">Authorized Distributor</option>
                      <option value="Direct Cold Storage Transfer">Direct Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Invoice number</label>
                    <input
                      type="text"
                      placeholder="e.g. INV-2026-0417"
                      value={receiveForm.invoiceNo}
                      onChange={(e) => setReceiveForm(prev => ({ ...prev, invoiceNo: e.target.value }))}
                      className="w-full bg-[#0D121F] border border-slate-800 text-white rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                    />
                  </div>
                </div>

                {/* Batch Number & Storage */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Batch number *</label>
                    <input
                      type="text"
                      placeholder="e.g. B2610-D"
                      value={receiveForm.batchNumber}
                      onChange={(e) => setReceiveForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                      className="w-full bg-[#0D121F] border border-slate-800 text-white rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Storage location</label>
                    <input
                      type="text"
                      disabled
                      value="Cold Room (-18°C)"
                      className="w-full bg-[#0A0D17] border border-slate-800 text-slate-400 rounded-xl px-3 py-2.5 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Mfg & Expiry Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Manufacturing date</label>
                    <input
                      type="date"
                      value={receiveForm.mfgDate}
                      onChange={(e) => setReceiveForm(prev => ({ ...prev, mfgDate: e.target.value }))}
                      className="w-full bg-[#0D121F] border border-slate-800 text-white rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Expiry date *</label>
                    <input
                      type="date"
                      value={receiveForm.expiryDate}
                      onChange={(e) => setReceiveForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className="w-full bg-[#0D121F] border border-slate-800 text-white rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Quantity & Unit Cost */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Quantity received *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={receiveForm.quantity}
                      onChange={(e) => setReceiveForm(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full bg-[#0D121F] border border-slate-800 text-white rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Unit purchase cost (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={receiveForm.unitCost}
                      onChange={(e) => setReceiveForm(prev => ({ ...prev, unitCost: e.target.value }))}
                      className="w-full bg-[#0D121F] border border-slate-800 text-white rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Optional delivery or inspection notes..."
                    value={receiveForm.notes}
                    onChange={(e) => setReceiveForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-[#0D121F] border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                  />
                </div>

                {/* Receipt value summary chip */}
                {receiveForm.quantity && receiveForm.unitCost && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 font-semibold flex items-center justify-between">
                    <span>Total Receipt Valuation:</span>
                    <span className="font-bold text-white text-sm">
                      ₹{(parseInt(receiveForm.quantity || '0') * parseFloat(receiveForm.unitCost || '0')).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {/* Drawer Footer Actions */}
                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setReceiveDrawerOpen(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReceiving}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl font-black transition-all text-xs shadow-md"
                  >
                    {isReceiving ? 'Saving...' : 'Save receipt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. SLIDE-OUT DRAWER: ISSUE STOCK ───────────────────────────────────── */}
      {issueDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="w-full max-w-md bg-[#111625] border-l border-slate-800 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-white">Issue stock</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Manual Deductions & Damage Write-off</p>
                </div>
                <button
                  onClick={() => setIssueDrawerOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleIssueSubmit} className="mt-5 space-y-4 text-xs">
                
                {/* Product Dropdown */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Product and pack size</label>
                  <select
                    value={issueForm.variantId}
                    onChange={(e) => {
                      const vId = e.target.value
                      const item = inventoryItems.find(i => i.variantId === vId)
                      setSelectedVariant(item || null)
                      setIssueForm(prev => ({ ...prev, variantId: vId }))
                    }}
                    className="w-full bg-[#0D121F] border border-slate-800 text-white rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-amber-500/60"
                  >
                    {inventoryItems.map((item) => (
                      <option key={item.variantId} value={item.variantId}>
                        {item.productName} — {item.packagingType} ({item.weightGrams}g)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live Stock Chip */}
                {selectedVariant && (
                  <div className="p-3 bg-[#0D121F] border border-slate-800 rounded-xl flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">Physical: <strong className="text-white">{selectedVariant.physical}</strong></span>
                    <span className="text-slate-400">Reserved: <strong className="text-amber-400">{selectedVariant.reserved}</strong></span>
                    <span className="text-slate-400">Available: <strong className="text-emerald-400">{selectedVariant.available}</strong></span>
                  </div>
                )}

                {/* Quantity & Reason */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={issueForm.quantity}
                      onChange={(e) => setIssueForm(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full bg-[#0D121F] border border-slate-800 text-white rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Reason *</label>
                    <select
                      value={issueForm.reason}
                      onChange={(e) => setIssueForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full bg-[#0D121F] border border-slate-800 text-white rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                    >
                      <option value="Damaged / Cold chain breakdown">Damaged / Defrosted</option>
                      <option value="Expired batch write-off">Expired batch write-off</option>
                      <option value="Sampling / Tasting demo">Sampling / Demo</option>
                      <option value="Direct manual B2B wholesale sale">Direct manual sale</option>
                      <option value="Audit discrepancy">Audit discrepancy</option>
                      <option value="Return to McCain Foods">Return to Supplier</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Notes</label>
                  <textarea
                    rows={3}
                    placeholder="What happened? Enter details..."
                    value={issueForm.notes}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-[#0D121F] border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                  />
                </div>

                {/* Automatic Notice Banner (Matching Screenshot 2) */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300/90 text-[11px] leading-relaxed">
                  <span className="font-bold text-amber-400">Order dispatches are recorded automatically</span> when an order is marked delivered or out for delivery, so customer purchases are not entered here. Batches are deducted earliest-expiry first.
                </div>

                {/* Drawer Footer Actions */}
                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIssueDrawerOpen(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isIssuing}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-black transition-all text-xs shadow-md"
                  >
                    {isIssuing ? 'Processing...' : 'Remove stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
