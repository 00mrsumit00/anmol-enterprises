'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Users, Building2, ShoppingBag, ShieldCheck, Clock, AlertTriangle, 
  Search, Filter, CheckCircle2, XCircle, Edit3, DollarSign, Award, 
  ChevronRight, Phone, MapPin, Mail, RefreshCw, UserCheck, UserX,
  CreditCard, ExternalLink, Calendar, Check
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'

export default function AdminUsersAndAccountsPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // Primary Tab: ALL | RETAIL | B2B | PENDING
  const [activeTab, setActiveTab] = useState<'ALL' | 'RETAIL' | 'B2B' | 'PENDING'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED' | 'VERIFIED' | 'PENDING'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Selected user for Edit / Details Modal
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Modal Form State
  const [editIsB2B, setEditIsB2B] = useState<boolean>(false)
  const [editBusinessName, setEditBusinessName] = useState<string>('')
  const [editBusinessType, setEditBusinessType] = useState<string>('HOTEL')
  const [editGstin, setEditGstin] = useState<string>('')
  const [editCreditLimit, setEditCreditLimit] = useState<number>(25000)
  const [editCreditTier, setEditCreditTier] = useState<'BRONZE' | 'SILVER' | 'GOLD'>('BRONZE')
  const [editCreditEnabled, setEditCreditEnabled] = useState<boolean>(false)
  const [editVerificationStatus, setEditVerificationStatus] = useState<'PENDING' | 'VERIFIED' | 'REJECTED'>('VERIFIED')

  // Query users from /api/admin/users
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-users', activeTab, statusFilter, searchQuery],
    queryFn: async () => {
      const typeParam = activeTab === 'PENDING' ? 'B2B' : activeTab
      const statusParam = activeTab === 'PENDING' ? 'PENDING' : statusFilter
      const res = await fetch(`/api/admin/users?type=${typeParam}&status=${statusParam}&search=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    }
  })

  const users: any[] = data?.users || []
  const stats = data?.stats || {
    total: 0,
    retailCount: 0,
    b2bCount: 0,
    pendingB2bCount: 0,
    creditAllocated: 0,
    totalOrders: 0
  }

  // Toggle user active / disabled
  const toggleActiveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/toggle-active`, { method: 'PUT' })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Failed to update user status')
      return resData
    },
    onSuccess: (data) => {
      showToast(data.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      if (selectedUser) setSelectedUser(null)
    },
    onError: (err: any) => {
      showToast(err.message || 'Action failed', 'error')
    }
  })

  // Toggle B2B / Retail
  const toggleB2bMutation = useMutation({
    mutationFn: async ({ userId, isB2B, businessName, businessType, gstin }: any) => {
      const res = await fetch(`/api/admin/users/${userId}/toggle-b2b`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isB2B, businessName, businessType, gstin })
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Failed to update user type')
      return resData
    },
    onSuccess: (data) => {
      showToast(data.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      if (selectedUser) setSelectedUser(null)
    },
    onError: (err: any) => {
      showToast(err.message || 'Action failed', 'error')
    }
  })

  // Verify / Update B2B account
  const verifyB2bMutation = useMutation({
    mutationFn: async ({ userId, verificationStatus, creditLimit, creditTier }: any) => {
      const res = await fetch(`/api/admin/business-accounts/${userId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus, creditLimit, creditTier })
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Failed to verify account')
      return resData
    },
    onSuccess: (data) => {
      showToast(data.message || 'Business account verified!', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      if (selectedUser) setSelectedUser(null)
    },
    onError: (err: any) => {
      showToast(err.message || 'Action failed', 'error')
    }
  })

  // Toggle Credit Limit
  const toggleCreditMutation = useMutation({
    mutationFn: async ({ userId, isCreditEnabled, creditLimit }: any) => {
      const res = await fetch(`/api/admin/business-accounts/${userId}/toggle-credit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCreditEnabled, creditLimit })
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Failed to update credit status')
      return resData
    },
    onSuccess: (data) => {
      showToast(data.message || 'Credit settings updated!', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      if (selectedUser) setSelectedUser(null)
    },
    onError: (err: any) => {
      showToast(err.message || 'Action failed', 'error')
    }
  })

  // Open modal with user data
  const handleOpenEdit = (user: any) => {
    setSelectedUser(user)
    setEditIsB2B(user.isB2B)
    setEditBusinessName(user.businessName || user.businessProfile?.businessName || '')
    setEditBusinessType(user.businessProfile?.businessType || 'HOTEL')
    setEditGstin(user.businessProfile?.gstin || '')
    setEditCreditLimit(user.creditLimit || 25000)
    setEditCreditTier(user.businessProfile?.creditTier || 'BRONZE')
    setEditCreditEnabled(Boolean(user.isCreditEnabled || user.businessProfile?.isCreditEnabled))
    setEditVerificationStatus(user.businessProfile?.verificationStatus || 'VERIFIED')
  }

  // Save Modal Changes
  const handleSaveModal = async () => {
    if (!selectedUser) return

    try {
      // 1. Update B2B flag & commercial details if changed
      if (editIsB2B !== selectedUser.isB2B || editBusinessName !== selectedUser.businessName) {
        await toggleB2bMutation.mutateAsync({
          userId: selectedUser.id,
          isB2B: editIsB2B,
          businessName: editBusinessName,
          businessType: editBusinessType,
          gstin: editGstin
        })
      }

      // 2. If B2B, update verification and credit terms
      if (editIsB2B) {
        await verifyB2bMutation.mutateAsync({
          userId: selectedUser.id,
          verificationStatus: editVerificationStatus,
          creditLimit: Number(editCreditLimit),
          creditTier: editCreditTier
        })

        await toggleCreditMutation.mutateAsync({
          userId: selectedUser.id,
          isCreditEnabled: editCreditEnabled,
          creditLimit: Number(editCreditLimit)
        })
      }

      showToast('User updated successfully!', 'success')
      setSelectedUser(null)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    } catch (err: any) {
      showToast(err.message || 'Failed to save updates', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* 1. Header Banner & Search */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-orange to-amber-500 text-white flex items-center justify-center shadow-md shadow-brand-orange/20">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-brand-charcoal tracking-tight">
                Registered Users & Customer Hub
              </h1>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-orange-100 text-brand-orange">
                {stats.total} Total
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Manage retail customers and commercial B2B partners, configure wholesale credit limits, and monitor order accounts.
            </p>
          </div>
        </div>

        {/* Quick Search & Force Reload */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, phone, email, GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-xs rounded-2xl pl-10 pr-4 py-2.5 font-medium focus:outline-none focus:border-brand-orange focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white text-gray-600 hover:text-brand-orange transition-all active:scale-95 shrink-0 shadow-xs"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-brand-orange' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Key Metrics & Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered */}
        <div 
          onClick={() => { setActiveTab('ALL'); setStatusFilter('ALL') }}
          className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeTab === 'ALL' ? 'border-brand-orange ring-2 ring-brand-orange/10' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Users</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-brand-charcoal mt-1 block">{stats.total}</span>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">All registered accounts</span>
        </div>

        {/* Retail Users */}
        <div 
          onClick={() => { setActiveTab('RETAIL'); setStatusFilter('ALL') }}
          className={`bg-emerald-50/60 p-5 rounded-3xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeTab === 'RETAIL' ? 'border-emerald-500 ring-2 ring-emerald-500/15' : 'border-emerald-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Retail Consumers</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1 block">{stats.retailCount}</span>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">Households & direct buyers</span>
        </div>

        {/* B2B Business Accounts */}
        <div 
          onClick={() => { setActiveTab('B2B'); setStatusFilter('ALL') }}
          className={`bg-purple-50/60 p-5 rounded-3xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeTab === 'B2B' ? 'border-purple-500 ring-2 ring-purple-500/15' : 'border-purple-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">B2B Partners</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-purple-900 mt-1 block">{stats.b2bCount}</span>
          <span className="text-[11px] text-purple-700 font-medium mt-1 block">Hotels, Cafes & Caterers</span>
        </div>

        {/* Credit Allocated */}
        <div className="bg-amber-50/60 p-5 rounded-3xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">B2B Credit Line</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-900 mt-1 block">₹{stats.creditAllocated.toLocaleString('en-IN')}</span>
          <div className="flex items-center gap-1.5 mt-1">
            {stats.pendingB2bCount > 0 ? (
              <span className="text-[11px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                ⚠️ {stats.pendingB2bCount} pending approval
              </span>
            ) : (
              <span className="text-[11px] text-amber-700 font-medium">All applications reviewed</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Primary Category Tabs & Secondary Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        {/* Main Segmented Switcher */}
        <div className="flex items-center gap-1.5 bg-gray-200/70 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-brand-charcoal shadow-sm'
                : 'text-gray-600 hover:text-brand-charcoal'
            }`}
          >
            All Accounts ({stats.total})
          </button>

          <button
            onClick={() => setActiveTab('RETAIL')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'RETAIL'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-gray-600 hover:text-emerald-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Retail Users ({stats.retailCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('B2B')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'B2B'
                ? 'bg-white text-purple-900 shadow-sm'
                : 'text-gray-600 hover:text-purple-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Business (B2B) ({stats.b2bCount})</span>
          </button>

          {stats.pendingB2bCount > 0 && (
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-700 bg-amber-100 hover:bg-amber-200'
              }`}
            >
              <span>Pending Reviews ({stats.pendingB2bCount})</span>
            </button>
          )}
        </div>

        {/* Secondary Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-gray-200 text-xs font-bold text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-orange"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="DISABLED">Deactivated / Blocked</option>
            {activeTab !== 'RETAIL' && <option value="VERIFIED">Verified B2B</option>}
            {activeTab !== 'RETAIL' && <option value="PENDING">Pending Approval</option>}
          </select>
        </div>
      </div>

      {/* 4. Users Grid & Cards */}
      {isLoading ? (
        <div className="p-16 text-center text-gray-400 font-bold text-xs flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-orange border-t-transparent rounded-full animate-spin" />
          <span>Loading registered users...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 font-bold text-sm shadow-xs flex flex-col items-center gap-2">
          <Users className="w-8 h-8 text-gray-300 stroke-[1.5]" />
          <span>No registered accounts found matching your filter criteria.</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-brand-orange hover:underline font-bold mt-1"
            >
              Clear search query
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {users.map((user) => {
            const isB2B = user.isB2B
            const profile = user.businessProfile || {}
            const isCreditActive = Boolean(user.isCreditEnabled || profile.isCreditEnabled)
            const initials = (user.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            const primaryAddr = user.addresses?.[0]

            return (
              <div
                key={user.id}
                className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between gap-4 shadow-xs hover:shadow-md ${
                  !user.isActive ? 'border-rose-200 bg-rose-50/20' : 'border-gray-200/90 hover:border-brand-orange/40'
                }`}
              >
                {/* Card Top: Avatar, Name, Badges */}
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                      isB2B 
                        ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-black text-sm text-brand-charcoal truncate" title={user.name}>
                          {user.name || 'Anonymous User'}
                        </h3>
                        {user.role === 'ADMIN' && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.2 bg-red-100 text-red-700 rounded-full">
                            Admin
                          </span>
                        )}
                        {user.role === 'STAFF' && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.2 bg-blue-100 text-blue-700 rounded-full">
                            Staff
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 font-semibold truncate flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                        <span>{user.phone ? `+91 ${user.phone}` : 'No phone linked'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Account Type Pill */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {isB2B ? (
                      <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[9px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>B2B Partner</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" />
                        <span>Retail</span>
                      </span>
                    )}

                    {/* Active / Blocked status */}
                    {!user.isActive && (
                      <span className="bg-rose-100 text-rose-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                        Blocked
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Middle: Attributes & Commercial Details */}
                <div className="flex flex-col gap-2.5 text-xs">
                  {/* Email & Auth info */}
                  {user.email && (
                    <div className="flex items-center gap-1.5 text-gray-600 text-[11px] truncate">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{user.email}</span>
                      {user.authProvider === 'GOOGLE' && (
                        <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded shrink-0">
                          Google
                        </span>
                      )}
                    </div>
                  )}

                  {/* B2B Commercial Fields */}
                  {isB2B && (
                    <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-100 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-purple-800 uppercase">Commercial Entity</span>
                        <span className="text-[10px] font-black text-purple-900">{profile.businessType || 'COMMERCIAL'}</span>
                      </div>
                      <p className="font-black text-purple-950 text-xs truncate">
                        {user.businessName || profile.businessName || 'Business Name Pending'}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-1 pt-1.5 border-t border-purple-200/50 text-[10px]">
                        <div>
                          <span className="text-gray-400 font-bold block">GSTIN:</span>
                          <span className="font-mono font-bold text-gray-700">{profile.gstin || 'None'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold block">Credit Line:</span>
                          <span className={`font-mono font-bold ${isCreditActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                            {isCreditActive ? `₹${user.creditLimit}` : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Retail details */}
                  {!isB2B && primaryAddr && (
                    <div className="flex items-start gap-1.5 text-gray-600 text-[11px] bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {primaryAddr.addressLine1}, {primaryAddr.city} - {primaryAddr.pincode}
                      </span>
                    </div>
                  )}

                  {/* Metadata: Orders placed & Joined date */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                    </span>

                    <Link
                      href={`/admin/orders?q=${encodeURIComponent(user.phone || user.name || '')}`}
                      className="font-black text-brand-orange hover:underline flex items-center gap-0.5"
                    >
                      <span>{user._count?.orders || 0} Orders</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Card Bottom: Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  {/* Active / Block Toggle */}
                  <button
                    onClick={() => toggleActiveMutation.mutate(user.id)}
                    disabled={toggleActiveMutation.isPending}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1 ${
                      user.isActive 
                        ? 'bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600' 
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                    }`}
                    title={user.isActive ? 'Click to block account' : 'Click to activate account'}
                  >
                    {user.isActive ? (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span>Deactivate</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>

                  {/* Edit / Manage Modal Trigger */}
                  <button
                    onClick={() => handleOpenEdit(user)}
                    className="px-4 py-1.5 bg-brand-charcoal hover:bg-black text-white rounded-xl text-[11px] font-black transition-all active:scale-95 flex items-center gap-1.5 shadow-xs"
                  >
                    <Edit3 className="w-3 h-3 text-brand-orange" />
                    <span>Manage Account</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 5. EDIT & MANAGE ACCOUNT MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-gray-200 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-brand-charcoal">
                  Manage Account: {selectedUser.name}
                </h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  Phone: +91 {selectedUser.phone || 'N/A'} • {selectedUser.email || 'No email'}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Account Classification Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-700">Account Classification</label>
              <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setEditIsB2B(false)}
                  className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    !editIsB2B 
                      ? 'bg-white text-emerald-800 shadow-xs' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Retail Customer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditIsB2B(true)}
                  className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    editIsB2B 
                      ? 'bg-purple-700 text-white shadow-xs' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>B2B Commercial</span>
                </button>
              </div>
            </div>

            {/* B2B Commercial Fields (Rendered only if B2B selected) */}
            {editIsB2B && (
              <div className="bg-purple-50/70 rounded-2xl p-4 border border-purple-200/80 flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider">
                  Commercial Credentials & Verification
                </span>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Business Name</label>
                  <input
                    type="text"
                    value={editBusinessName}
                    onChange={(e) => setEditBusinessName(e.target.value)}
                    placeholder="e.g. Grand Hotel Latur / Musfir Cafe"
                    className="w-full bg-white border border-gray-200 text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Business Type</label>
                    <select
                      value={editBusinessType}
                      onChange={(e) => setEditBusinessType(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-purple-600"
                    >
                      <option value="HOTEL">Hotel / Resort</option>
                      <option value="CAFE">Cafe / Fast Food</option>
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="CATERER">Event Caterer</option>
                      <option value="RETAILER">Grocery / Supermarket</option>
                      <option value="OTHER">Other Business</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={editGstin}
                      onChange={(e) => setEditGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      className="w-full bg-white border border-gray-200 text-xs rounded-xl px-3 py-2 font-mono font-bold focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-200/70 flex flex-col gap-2.5">
                  <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider">
                    Credit Facility & Tier Limits
                  </span>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-xs font-black text-gray-900 block">Credit Account Facility</span>
                      <span className="text-[10px] text-gray-500 font-medium">Allow placing orders on credit</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditCreditEnabled(!editCreditEnabled)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        editCreditEnabled 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {editCreditEnabled ? '✓ Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Credit Limit (₹)</label>
                      <input
                        type="number"
                        value={editCreditLimit}
                        onChange={(e) => setEditCreditLimit(Number(e.target.value))}
                        step="5000"
                        className="w-full bg-white border border-gray-200 text-xs rounded-xl px-3 py-2 font-mono font-bold focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Verification Status</label>
                      <select
                        value={editVerificationStatus}
                        onChange={(e) => setEditVerificationStatus(e.target.value as any)}
                        className="w-full bg-white border border-gray-200 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-purple-600"
                      >
                        <option value="VERIFIED">Verified & Active</option>
                        <option value="PENDING">Pending Review</option>
                        <option value="REJECTED">Declined / Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveModal}
                disabled={toggleB2bMutation.isPending || verifyB2bMutation.isPending || toggleCreditMutation.isPending}
                className="px-5 py-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
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
