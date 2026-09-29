'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Plus, Package, Edit3, Check, X } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useSocket } from '@/hooks/useSocket'

export default function AdminInventoryPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // Inline editing states
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [editStockValue, setEditStockValue] = useState('')
  const [isBulkLoading, setIsBulkLoading] = useState(false)

  // Fetch products with variants
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json()
    }
  })

  // Hook Socket.io for live stock changes
  const socket = useSocket()

  useEffect(() => {
    if (!socket) return

    socket.on('stock_update', ({ variantId, stockCount }) => {
      queryClient.setQueryData(['admin-products'], (oldProducts: any[] | undefined) => {
        if (!oldProducts) return []
        return oldProducts.map(product => {
          return {
            ...product,
            variants: product.variants.map((v: any) => 
              v.id === variantId ? { ...v, stockCount } : v
            )
          }
        })
      })
    })

    socket.on('bulk_stock_update', () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      showToast('Live stock reloaded from bulk updates', 'info')
    })

    return () => {
      socket.off('stock_update')
      socket.off('bulk_stock_update')
    }
  }, [socket, queryClient, showToast])

  // Single Quick Stock Edit Trigger
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

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update stock')
      }

      showToast('Stock count saved successfully', 'success')
      setEditingVariantId(null)
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    } catch (err: any) {
      showToast(err.message || 'Quick edit failed', 'error')
    }
  }

  // Bulk Stock replenishment Trigger
  const runBulkReplenish = async (packagingType: 'SINGLE' | 'BOX' | 'CARTON', amount: number) => {
    setIsBulkLoading(true)
    try {
      const res = await fetch('/api/inventory/bulk-add', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packagingType, addAmount: amount })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed bulk replenishment')
      }

      showToast(`Bulk added ${amount} stock to all ${packagingType} packs!`, 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    } catch (err: any) {
      showToast(err.message || 'Bulk replenish failed', 'error')
    } finally {
      setIsBulkLoading(false)
    }
  }

  // Get color scale code based on quantity
  const getStockBadgeClass = (qty: number) => {
    if (qty === 0) return 'bg-red-50 text-red-600 border-red-200'
    if (qty <= 5) return 'bg-amber-50 text-amber-600 border-amber-200'
    return 'bg-emerald-50 text-emerald-600 border-emerald-200'
  }

  // Flatten products and variants for table rows
  const tableRows: any[] = []
  products.forEach((product: any) => {
    product.variants.forEach((variant: any) => {
      tableRows.push({
        productName: product.name,
        brand: product.brand,
        categoryId: product.categoryId,
        variantId: variant.id,
        packagingType: variant.packagingType,
        unitsInPack: variant.unitsInPack,
        weightGrams: variant.weightGrams,
        skuCode: variant.skuCode,
        stockCount: variant.stockCount,
        retailPrice: variant.retailPrice,
        b2bPrice: variant.b2bPrice,
      })
    })
  })

  return (
    <div className="flex flex-col gap-5 no-print font-body select-none">
      
      {/* Bulk replenishment Area Card */}
      <div className="bg-white p-5 rounded-card border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-brand-orange" />
          <h3 className="text-sm font-bold text-brand-charcoal">
            Bulk Replenishment Shortcuts
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => runBulkReplenish('BOX', 50)}
            disabled={isBulkLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-charcoal text-white hover:bg-brand-charcoal-soft border border-white/5 rounded-pill text-xs font-bold transition-all tap-scale disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add 50 to All BOX Variants</span>
          </button>

          <button
            onClick={() => runBulkReplenish('CARTON', 10)}
            disabled={isBulkLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-charcoal text-white hover:bg-brand-charcoal-soft border border-white/5 rounded-pill text-xs font-bold transition-all tap-scale disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add 10 to All CARTON Variants</span>
          </button>

          <button
            onClick={() => runBulkReplenish('SINGLE', 100)}
            disabled={isBulkLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-charcoal text-white hover:bg-brand-charcoal-soft border border-white/5 rounded-pill text-xs font-bold transition-all tap-scale disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add 100 to All SINGLE Variants</span>
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-card border border-gray-200 shadow-md overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400 font-bold uppercase">Loading Inventory list...</span>
          </div>
        ) : tableRows.length === 0 ? (
          <div className="py-20 text-center text-xs text-gray-400 font-bold uppercase select-none">
            No variants registered. Seed database first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 border-b border-gray-200 font-bold uppercase tracking-wider select-none">
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Pack Size (Units)</th>
                  <th className="p-4">SKU Code</th>
                  <th className="p-4">Retail Price</th>
                  <th className="p-4">B2B Price</th>
                  <th className="p-4 text-center">Stock Level</th>
                  <th className="p-4 text-center">Quick Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableRows.map((row) => {
                  const isEditing = editingVariantId === row.variantId
                  const isLowStock = row.stockCount <= 5

                  return (
                    <tr key={row.variantId} className="hover:bg-gray-50/50">
                      {/* Name */}
                      <td className="p-4 font-bold text-brand-charcoal">
                        <div className="flex items-center gap-2">
                          <span className="p-1 bg-ice-blue rounded-md text-brand-orange">
                            {row.productName.includes('fries') || row.productName.includes('fries') ? '🍟' : 
                             row.productName.includes('cheese') || row.productName.includes('cheese') ? '🧀' : '🍗'}
                          </span>
                          <span>{row.productName}</span>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="p-4">
                        <span className="font-semibold text-gray-600 uppercase">
                          {row.packagingType} ({row.unitsInPack} units)
                        </span>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{row.weightGrams}g total</p>
                      </td>

                      {/* SKU */}
                      <td className="p-4 font-semibold text-gray-500">
                        {row.skuCode}
                      </td>

                      {/* Retail */}
                      <td className="p-4 font-bold text-brand-charcoal">
                        ₹{row.retailPrice}
                      </td>

                      {/* B2B */}
                      <td className="p-4 font-bold text-brand-charcoal">
                        ₹{row.b2bPrice}
                      </td>

                      {/* Stock Level Badge */}
                      <td className="p-4 text-center select-none">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editStockValue}
                            onChange={(e) => setEditStockValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveQuickEdit(row.variantId)
                              else if (e.key === 'Escape') setEditingVariantId(null)
                            }}
                            className="w-16 bg-white border border-brand-orange text-center py-1 rounded focus:outline-none text-xs font-bold"
                            autoFocus
                          />
                        ) : (
                          <span className={`px-3 py-1 border rounded-pill font-black text-[10px] tracking-wider uppercase inline-block ${getStockBadgeClass(row.stockCount)}`}>
                            {row.stockCount} AVAILABLE
                          </span>
                        )}
                      </td>

                      {/* Quick Edit button */}
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => saveQuickEdit(row.variantId)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors tap-scale"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingVariantId(null)}
                              className="p-1 bg-gray-400 hover:bg-gray-500 text-white rounded transition-colors tap-scale"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingVariantId(row.variantId)
                              setEditStockValue(String(row.stockCount))
                            }}
                            className="p-1.5 hover:bg-brand-orange-light border border-transparent hover:border-brand-orange/10 text-gray-400 hover:text-brand-orange rounded-md transition-all tap-scale flex items-center justify-center mx-auto"
                            title="Edit Stock"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
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
