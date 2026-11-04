'use client'

import React, { useState } from 'react'
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Percent,
  Calendar,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  ShoppingBag,
  Flame,
  Calculator,
  ArrowRight,
  Clock,
  Layers,
  HelpCircle,
  X,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/Toast'

interface CampaignItem {
  id: string
  name: string
  bannerText: string
  badgeText: string | null
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  scope: 'ALL' | 'CATEGORY' | 'PRODUCT'
  categoryIds: string[]
  productIds: string[]
  excludedProductIds: string[]
  audience: 'ALL' | 'B2C_ONLY' | 'B2B_ONLY'
  minOrderAmount: number
  maxDiscountPerItem: number | null
  maxTotalDiscount: number | null
  allowCouponStacking: boolean
  isActive: boolean
  startDate: string
  endDate: string
  createdAt: string
  _count?: { orders: number }
}

interface CouponItem {
  id: string
  code: string
  description: string | null
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount: number | null
  paymentConstraint: 'ALL' | 'COD_ONLY' | 'ONLINE_ONLY'
  audience: 'ALL' | 'B2C_ONLY' | 'B2B_ONLY'
  isFirstOrderOnly: boolean
  perCustomerLimit: number | null
  usageLimit: number | null
  timesUsed: number
  allowStacking: boolean
  isActive: boolean
  startsAt: string | null
  expiresAt: string | null
  createdAt: string
  _count?: { orders: number }
}

