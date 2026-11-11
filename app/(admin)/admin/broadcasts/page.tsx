'use client'

import React, { useState } from 'react'
import {
  Radio,
  Send,
  Users,
  Building2,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  Flame,
  AlertTriangle,
  Info,
  Bell,
  Trash2,
  Edit2,
  Check,
  Eye,
  EyeOff,
  Plus,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/Toast'

interface BroadcastItem {
  id: string
  title: string
  body: string
  audience: 'ALL' | 'B2B' | 'B2C'
  recipientCount: number
  sheetSyncStatus: string
  createdAt: string
  author: {
    name: string
    role: string
  }
}

interface StoreAlertItem {
  id: string
  title: string
  message: string
  badgeText: string | null
  alertType: 'OFFER' | 'WARNING' | 'INFO' | 'ANNOUNCEMENT'
  ctaText: string | null
  ctaLink: string | null
  isGlowing: boolean
  isActive: boolean
  createdAt: string
}

export default function AdminBroadcastsPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  // Primary Tab: 'CHAT_BROADCAST' | 'STORE_ALERTS'
  const [activeTab, setActiveTab] = useState<'CHAT_BROADCAST' | 'STORE_ALERTS'>('CHAT_BROADCAST')

  // ─── CHAT BROADCAST STATE ──────────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<'ALL' | 'B2B' | 'B2C'>('ALL')
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  // ─── STORE ALERT STATE ────────────────────────────────────────────────────
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null)
  const [alertTitle, setAlertTitle] = useState('Diwali Dhamaka: Flat 10% OFF 🪔✨')
  const [alertMessage, setAlertMessage] = useState('Get Flat 10% OFF on all McCain Snacks & Frozen Treats!')
  const [alertBadgeText, setAlertBadgeText] = useState('10% OFF AT CHECKOUT')
  const [alertType, setAlertType] = useState<'OFFER' | 'WARNING' | 'INFO' | 'ANNOUNCEMENT'>('OFFER')
  const [alertCtaText, setAlertCtaText] = useState('View Offers')
  const [alertCtaLink, setAlertCtaLink] = useState('')
  const [alertIsGlowing, setAlertIsGlowing] = useState(true)
  const [alertIsActive, setAlertIsActive] = useState(true)

  // Fetch past chat broadcasts
  const {
    data: broadcastsData,
    isLoading: broadcastsLoading,
  } = useQuery({
    queryKey: ['admin-broadcasts'],
    queryFn: async () => {
      const res = await fetch('/api/admin/broadcasts')
      if (!res.ok) throw new Error('Failed to load broadcasts')
      return res.json() as Promise<{ broadcasts: BroadcastItem[] }>
    },
  })

  // Fetch estimated recipient count dynamically
  const { data: recipientData } = useQuery({
    queryKey: ['admin-broadcast-count', audience],
    queryFn: async () => {
      const res = await fetch(`/api/admin/broadcasts/recipient-count?audience=${audience}`)
      if (!res.ok) return { count: 0 }
      return res.json() as Promise<{ count: number }>
    },
  })

  const recipientCount = recipientData?.count ?? 0

  // Fetch store alerts
  const {
    data: storeAlertsData,
    isLoading: storeAlertsLoading,
  } = useQuery({
    queryKey: ['admin-store-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/store-alerts')
      if (!res.ok) return { alerts: [] }
      return res.json() as Promise<{ alerts: StoreAlertItem[] }>
    },
  })

  const storeAlerts = storeAlertsData?.alerts || []

  // Create chat broadcast mutation
  const createBroadcastMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, audience }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to send broadcast')
      }
      return res.json()
    },
    onSuccess: (data) => {
      showToast(`Broadcast successfully delivered to ${data.recipientCount} customer(s)!`, 'success')
      setTitle('')
      setBody('')
      setIsConfirmModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Error publishing broadcast', 'error')
    },
  })

  // Create or Update Store Alert Mutation
  const saveStoreAlertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: alertTitle,
        message: alertMessage,
        badgeText: alertBadgeText,
        alertType,
        ctaText: alertCtaText,
        ctaLink: alertCtaLink,
        isGlowing: alertIsGlowing,
        isActive: alertIsActive,
      }

      const url = editingAlertId ? `/api/store-alerts/${editingAlertId}` : '/api/store-alerts'
      const method = editingAlertId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save store alert')
      }
      return res.json()
    },
    onSuccess: () => {
      showToast(editingAlertId ? 'Store Alert updated!' : 'Store Alert published to storefront!', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-store-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['active-store-alert'] })
      setEditingAlertId(null)
    },
    onError: (err: any) => {
      showToast(err.message || 'Error saving alert', 'error')
    },
  })

  // Toggle Store Alert Active Mutation
  const toggleAlertActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/store-alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error('Failed to toggle status')
      return res.json()
    },
    onSuccess: () => {
      showToast('Store alert status updated!', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-store-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['active-store-alert'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Error updating alert status', 'error')
    },
  })

  // Delete Store Alert Mutation
  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/store-alerts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete alert')
      return res.json()
    },
    onSuccess: () => {
      showToast('Store Alert deleted', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-store-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['active-store-alert'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Error deleting alert', 'error')
    },
  })

  const handleEditAlert = (item: StoreAlertItem) => {
    setEditingAlertId(item.id)
    setAlertTitle(item.title)
    setAlertMessage(item.message)
    setAlertBadgeText(item.badgeText || '')
    setAlertType(item.alertType)
    setAlertCtaText(item.ctaText || '')
    setAlertCtaLink(item.ctaLink || '')
    setAlertIsGlowing(item.isGlowing)
    setAlertIsActive(item.isActive)
  }

  const handleResetAlertForm = () => {
    setEditingAlertId(null)
    setAlertTitle('Diwali Dhamaka: Flat 10% OFF 🪔✨')
    setAlertMessage('Get Flat 10% OFF on all McCain Snacks & Frozen Treats!')
    setAlertBadgeText('10% OFF AT CHECKOUT')
    setAlertType('OFFER')
    setAlertCtaText('View Offers')
    setAlertCtaLink('')
    setAlertIsGlowing(true)
    setAlertIsActive(true)
  }

  const isFormValid = title.trim().length >= 3 && body.trim().length >= 5
  const isAlertFormValid = alertTitle.trim().length >= 3 && alertMessage.trim().length >= 3

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const broadcasts = broadcastsData?.broadcasts || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-orange-500" />
            Broadcast & Storefront Alerts Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Send targeted chat broadcasts to customer profiles or display glowing announcement banners at the top of the storefront.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveTab('CHAT_BROADCAST')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CHAT_BROADCAST'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Chat Broadcasts</span>
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {broadcasts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STORE_ALERTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'STORE_ALERTS'
                ? 'bg-white dark:bg-slate-900 text-amber-500 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Storefront Glowing Alerts</span>
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
              {storeAlerts.filter((a) => a.isActive).length} Live
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ─── TAB 1: CHAT BROADCAST MESSAGING (Existing & 100% Preserved) ────────── */}
      {/* ========================================================================= */}
      {activeTab === 'CHAT_BROADCAST' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ─── LEFT CARD: Create New Broadcast (5 cols) ────────────────────────── */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm">
            <h2 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Create New Chat Broadcast
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (isFormValid) setIsConfirmModalOpen(true)
              }}
              className="space-y-4"
            >
              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Title
                  </label>
                  <span className="text-[11px] text-slate-400">{title.length} / 80</span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                  placeholder="e.g. Special Weekend Offer on McCain French Fries!"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                />
              </div>

              {/* Audience Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                  Target Audience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAudience('ALL')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      audience === 'ALL'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    All ({audience === 'ALL' ? recipientCount : 'All'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudience('B2B')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      audience === 'B2B'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    B2B Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudience('B2C')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      audience === 'B2C'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    Retail B2C
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Message Content
                  </label>
                  <span className="text-[11px] text-slate-400">{body.length} / 1000</span>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={1000}
                  rows={5}
                  placeholder="Write your announcement here in English, Marathi, or Hindi..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 leading-relaxed font-medium"
                />
              </div>

              {/* Delivery Info Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-bold">Instant Private Chat Delivery</p>
                  <p className="mt-0.5 leading-relaxed text-amber-700 dark:text-amber-400 text-[11px]">
                    Broadcasts are delivered directly to each active customer's chat screen and synchronized to your system logs.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || recipientCount === 0}
                className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Send to {recipientCount} Customer{recipientCount === 1 ? '' : 's'}
              </button>
            </form>
          </div>

          {/* ─── RIGHT CARD: Recent Broadcasts (7 cols) ───────────────────────────── */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Recent Broadcasts
              </h2>
              <span className="text-xs text-slate-400 font-bold">
                {broadcasts.length} Published
              </span>
            </div>

            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {broadcastsLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading broadcasts...</div>
              ) : broadcasts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Radio className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    No broadcasts created yet
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Send your first announcement using the form on the left.
                  </p>
                </div>
              ) : (
                broadcasts.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 hover:border-orange-300 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-black text-slate-900 dark:text-white text-sm">
                        {b.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        DELIVERED
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {b.body}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
                          <Users className="w-3 h-3 text-orange-500" />
                          {b.recipientCount} Recipients ({b.audience})
                        </span>
                        <span>By {b.author?.name || 'Admin'}</span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(b.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ─── TAB 2: STOREFRONT GLOWING ALERTS & TOP BANNERS (New Feature) ──────── */}
      {/* ========================================================================= */}
      {activeTab === 'STORE_ALERTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ─── LEFT: Form + Real-time Live Preview (5 cols) ────────────────────── */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Live Interactive Preview Card */}
            <div className="bg-slate-950 text-white rounded-3xl p-5 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 animate-pulse" /> Live Storefront Preview
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  {alertIsActive ? '🟢 Live on Store' : '⚪ Draft / Hidden'}
                </span>
              </div>

              {/* Glowing Banner Render */}
              <div
                className={`relative rounded-2xl p-3 text-xs font-bold border transition-all ${
                  alertType === 'OFFER'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 border-amber-400/50 text-white shadow-[0_2px_18px_rgba(245,158,11,0.5)]'
                    : alertType === 'WARNING'
                    ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 border-rose-500/60 text-white shadow-[0_2px_18px_rgba(225,29,72,0.5)]'
                    : alertType === 'INFO'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 border-blue-400/50 text-white shadow-[0_2px_18px_rgba(37,99,235,0.5)]'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border-emerald-400/50 text-white shadow-[0_2px_18px_rgba(16,185,129,0.5)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {alertType === 'OFFER' && <Flame className="w-4 h-4 text-amber-200 fill-amber-300 animate-pulse shrink-0" />}
                    {alertType === 'WARNING' && <AlertTriangle className="w-4 h-4 text-rose-200 animate-bounce shrink-0" />}
                    {alertType === 'INFO' && <Info className="w-4 h-4 text-blue-200 shrink-0" />}
                    {alertType === 'ANNOUNCEMENT' && <Bell className="w-4 h-4 text-emerald-200 animate-pulse shrink-0" />}
                    
                    <div className="truncate">
                      <span className="font-black">{alertTitle || 'Alert Title'}</span>
                      <span className="text-[11px] opacity-90 block sm:inline sm:ml-1 font-medium truncate">
                        {alertMessage || 'Alert message text goes here'}
                      </span>
                    </div>
                  </div>

                  {alertBadgeText && (
                    <span className="hidden sm:inline-block bg-white/20 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0">
                      {alertBadgeText}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Create / Edit Form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  {editingAlertId ? 'Edit Storefront Alert' : 'Create Storefront Alert'}
                </h2>
                {editingAlertId && (
                  <button
                    type="button"
                    onClick={handleResetAlertForm}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (isAlertFormValid) saveStoreAlertMutation.mutate()
                }}
                className="space-y-4"
              >
                {/* Alert Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                    Alert Type & Glowing Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAlertType('OFFER')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                        alertType === 'OFFER'
                          ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span>Offer (Amber)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertType('WARNING')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                        alertType === 'WARNING'
                          ? 'border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Notice / Rain (Red)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertType('INFO')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                        alertType === 'INFO'
                          ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      <Info className="w-4 h-4 text-blue-500" />
                      <span>Update (Blue)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertType('ANNOUNCEMENT')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                        alertType === 'ANNOUNCEMENT'
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      <Bell className="w-4 h-4 text-emerald-500" />
                      <span>Notice (Green)</span>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                    Heading / Title
                  </label>
                  <input
                    type="text"
                    value={alertTitle}
                    onChange={(e) => setAlertTitle(e.target.value)}
                    placeholder="e.g. Diwali Dhamaka: Flat 10% OFF 🪔✨ or Heavy Rain Alert 🌧️"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                    Detailed Message
                  </label>
                  <textarea
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    rows={3}
                    placeholder="e.g. Get 10% instant discount on checkout | Due to heavy rain, evening slot may be delayed by 30 mins."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium leading-relaxed"
                  />
                </div>

                {/* Badge Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                    Pill Badge Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={alertBadgeText}
                    onChange={(e) => setAlertBadgeText(e.target.value)}
                    placeholder="e.g. 10% OFF AT CHECKOUT or DELIVERY DELAY"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold uppercase"
                  />
                </div>

                {/* CTA Button Text & Link */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                      Button Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={alertCtaText}
                      onChange={(e) => setAlertCtaText(e.target.value)}
                      placeholder="e.g. View Offers"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                      Button Link (Optional)
                    </label>
                    <input
                      type="text"
                      value={alertCtaLink}
                      onChange={(e) => setAlertCtaLink(e.target.value)}
                      placeholder="e.g. /category/mccain-foods"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                {/* Glowing & Active Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertIsGlowing}
                      onChange={(e) => setAlertIsGlowing(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pulsing Glow</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertIsActive}
                      onChange={(e) => setAlertIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Immediately</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isAlertFormValid || saveStoreAlertMutation.isPending}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Flame className="w-4 h-4" />
                  <span>{saveStoreAlertMutation.isPending ? 'Saving Alert...' : editingAlertId ? 'Update Storefront Alert' : 'Publish Alert to Storefront'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* ─── RIGHT: List of All Store Alerts (7 cols) ────────────────────────── */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                Manage Storefront Alerts ({storeAlerts.length})
              </h2>
              <span className="text-xs text-slate-400 font-bold">
                {storeAlerts.filter((a) => a.isActive).length} Currently Active
              </span>
            </div>

            <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
              {storeAlertsLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading alerts...</div>
              ) : storeAlerts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Flame className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    No Storefront Alerts created yet
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Use the form on the left to publish your first festive offer or delivery announcement.
                  </p>
                </div>
              ) : (
                storeAlerts.map((item) => {
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                        item.isActive
                          ? 'border-amber-400/50 bg-amber-500/5 dark:bg-amber-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              item.alertType === 'OFFER'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                : item.alertType === 'WARNING'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                : item.alertType === 'INFO'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}
                          >
                            {item.alertType}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              item.isActive
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                            }`}
                          >
                            {item.isActive ? 'Active on Store' : 'Inactive / Draft'}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleAlertActiveMutation.mutate({ id: item.id, isActive: !item.isActive })}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition ${
                              item.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                            title={item.isActive ? 'Deactivate alert' : 'Activate alert'}
                          >
                            {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditAlert(item)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-white border border-slate-200 dark:border-slate-700"
                            title="Edit alert"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete alert "${item.title}"?`)) {
                                deleteAlertMutation.mutate(item.id)
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
                            title="Delete alert"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">{item.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{item.message}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200/60 dark:border-slate-800 pt-2">
                        <span>Badge: <strong>{item.badgeText || 'None'}</strong></span>
                        <span>Created: {formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirmation Modal (For Chat Broadcast) ─────────────────────────── */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center mx-auto">
              <Radio className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Confirm Chat Broadcast Delivery
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You are about to send this message to{' '}
                <strong className="text-orange-600">{recipientCount}</strong> active customer(s).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">"{title}"</p>
              <p className="text-slate-500 dark:text-slate-400 line-clamp-2">{body}</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createBroadcastMutation.isPending}
                onClick={() => createBroadcastMutation.mutate()}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
              >
                {createBroadcastMutation.isPending ? 'Delivering...' : 'Yes, Send to All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
