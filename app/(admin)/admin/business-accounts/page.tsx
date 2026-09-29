'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Building2, ShieldCheck, Clock, AlertTriangle, Search, Filter, 
  CheckCircle2, XCircle, Edit3, DollarSign, Award, ChevronRight, Phone, MapPin, FileCheck
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function AdminBusinessAccountsPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Edit Modal State
  const [editLimit, setEditLimit] = useState<number>(15000)
  const [editTier, setEditTier] = useState<'BRONZE' | 'SILVER' | 'GOLD'>('BRONZE')
  const [editStatus, setEditStatus] = useState<'PENDING' | 'VERIFIED' | 'REJECTED'>('VERIFIED')

  // Fetch B2B Business Accounts
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['admin-b2b-accounts', statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/business-accounts?status=${statusFilter}`)
      if (!res.ok) throw new Error('Failed to fetch business accounts')
      return res.json()
    }
  })

  // Verify / Update Mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ userId, verificationStatus, creditLimit, creditTier }: any) => {
      const res = await fetch(`/api/admin/business-accounts/${userId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus, creditLimit, creditTier })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update business account')
      return data
    },
    onSuccess: (data) => {
      showToast(data.message || 'Business account updated!', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-b2b-accounts'] })
      setSelectedUser(null)
    },
    onError: (err: any) => {
      showToast(err.message || 'Action failed', 'error')
    }
  })

  // Toggle Credit Facility Mutation
  const toggleCreditMutation = useMutation({
    mutationFn: async ({ userId, isCreditEnabled, creditLimit }: any) => {
      const res = await fetch(`/api/admin/business-accounts/${userId}/toggle-credit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCreditEnabled, creditLimit })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update credit status')
      return data
    },
    onSuccess: (data) => {
      showToast(data.message || 'Credit facility updated!', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-b2b-accounts'] })
      setSelectedUser(null)
    },
    onError: (err: any) => {
      showToast(err.message || 'Action failed', 'error')
    }
  })

  // Open Edit Modal
  const openModal = (user: any, targetStatus?: 'VERIFIED' | 'REJECTED') => {
    setSelectedUser(user)
    setEditLimit(user.creditLimit || 25000)
    setEditTier(user.businessProfile?.creditTier || 'BRONZE')
    setEditStatus(targetStatus || user.businessProfile?.verificationStatus || 'VERIFIED')
    setEditCreditEnabled(user.isCreditEnabled || user.businessProfile?.isCreditEnabled || false)
  }

  const handleQuickApprove = (user: any) => {
    verifyMutation.mutate({
      userId: user.id,
      verificationStatus: 'VERIFIED',
      creditLimit: user.creditLimit > 0 ? user.creditLimit : 25000,
      creditTier: user.businessProfile?.creditTier || 'SILVER'
    })
  }

  const handleQuickReject = (user: any) => {
    verifyMutation.mutate({
      userId: user.id,
      verificationStatus: 'REJECTED',
      creditLimit: 0,
      creditTier: 'BRONZE'
    })
  }

  const handleToggleCredit = (user: any) => {
    const nextStatus = !(user.isCreditEnabled || user.businessProfile?.isCreditEnabled)
    toggleCreditMutation.mutate({
      userId: user.id,
      isCreditEnabled: nextStatus,
      creditLimit: user.creditLimit > 0 ? user.creditLimit : 25000
    })
  }

  const handleSaveModal = () => {
    if (!selectedUser) return
    verifyMutation.mutate({
      userId: selectedUser.id,
      verificationStatus: editStatus,
      creditLimit: Number(editLimit),
      creditTier: editTier
    })
    toggleCreditMutation.mutate({
      userId: selectedUser.id,
      isCreditEnabled: editCreditEnabled,
      creditLimit: Number(editLimit)
    })
  }

  // Filter accounts by search query
  const filteredAccounts = accounts.filter((acc: any) => {
    const q = searchQuery.toLowerCase()
    return (
      acc.name.toLowerCase().includes(q) ||
      acc.phone.includes(q) ||
      (acc.businessName && acc.businessName.toLowerCase().includes(q)) ||
      (acc.businessProfile?.gstin && acc.businessProfile.gstin.toLowerCase().includes(q))
    )
  })

  // Stats calculation
  const totalCount = accounts.length
  const pendingCount = accounts.filter((a: any) => a.businessProfile?.verificationStatus === 'PENDING').length
  const verifiedCount = accounts.filter((a: any) => a.businessProfile?.verificationStatus === 'VERIFIED').length
  const totalCreditAllocated = accounts.reduce((acc: number, a: any) => acc + (a.creditLimit || 0), 0)

  return (
    <div className="flex flex-col gap-6 font-body">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-lg sm:text-xl font-black text-brand-charcoal">
                B2B Business Accounts & Credit Control Board
              </h1>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                Review commercial credentials, enable/disable credit limits, and verify hotel/cafe accounts.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search hotel, GST, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-xs rounded-2xl pl-10 pr-4 py-2.5 font-medium focus:outline-none focus:border-purple-600"
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total B2B Accounts</span>
          <span className="text-2xl font-black text-brand-charcoal mt-1 block">{totalCount}</span>
        </div>

        <div className="bg-amber-50 p-5 rounded-3xl border border-amber-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Pending Review</span>
          <span className="text-2xl font-black text-amber-900 mt-1 block">{pendingCount}</span>
        </div>

        <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Verified Partners</span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">{verifiedCount}</span>
        </div>

        <div className="bg-purple-50 p-5 rounded-3xl border border-purple-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">Credit Allocated</span>
          <span className="text-2xl font-black text-purple-900 mt-1 block">₹{totalCreditAllocated.toLocaleString()}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {(['PENDING', 'VERIFIED', 'ALL', 'REJECTED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab as any)}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all shrink-0 ${
              statusFilter === tab
                ? 'bg-brand-charcoal text-white shadow-sm'
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab === 'PENDING' && `⌛ Pending (${pendingCount})`}
            {tab === 'VERIFIED' && `✅ Verified (${verifiedCount})`}
            {tab === 'ALL' && `📋 All (${totalCount})`}
            {tab === 'REJECTED' && `❌ Rejected`}
          </button>
        ))}
      </div>

      {/* Accounts List / Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-400 font-bold text-xs">Loading B2B accounts...</div>
      ) : filteredAccounts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 text-gray-400 font-bold text-xs">
          No business accounts found matching filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAccounts.map((acc: any) => {
            const profile = acc.businessProfile || {}
            const status = profile.verificationStatus || 'PENDING'
            const isCreditActive = Boolean(acc.isCreditEnabled || profile.isCreditEnabled)

            return (
              <div 
                key={acc.id}
                className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                {/* Card Top: Business Name & Status Pill */}
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-black text-brand-charcoal leading-tight">
                        {acc.businessName || profile.businessName || acc.name}
                      </h3>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        {profile.businessType || 'COMMERCIAL'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-semibold mt-1 flex items-center gap-1.5">
                      <span>👤 {acc.name}</span>
                      <span>•</span>
                      <span>📞 +91 {acc.phone}</span>
                    </p>
                  </div>

                  {/* Status Pill */}
                  {status === 'VERIFIED' ? (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  ) : status === 'REJECTED' ? (
                    <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Declined</span>
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending</span>
                    </span>
                  )}
                </div>

                {/* Details Breakdown */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">GSTIN</span>
                    <span className="font-mono font-bold text-brand-charcoal">{profile.gstin || 'Not Provided'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">FSSAI Licence</span>
                    <span className="font-mono font-bold text-brand-charcoal">{profile.fssaiNumber || 'Not Provided'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Credit Facility Status</span>
                    {isCreditActive ? (
                      <span className="font-black text-emerald-600 flex items-center gap-1">
                        🟢 Credit Enabled (₹{acc.creditLimit})
                      </span>
                    ) : (
                      <span className="font-bold text-gray-500 flex items-center gap-1">
                        🔒 Credit Disabled (Default)
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Credit Limit & Tier</span>
                    <span className="font-bold text-purple-900">₹{acc.creditLimit} • {profile.creditTier || 'BRONZE'}</span>
                  </div>
                </div>

                {/* Credit Limit Toggle Action Bar */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-black text-purple-950">Credit Payment Option</span>
                    <span className="text-[10px] font-semibold text-purple-700">
                      {isCreditActive ? 'Business can pay via Credit Account' : 'Credit payment option hidden at checkout'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleCredit(acc)}
                    disabled={toggleCreditMutation.isPending}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs ${
                      isCreditActive
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isCreditActive ? 'Disable Credit' : 'Enable Credit'}
                  </button>
                </div>

                {/* Outlet Address if available */}
                {profile.businessAddress && (
                  <p className="text-[11px] text-gray-500 flex items-start gap-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span>{profile.businessAddress}</span>
                  </p>
                )}

                {/* Actions Row */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  {status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleQuickApprove(acc)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-body text-xs font-bold py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 tap-scale"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve B2B</span>
                      </button>

                      <button
                        onClick={() => handleQuickReject(acc)}
                        className="p-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl tap-scale"
                        title="Decline Account"
                      >
                        <XCircle className="w-4.5 h-4.5" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => openModal(acc)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-brand-charcoal font-body text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 tap-scale"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Manage Terms</span>
                  </button>
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 bg-brand-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-display text-base font-black text-brand-charcoal">
                  B2B Credit & Tier Configuration
                </h3>
                <p className="text-xs text-gray-400 font-semibold">{selectedUser.name} • {selectedUser.businessName}</p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Form controls */}
            <div className="flex flex-col gap-4">
              
              {/* Status Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Verification Status</label>
                <select
                  value={editStatus}
                  onChange={(e: any) => setEditStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-2xl p-3 font-semibold"
                >
                  <option value="VERIFIED">✅ VERIFIED (Wholesale Partner)</option>
                  <option value="PENDING">⏳ PENDING (Under Review)</option>
                  <option value="REJECTED">❌ REJECTED (Declined)</option>
                </select>
              </div>

              {/* Credit Facility Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50 border border-purple-200">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-purple-950">Enable Credit Facility</span>
                  <span className="text-[10px] text-purple-700">Allow payment via B2B Credit Account at checkout</span>
                </div>
                <input
                  type="checkbox"
                  checked={editCreditEnabled}
                  onChange={(e) => setEditCreditEnabled(e.target.checked)}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              {/* Credit Limit */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Approved Credit Limit (₹)</label>
                <input
                  type="number"
                  step="5000"
                  value={editLimit}
                  onChange={(e) => setEditLimit(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl p-3 font-bold text-brand-charcoal"
                />
              </div>

              {/* Credit Tier */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">B2B Loyalty Credit Tier</label>
                <select
                  value={editTier}
                  onChange={(e: any) => setEditTier(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-2xl p-3 font-semibold text-brand-charcoal"
                >
                  <option value="BRONZE">🥉 BRONZE (Baseline Credit Terms)</option>
                  <option value="SILVER">🥈 SILVER (High Volume Partner)</option>
                  <option value="GOLD">🥇 GOLD (Key Hotel Distributor Account)</option>
                </select>
              </div>

            </div>

            {/* Save Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-2xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="flex-1 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold py-3 rounded-2xl text-xs shadow-md tap-scale"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