export default function AdminPromotionsPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  // Active Tab: 'CAMPAIGNS' | 'COUPONS' | 'SIMULATOR'
  const [activeTab, setActiveTab] = useState<'CAMPAIGNS' | 'COUPONS' | 'SIMULATOR'>('CAMPAIGNS')

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. CAMPAIGNS STATE & MUTATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [campName, setCampName] = useState('Diwali Dhamaka 2026')
  const [campBannerText, setCampBannerText] = useState('Diwali Dhamaka: Flat 10% OFF on all McCain frozen snacks! 🪔✨')
  const [campBadgeText, setCampBadgeText] = useState('10% OFF • DIWALI')
  const [campDiscountType, setCampDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE')
  const [campDiscountValue, setCampDiscountValue] = useState<number>(10)
  const [campScope, setCampScope] = useState<'ALL' | 'CATEGORY' | 'PRODUCT'>('ALL')
  const [campAudience, setCampAudience] = useState<'ALL' | 'B2C_ONLY' | 'B2B_ONLY'>('ALL')
  const [campMinOrder, setCampMinOrder] = useState<number>(0)
  const [campMaxDiscountPerItem, setCampMaxDiscountPerItem] = useState<string>('')
  const [campAllowStacking, setCampAllowStacking] = useState<boolean>(true) // Admin toggle: default true!
  const [campStartDate, setCampStartDate] = useState(new Date().toISOString().slice(0, 16))
  const [campEndDate, setCampEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  )

  const { data: campaignData, isLoading: isCampaignsLoading } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/admin/campaigns')
      if (!res.ok) throw new Error('Failed to load campaigns')
      return res.json() as Promise<{ campaigns: CampaignItem[] }>
    },
  })
  const campaigns = campaignData?.campaigns || []

  // Create or Update Campaign Mutation
  const saveCampaignMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: campName.trim(),
        bannerText: campBannerText.trim(),
        badgeText: campBadgeText.trim() || undefined,
        discountType: campDiscountType,
        discountValue: Number(campDiscountValue),
        scope: campScope,
        audience: campAudience,
        minOrderAmount: Number(campMinOrder) || 0,
        maxDiscountPerItem: campMaxDiscountPerItem ? Number(campMaxDiscountPerItem) : null,
        allowCouponStacking: campAllowStacking,
        startDate: new Date(campStartDate).toISOString(),
        endDate: new Date(campEndDate).toISOString(),
      }

      const url = editingCampaignId ? `/api/admin/campaigns/${editingCampaignId}` : '/api/admin/campaigns'
      const method = editingCampaignId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save campaign')
      }
      return res.json()
    },
    onSuccess: () => {
      showToast(editingCampaignId ? 'Campaign updated successfully!' : 'Festive campaign created successfully!', 'success')
      setIsCampaignModalOpen(false)
      setEditingCampaignId(null)
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Error saving campaign', 'error')
    },
  })

  // Toggle Campaign Kill-Switch Mutation
  const toggleCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/campaigns/${id}/toggle`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to toggle campaign')
      return res.json()
    },
    onSuccess: (data) => {
      const active = data?.campaign?.isActive
      showToast(`Campaign ${active ? 'ACTIVATED (Live on Storefront)' : 'DEACTIVATED (Prices reverted)'}!`, active ? 'success' : 'info')
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to toggle campaign', 'error')
    },
  })

  // Delete Campaign Mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm('Are you sure you want to permanently delete this campaign?')) return null
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete campaign')
      return res.json()
    },
    onSuccess: (data) => {
      if (!data) return
      showToast('Campaign deleted successfully', 'info')
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] })
    },
  })

  const handleOpenEditCampaign = (c: CampaignItem) => {
    setEditingCampaignId(c.id)
    setCampName(c.name)
    setCampBannerText(c.bannerText)
    setCampBadgeText(c.badgeText || '')
    setCampDiscountType(c.discountType)
    setCampDiscountValue(c.discountValue)
    setCampScope(c.scope)
    setCampAudience(c.audience)
    setCampMinOrder(c.minOrderAmount)
    setCampMaxDiscountPerItem(c.maxDiscountPerItem ? String(c.maxDiscountPerItem) : '')
    setCampAllowStacking(c.allowCouponStacking)
    setCampStartDate(new Date(c.startDate).toISOString().slice(0, 16))
    setCampEndDate(new Date(c.endDate).toISOString().slice(0, 16))
    setIsCampaignModalOpen(true)
  }

  const handleOpenNewCampaign = () => {
    setEditingCampaignId(null)
    setCampName('Diwali Dhamaka 2026')
    setCampBannerText('Diwali Dhamaka: Flat 10% OFF on all McCain frozen snacks! 🪔✨')
    setCampBadgeText('10% OFF • DIWALI')
    setCampDiscountType('PERCENTAGE')
    setCampDiscountValue(10)
    setCampScope('ALL')
    setCampAudience('ALL')
    setCampMinOrder(0)
    setCampMaxDiscountPerItem('')
    setCampAllowStacking(true)
    setCampStartDate(new Date().toISOString().slice(0, 16))
    setCampEndDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16))
    setIsCampaignModalOpen(true)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. COUPONS STATE & MUTATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null)
  const [coupCode, setCoupCode] = useState('')
  const [coupDescription, setCoupDescription] = useState('')
  const [coupDiscountType, setCoupDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED')
  const [coupDiscountValue, setCoupDiscountValue] = useState<number>(50)
  const [coupMinOrder, setCoupMinOrder] = useState<number>(499)
  const [coupMaxDiscount, setCoupMaxDiscount] = useState<string>('')
  const [coupPaymentConstraint, setCoupPaymentConstraint] = useState<'ALL' | 'COD_ONLY' | 'ONLINE_ONLY'>('ALL')
  const [coupAudience, setCoupAudience] = useState<'ALL' | 'B2C_ONLY' | 'B2B_ONLY'>('ALL')
  const [coupIsFirstOrder, setCoupIsFirstOrder] = useState<boolean>(false)
  const [coupPerUserLimit, setCoupPerUserLimit] = useState<number>(1)
  const [coupUsageLimit, setCoupUsageLimit] = useState<string>('')
  const [coupExpiresAt, setCoupExpiresAt] = useState<string>('')

  const { data: couponData, isLoading: isCouponsLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const res = await fetch('/api/admin/coupons')
      if (!res.ok) throw new Error('Failed to load coupons')
      return res.json() as Promise<{ coupons: CouponItem[] }>
    },
  })
  const coupons = couponData?.coupons || []

  // Create or Update Coupon Mutation
  const saveCouponMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: coupCode.trim().toUpperCase(),
        description: coupDescription.trim() || undefined,
        discountType: coupDiscountType,
        discountValue: Number(coupDiscountValue),
        minOrderAmount: Number(coupMinOrder) || 0,
        maxDiscountAmount: coupMaxDiscount ? Number(coupMaxDiscount) : null,
        paymentConstraint: coupPaymentConstraint,
        audience: coupAudience,
        isFirstOrderOnly: coupIsFirstOrder,
        perCustomerLimit: Number(coupPerUserLimit) || 1,
        usageLimit: coupUsageLimit ? Number(coupUsageLimit) : null,
        expiresAt: coupExpiresAt ? new Date(coupExpiresAt).toISOString() : null,
      }

      const url = editingCouponId ? `/api/admin/coupons/${editingCouponId}` : '/api/admin/coupons'
      const method = editingCouponId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save coupon')
      }
      return res.json()
    },
    onSuccess: () => {
      showToast(editingCouponId ? 'Coupon updated successfully!' : 'Coupon created successfully!', 'success')
      setIsCouponModalOpen(false)
      setEditingCouponId(null)
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Error saving coupon', 'error')
    },
  })

  // Toggle Coupon Active Mutation
  const toggleCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/coupons/${id}/toggle`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to toggle coupon')
      return res.json()
    },
    onSuccess: () => {
      showToast('Coupon status updated', 'info')
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
    },
  })

  // Delete Coupon Mutation
  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm('Are you sure you want to permanently delete this coupon?')) return null
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete coupon')
      return res.json()
    },
    onSuccess: (data) => {
      if (!data) return
      showToast('Coupon deleted successfully', 'info')
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
    },
  })

  const handleOpenEditCoupon = (c: CouponItem) => {
    setEditingCouponId(c.id)
    setCoupCode(c.code)
    setCoupDescription(c.description || '')
    setCoupDiscountType(c.discountType)
    setCoupDiscountValue(c.discountValue)
    setCoupMinOrder(c.minOrderAmount)
    setCoupMaxDiscount(c.maxDiscountAmount ? String(c.maxDiscountAmount) : '')
    setCoupPaymentConstraint(c.paymentConstraint)
    setCoupAudience(c.audience || 'ALL')
    setCoupIsFirstOrder(Boolean(c.isFirstOrderOnly))
    setCoupPerUserLimit(c.perCustomerLimit || 1)
    setCoupUsageLimit(c.usageLimit ? String(c.usageLimit) : '')
    setCoupExpiresAt(c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : '')
    setIsCouponModalOpen(true)
  }

  const handleOpenNewCoupon = () => {
    setEditingCouponId(null)
    setCoupCode('')
    setCoupDescription('')
    setCoupDiscountType('FIXED')
    setCoupDiscountValue(50)
    setCoupMinOrder(499)
    setCoupMaxDiscount('')
    setCoupPaymentConstraint('ALL')
    setCoupAudience('ALL')
    setCoupIsFirstOrder(false)
    setCoupPerUserLimit(1)
    setCoupUsageLimit('')
    setCoupExpiresAt('')
    setIsCouponModalOpen(true)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. PRICING SIMULATOR STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [simIsB2B, setSimIsB2B] = useState<boolean>(false)
  const [simCouponCode, setSimCouponCode] = useState<string>('WELCOME49')
  const [simCartAmount, setSimCartAmount] = useState<number>(550)
  const [simResult, setSimResult] = useState<any>(null)
  const [isSimulating, setIsSimulating] = useState<boolean>(false)

  const runSimulation = async () => {
    setIsSimulating(true)
    try {
      // Find a variant from products to simulate with
      const pRes = await fetch('/api/products')
      const pData = await pRes.json()
      const firstVariant = pData?.products?.[0]?.variants?.[0]
      const secondVariant = pData?.products?.[1]?.variants?.[0]

      const sampleItems = []
      if (firstVariant) {
        sampleItems.push({ variantId: firstVariant.id, quantity: 2 })
      }
      if (secondVariant) {
        sampleItems.push({ variantId: secondVariant.id, quantity: 1 })
      }

      const res = await fetch('/api/cart/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: sampleItems,
          isB2B: simIsB2B,
          couponCode: simCouponCode,
          paymentMethod: 'CASH_ON_DELIVERY',
        }),
      })

      const data = await res.json()
      setSimResult(data)
      showToast('Simulation complete!', 'success')
    } catch (e: any) {
      showToast('Simulation failed: ' + e.message, 'error')
    } finally {
      setIsSimulating(false)
    }
  }

  // Helper for active campaign check
  const now = new Date()
  const activeCampaign = campaigns.find(
    (c) => c.isActive && new Date(c.startDate) <= now && new Date(c.endDate) >= now
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* ─── HEADER BAR ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-md">
              <Sparkles className="w-5 h-5" />
            </span>
            Promotions & Offers Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage site-wide festive sales (Diwali Dhamaka), unlockable ticket coupons, and real-time delivery rules.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('CAMPAIGNS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'CAMPAIGNS'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Festive Sales ({campaigns.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('COUPONS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'COUPONS'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Coupons ({coupons.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'SIMULATOR'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Pricing Simulator</span>
          </button>
        </div>
      </div>

      {/* ─── LIVE BANNER PREVIEW IF CAMPAIGN ACTIVE ───────────────────────────── */}
      {activeCampaign && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-amber-300">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🪔</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                  Live on Storefront
                </span>
                <span className="text-xs font-bold text-amber-100">
                  {activeCampaign.discountType === 'PERCENTAGE'
                    ? `${activeCampaign.discountValue}% OFF`
                    : `₹${activeCampaign.discountValue} OFF`}
                </span>
              </div>
              <h3 className="text-sm font-black mt-0.5">{activeCampaign.bannerText}</h3>
              <p className="text-[11px] text-amber-100 mt-0.5">
                Ends on {new Date(activeCampaign.endDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })} • Stacking: {activeCampaign.allowCouponStacking ? 'Allowed with Coupons' : 'Coupons Disabled'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => toggleCampaignMutation.mutate(activeCampaign.id)}
              className="px-3 py-1.5 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-xs hover:bg-amber-50 transition"
            >
              Emergency Kill Switch (Turn Off)
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: FESTIVE SALES / CAMPAIGNS                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'CAMPAIGNS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Site-Wide Campaigns & Festive Sales
              </h2>
              <p className="text-xs text-slate-500">
                Discounts apply automatically at checkout without customer typing codes. Base DB prices are never touched!
              </p>
            </div>

            <button
              onClick={handleOpenNewCampaign}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            {isCampaignsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="p-12 text-center select-none">
                <Flame className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No campaigns created yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Launch your Diwali Dhamaka 10% site-wide sale using the button above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Campaign Name</th>
                      <th className="px-5 py-3.5">Discount</th>
                      <th className="px-5 py-3.5">Banner Text</th>
                      <th className="px-5 py-3.5">Audience</th>
                      <th className="px-5 py-3.5">Stacking</th>
                      <th className="px-5 py-3.5">Validity (IST)</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {campaigns.map((c) => {
                      const isLive = c.isActive && new Date(c.startDate) <= now && new Date(c.endDate) >= now
                      const isUpcoming = c.isActive && new Date(c.startDate) > now
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                          <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span>{c.name}</span>
                              {c.badgeText && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                  {c.badgeText}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-extrabold text-orange-600 dark:text-orange-400">
                            {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                          </td>
                          <td className="px-5 py-4 max-w-xs truncate text-slate-600 dark:text-slate-300 font-medium">
                            {c.bannerText}
                          </td>
                          <td className="px-5 py-4">
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {c.audience.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              c.allowCouponStacking ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {c.allowCouponStacking ? 'Coupons Allowed' : 'Coupons Blocked'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-500 font-medium text-[11px]">
                            {new Date(c.startDate).toLocaleDateString('en-IN')} → {new Date(c.endDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isLive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isUpcoming
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isLive ? '● LIVE NOW' : isUpcoming ? 'UPCOMING' : c.isActive ? 'EXPIRED' : 'PAUSED'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => toggleCampaignMutation.mutate(c.id)}
                                title={c.isActive ? 'Pause Campaign' : 'Activate Campaign'}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
                              >
                                {c.isActive ? (
                                  <ToggleRight className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-slate-400" />
                                )}
                              </button>
                              <button
                                onClick={() => handleOpenEditCampaign(c)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteCampaignMutation.mutate(c.id)}
                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: COUPONS & COD DISCOUNTS                                        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'COUPONS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Coupons & Unlockable Tickets
              </h2>
              <p className="text-xs text-slate-500">
                Powers the Domino&apos;s-style &quot;0/2 Unlocked&quot; ticket cards, progress bars, and celebration states.
              </p>
            </div>

            <button
              onClick={handleOpenNewCoupon}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            {isCouponsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading coupons...</div>
            ) : coupons.length === 0 ? (
              <div className="p-12 text-center select-none">
                <Tag className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No coupons active</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Create your first promotional or COD coupon using the button above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Code</th>
                      <th className="px-5 py-3.5">Discount</th>
                      <th className="px-5 py-3.5">Min Order (After Sale)</th>
                      <th className="px-5 py-3.5">Payment</th>
                      <th className="px-5 py-3.5">Audience</th>
                      <th className="px-5 py-3.5">Claims</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                        <td className="px-5 py-4">
                          <span className="font-mono font-black text-orange-600 dark:text-orange-400 border border-dashed border-orange-300 px-2 py-0.5 rounded-lg bg-orange-50/50">
                            {c.code}
                          </span>
                          {c.description && (
                            <p className="text-[11px] text-slate-400 font-normal mt-1 max-w-xs truncate">{c.description}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                          {c.discountType === 'FIXED' ? (
                            `₹${c.discountValue}`
                          ) : (
                            <span>
                              {c.discountValue}% OFF
                              {c.maxDiscountAmount && (
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  Up to ₹{c.maxDiscountAmount}
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                          ₹{c.minOrderAmount}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.paymentConstraint === 'COD_ONLY'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {c.paymentConstraint.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {c.audience ? c.audience.replace('_', ' ') : 'ALL'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700 font-medium text-[11px]">
                          {c.timesUsed} {c.usageLimit ? `/ ${c.usageLimit}` : 'claims'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => toggleCouponMutation.mutate(c.id)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                            >
                              {c.isActive ? (
                                <ToggleRight className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-slate-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleOpenEditCoupon(c)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteCouponMutation.mutate(c.id)}
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: PRICING SIMULATOR                                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'SIMULATOR' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-orange-500" />
              Server Pricing Simulator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify how active campaigns, coupon stacking, delivery thresholds (₹500), and total savings calculate together before customer checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Customer Mode</label>
              <select
                value={simIsB2B ? 'B2B' : 'B2C'}
                onChange={(e) => setSimIsB2B(e.target.value === 'B2B')}
                className="w-full mt-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50"
              >
                <option value="B2C">B2C Retail Customer</option>
                <option value="B2B">B2B Wholesale Account</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Test Coupon Code</label>
              <input
                type="text"
                value={simCouponCode}
                onChange={(e) => setSimCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME49"
                className="w-full mt-1.5 px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                {isSimulating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Calculation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Simulation Output */}
          {simResult && (
            <div className="mt-6 border border-slate-200 rounded-2xl p-5 bg-slate-50/70 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-extrabold text-slate-900">Simulation Output</span>
                {simResult.activeCampaign ? (
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Active Campaign: {simResult.activeCampaign.name} ({simResult.activeCampaign.discountValue}% OFF)
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">No Campaign Active</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Subtotal (After Sale)</span>
                  <span className="text-base font-black text-slate-900">₹{simResult.subtotal}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Campaign Savings</span>
                  <span className="text-base font-black text-orange-600">₹{simResult.campaignSavings}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Coupon Discount</span>
                  <span className="text-base font-black text-emerald-600">
                    {simResult.appliedCoupon ? `₹${simResult.appliedCoupon.discount}` : '₹0'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivery Fee</span>
                  <span className="text-base font-black text-slate-900">
                    {simResult.delivery.isFree ? 'FREE (₹0)' : `₹${simResult.delivery.fee}`}
                  </span>
                </div>
              </div>

              {/* Delivery Threshold Nudge Progress */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Free Delivery Threshold (₹{simResult.delivery.freeDeliveryThreshold})</span>
                  <span>{simResult.delivery.progressPercent}% Met</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${simResult.delivery.progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {simResult.delivery.isFree
                    ? '🎉 Free express delivery unlocked!'
                    : `Add items worth ₹${simResult.delivery.shortfallToFree} more for free delivery.`}
                </p>
              </div>

              {/* Unlocked vs Locked Coupons */}
              {simResult.availableCoupons && (
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-slate-800">Evaluated Ticket Coupons:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {simResult.availableCoupons.map((c: any) => (
                      <div
                        key={c.code}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          c.status === 'UNLOCKED'
                            ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <div>
                          <span className="font-mono font-black">{c.code}</span>
                          <span className="text-[11px] block text-slate-500 font-medium">{c.lockReason || `Save ₹${c.potentialDiscount}`}</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          c.status === 'UNLOCKED' ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Customer Savings Across All Offers:</span>
                <span className="text-emerald-600 text-base">₹{simResult.totalSavings} 🥳</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: CREATE / EDIT FESTIVE CAMPAIGN                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                {editingCampaignId ? 'Edit Festive Campaign' : 'Create Festive Campaign'}
              </h3>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                saveCampaignMutation.mutate()
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g. Diwali Dhamaka 2026"
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Festive Announcement Banner Text *
                </label>
                <input
                  type="text"
                  value={campBannerText}
                  onChange={(e) => setCampBannerText(e.target.value)}
                  placeholder="e.g. Diwali Dhamaka: Flat 10% OFF on all McCain snacks! 🪔✨"
                  className="w-full mt-1 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Shown as the top announcement strip on the storefront when campaign is active.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Discount Type</label>
                  <select
                    value={campDiscountType}
                    onChange={(e) => setCampDiscountType(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="PERCENTAGE">Percentage (%) OFF</option>
                    <option value="FIXED">Flat (₹) OFF</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Discount Value *</label>
                  <input
                    type="number"
                    value={campDiscountValue}
                    onChange={(e) => setCampDiscountValue(Number(e.target.value))}
                    min="1"
                    className="w-full mt-1 px-3 py-2 text-xs font-extrabold text-orange-600 rounded-xl border border-slate-200 bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Card Badge Label</label>
                  <input
                    type="text"
                    value={campBadgeText}
                    onChange={(e) => setCampBadgeText(e.target.value)}
                    placeholder="e.g. 10% OFF • DIWALI"
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Target Audience</label>
                  <select
                    value={campAudience}
                    onChange={(e) => setCampAudience(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="ALL">All Customers (B2C + B2B)</option>
                    <option value="B2C_ONLY">B2C Retail Only</option>
                    <option value="B2B_ONLY">B2B Wholesalers Only</option>
                  </select>
                </div>
              </div>

              {/* Stacking Rule Switch */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-amber-900 block">Allow Coupon Stacking</span>
                  <span className="text-[11px] text-amber-700 font-medium">
                    Let customers also apply coupon codes on top of this sale discount
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCampAllowStacking(!campAllowStacking)}
                  className="p-1"
                >
                  {campAllowStacking ? (
                    <ToggleRight className="w-7 h-7 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Starts At (IST) *</label>
                  <input
                    type="datetime-local"
                    value={campStartDate}
                    onChange={(e) => setCampStartDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Ends At (IST) *</label>
                  <input
                    type="datetime-local"
                    value={campEndDate}
                    onChange={(e) => setCampEndDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveCampaignMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md"
                >
                  {saveCampaignMutation.isPending ? 'Saving...' : editingCampaignId ? 'Update Campaign' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: CREATE / EDIT COUPON                                           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-500" />
                {editingCouponId ? 'Edit Coupon' : 'Create Promotional Coupon'}
              </h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                saveCouponMutation.mutate()
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Coupon Code *</label>
                <input
                  type="text"
                  value={coupCode}
                  onChange={(e) => setCoupCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DIWALI50 or WELCOME49"
                  disabled={Boolean(editingCouponId)}
                  className="w-full mt-1 px-3 py-2 text-xs font-mono font-black uppercase rounded-xl border border-slate-200 bg-slate-50 disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Description / Benefit</label>
                <input
                  type="text"
                  value={coupDescription}
                  onChange={(e) => setCoupDescription(e.target.value)}
                  placeholder="e.g. Flat ₹50 off on McCain smiles and finger foods"
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Discount Type</label>
                  <select
                    value={coupDiscountType}
                    onChange={(e) => setCoupDiscountType(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="FIXED">Flat (₹) OFF</option>
                    <option value="PERCENTAGE">Percentage (%) OFF</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Discount Value *</label>
                  <input
                    type="number"
                    value={coupDiscountValue}
                    onChange={(e) => setCoupDiscountValue(Number(e.target.value))}
                    min="1"
                    className="w-full mt-1 px-3 py-2 text-xs font-extrabold text-orange-600 rounded-xl border border-slate-200 bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={coupMinOrder}
                    onChange={(e) => setCoupMinOrder(Number(e.target.value))}
                    min="0"
                    className="w-full mt-1 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Checked after sale discount</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Max Cap (For % Type)</label>
                  <input
                    type="number"
                    value={coupMaxDiscount}
                    onChange={(e) => setCoupMaxDiscount(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Payment Method</label>
                  <select
                    value={coupPaymentConstraint}
                    onChange={(e) => setCoupPaymentConstraint(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="ALL">All Payment Methods</option>
                    <option value="COD_ONLY">Cash on Delivery Only</option>
                    <option value="ONLINE_ONLY">Online Prepaid Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Audience</label>
                  <select
                    value={coupAudience}
                    onChange={(e) => setCoupAudience(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="ALL">All Customers</option>
                    <option value="B2C_ONLY">Retail B2C Only</option>
                    <option value="B2B_ONLY">B2B Wholesalers Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Per-Customer Limit</label>
                  <input
                    type="number"
                    value={coupPerUserLimit}
                    onChange={(e) => setCoupPerUserLimit(Number(e.target.value))}
                    min="1"
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Total Usage Limit</label>
                  <input
                    type="number"
                    value={coupUsageLimit}
                    onChange={(e) => setCoupUsageLimit(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Expiry Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={coupExpiresAt}
                  onChange={(e) => setCoupExpiresAt(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveCouponMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md"
                >
                  {saveCouponMutation.isPending ? 'Saving...' : editingCouponId ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
