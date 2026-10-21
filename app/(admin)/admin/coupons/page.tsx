'use client'

import React, { useState } from 'react'
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Percent,
  DollarSign,
  Calendar,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/Toast'

interface CouponItem {
  id: string
  code: string
  description: string | null
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount: number | null
  paymentConstraint: 'ALL' | 'COD_ONLY' | 'ONLINE_ONLY'
  usageLimit: number | null
  timesUsed: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  _count?: { orders: number }
}

export default function AdminCouponsPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED')
  const [discountValue, setDiscountValue] = useState<number>(50)
  const [minOrderAmount, setMinOrderAmount] = useState<number>(499)
  const [paymentConstraint, setPaymentConstraint] = useState<'COD_ONLY' | 'ALL' | 'ONLINE_ONLY'>('COD_ONLY')

  // Fetch coupons
  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const res = await fetch('/api/admin/coupons')
      if (!res.ok) throw new Error('Failed to load coupons')
      return res.json() as Promise<{ coupons: CouponItem[] }>
    },
  })

  const coupons = data?.coupons || []

  // Create coupon mutation
  const createCouponMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          description: description.trim() || undefined,
          discountType,
          discountValue: Number(discountValue),
          minOrderAmount: Number(minOrderAmount) || 0,
          paymentConstraint,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create coupon')
      }
      return res.json()
    },
    onSuccess: (resData) => {
      showToast(`Coupon "${resData.coupon.code}" created successfully!`, 'success')
      setIsModalOpen(false)
      setCode('')
      setDescription('')
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Error creating coupon', 'error')
    },
  })

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/coupons/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      showToast('Coupon status updated', 'info')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || discountValue <= 0) {
      return showToast('Please enter valid code and discount value', 'error')
    }
    createCouponMutation.mutate()
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-orange-500" />
            Coupons & COD Discounts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create promotional codes and exclusive Cash on Delivery discounts with celebration animations for customers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition self-start"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {/* Coupons Table / Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No coupons active</h3>
            <p className="text-xs text-slate-400 mt-1">Create your first COD discount coupon using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Discount</th>
                  <th className="px-5 py-3.5">Min Order</th>
                  <th className="px-5 py-3.5">Payment Method</th>
                  <th className="px-5 py-3.5">Times Used</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                    <td className="px-5 py-4 font-mono font-black text-orange-600 dark:text-orange-400">
                      {c.code}
                      {c.description && (
                        <p className="text-xs font-sans text-slate-400 font-normal">{c.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {c.discountType === 'FIXED' ? `₹${c.discountValue}` : `${c.discountValue}% OFF`}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-medium">
                      ₹{c.minOrderAmount}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        c.paymentConstraint === 'COD_ONLY'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {c.paymentConstraint.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {c.timesUsed} claims
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => toggleMutation.mutate(c.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
                      >
                        {c.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Create Promotional Coupon
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Coupon Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. COD50 or COLD10"
                  className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 font-mono uppercase font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="FIXED">Flat Cash (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    min={1}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                  min={0}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Valid On Payment Method
                </label>
                <select
                  value={paymentConstraint}
                  onChange={(e: any) => setPaymentConstraint(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option value="COD_ONLY">💵 Cash on Delivery Only (Recommended)</option>
                  <option value="ALL">All Payment Methods</option>
                  <option value="ONLINE_ONLY">Online Payments Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCouponMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm"
                >
                  {createCouponMutation.isPending ? 'Saving...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
