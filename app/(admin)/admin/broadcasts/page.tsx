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
  HelpCircle,
  Calendar,
  Sparkles,
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

export default function AdminBroadcastsPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<'ALL' | 'B2B' | 'B2C'>('ALL')
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  // Fetch past broadcasts
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

  // Create broadcast mutation
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

  const isFormValid = title.trim().length >= 3 && body.trim().length >= 5

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Radio className="w-6 h-6 text-orange-500" />
          Broadcast Messaging
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Publish immediate announcements, festive offers, and stock updates directly to all active customers.
        </p>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── LEFT CARD: Create New Broadcast (5 cols) ────────────────────────── */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            Create New Broadcast
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
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
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Audience Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                Target Audience
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAudience('ALL')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
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
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
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
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
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
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 leading-relaxed"
              />
            </div>

            {/* Delivery Info Notice */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold">Instant Private Delivery</p>
                <p className="mt-0.5 leading-relaxed text-amber-700 dark:text-amber-400">
                  Broadcasts are delivered instantly to each active customer profile and logged to your Google Sheet.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || recipientCount === 0}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Send className="w-4 h-4" />
              Send to {recipientCount} Customer{recipientCount === 1 ? '' : 's'}
            </button>
          </form>
        </div>

        {/* ─── RIGHT CARD: Recent Broadcasts (7 cols) ───────────────────────────── */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Recent Broadcasts
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {broadcasts.length} Published
            </span>
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {broadcastsLoading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading broadcasts...</div>
            ) : broadcasts.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Radio className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
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
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 hover:border-orange-300 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {b.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      DELIVERED
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {b.body}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
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

      {/* ─── Confirmation Modal ──────────────────────────────────────────────── */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center mx-auto">
              <Radio className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Confirm Broadcast Delivery
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You are about to send this message to{' '}
                <strong className="text-orange-600">{recipientCount}</strong> active customer(s).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
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
