'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Users, Building2, ShoppingBag, Search, RefreshCw, UserCheck, UserX,
  CreditCard, Calendar, Trash2, Plus, Phone, Mail, Edit3, X, ChevronRight, AlertTriangle
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

  // Edit Modal Form State
  const [editName, setEditName] = useState<string>('')
  const [editPhone, setEditPhone] = useState<string>('')
  const [editEmail, setEditEmail] = useState<string>('')
  const [editIsB2B, setEditIsB2B] = useState<boolean>(false)
  const [editBusinessName, setEditBusinessName] = useState<string>('')
  const [editBusinessType, setEditBusinessType] = useState<string>('HOTEL')
  const [editGstin, setEditGstin] = useState<string>('')
  const [editCreditLimit, setEditCreditLimit] = useState<number>(25000)
  const [editCreditTier, setEditCreditTier] = useState<'BRONZE' | 'SILVER' | 'GOLD'>('BRONZE')
  const [editCreditEnabled, setEditCreditEnabled] = useState<boolean>(false)
  const [editVerificationStatus, setEditVerificationStatus] = useState<'PENDING' | 'VERIFIED' | 'REJECTED'>('VERIFIED')

  // Create User Modal Form State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [createName, setCreateName] = useState<string>('')
  const [createPhone, setCreatePhone] = useState<string>('')
  const [createEmail, setCreateEmail] = useState<string>('')
  const [createRole, setCreateRole] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER')
  const [createIsB2B, setCreateIsB2B] = useState<boolean>(false)

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
    },
    onError: (err: any) => {
      showToast(err.message || 'Action failed', 'error')
    }
  })

  // Update basic user info
  const updateUserInfoMutation = useMutation({
    mutationFn: async ({ userId, name, phone, email }: any) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email })
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Failed to update user info')
      return resData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Action failed', 'error')
    }
  })

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Failed to delete user')
      return resData
    },
    onSuccess: () => {
      showToast('User deleted successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete user', 'error')
    }
  })

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Failed to create user')
      return resData
    },
    onSuccess: () => {
      showToast('User created successfully', 'success')
      setShowCreateModal(false)
      // Reset form
      setCreateName('')
      setCreatePhone('')
      setCreateEmail('')
      setCreateRole('CUSTOMER')
      setCreateIsB2B(false)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create user', 'error')
    }
  })

  // Open modal with user data
  const handleOpenEdit = (user: any) => {
    setSelectedUser(user)
    setEditName(user.name || '')
    setEditPhone(user.phone || '')
    setEditEmail(user.email || '')
    setEditIsB2B(user.isB2B)
    setEditBusinessName(user.businessName || user.businessProfile?.businessName || '')
    setEditBusinessType(user.businessProfile?.businessType || 'HOTEL')
    setEditGstin(user.businessProfile?.gstin || '')
    setEditCreditLimit(user.creditLimit || 25000)
    setEditCreditTier(user.businessProfile?.creditTier || 'BRONZE')
    setEditCreditEnabled(Boolean(user.isCreditEnabled || user.businessProfile?.isCreditEnabled))
    setEditVerificationStatus(user.businessProfile?.verificationStatus || 'VERIFIED')
  }

  // Save Edit Modal Changes
  const handleSaveModal = async () => {
    if (!selectedUser) return

    try {
      // 1. Update basic info if changed
      if (editName !== selectedUser.name || editPhone !== selectedUser.phone || editEmail !== selectedUser.email) {
        await updateUserInfoMutation.mutateAsync({
          userId: selectedUser.id,
          name: editName,
          phone: editPhone,
          email: editEmail
        })
      }

      // 2. Update B2B flag & commercial details if changed
      if (editIsB2B !== selectedUser.isB2B || editBusinessName !== selectedUser.businessName) {
        await toggleB2bMutation.mutateAsync({
          userId: selectedUser.id,
          isB2B: editIsB2B,
          businessName: editBusinessName,
          businessType: editBusinessType,
          gstin: editGstin
        })
      }

      // 3. If B2B, update verification and credit terms
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

  // Handle Delete
  const handleDelete = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      deleteMutation.mutate(userId)
    }
  }

  // Handle Create User Submit
  const handleCreateUser = () => {
    if (!createName || !createPhone) {
      showToast('Name and phone are required', 'error')
      return
    }
    if (createPhone.length !== 10) {
      showToast('Phone must be 10 digits', 'error')
      return
    }
    createMutation.mutate({
      name: createName,
      phone: createPhone,
      email: createEmail,
      role: createRole,
      isB2B: createIsB2B
    })
  }

  return (
    <div className="flex flex-col gap-6 font-sans bg-slate-50 min-h-full p-2">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users & Accounts</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage your retail consumers, commercial partners, and internal staff.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create User</span>
        </button>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div 
          onClick={() => { setActiveTab('ALL'); setStatusFilter('ALL') }}
          className={`bg-white p-5 rounded-2xl border-l-4 border-l-amber-500 border-y border-r border-slate-200/80 shadow-sm cursor-pointer transition-all hover:shadow-md ${
            activeTab === 'ALL' ? 'ring-2 ring-amber-500/20' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg"><Users className="w-5 h-5 text-amber-600" /></div>
          </div>
        </div>

        {/* Retail */}
        <div 
          onClick={() => { setActiveTab('RETAIL'); setStatusFilter('ALL') }}
          className={`bg-white p-5 rounded-2xl border-l-4 border-l-emerald-500 border-y border-r border-slate-200/80 shadow-sm cursor-pointer transition-all hover:shadow-md ${
            activeTab === 'RETAIL' ? 'ring-2 ring-emerald-500/20' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Retail</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.retailCount}</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg"><ShoppingBag className="w-5 h-5 text-emerald-600" /></div>
          </div>
        </div>

        {/* B2B */}
        <div 
          onClick={() => { setActiveTab('B2B'); setStatusFilter('ALL') }}
          className={`bg-white p-5 rounded-2xl border-l-4 border-l-violet-500 border-y border-r border-slate-200/80 shadow-sm cursor-pointer transition-all hover:shadow-md ${
            activeTab === 'B2B' ? 'ring-2 ring-violet-500/20' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">B2B Partners</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.b2bCount}</h3>
            </div>
            <div className="p-2 bg-violet-50 rounded-lg"><Building2 className="w-5 h-5 text-violet-600" /></div>
          </div>
        </div>

        {/* Credit */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-l-blue-500 border-y border-r border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Credit Active</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">₹{(stats.creditAllocated || 0).toLocaleString('en-IN')}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg"><CreditCard className="w-5 h-5 text-blue-600" /></div>
          </div>
          {stats.pendingB2bCount > 0 && (
            <p className="text-xs text-amber-600 font-medium mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {stats.pendingB2bCount} pending approvals
            </p>
          )}
        </div>
      </div>

      {/* 3. Controls: Search, Tabs, Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, email, GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('RETAIL')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'RETAIL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Retail
            </button>
            <button
              onClick={() => setActiveTab('B2B')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'B2B' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              B2B
            </button>
            {stats.pendingB2bCount > 0 && (
              <button
                onClick={() => setActiveTab('PENDING')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'PENDING' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Pending
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Blocked</option>
            {activeTab !== 'RETAIL' && <option value="VERIFIED">Verified B2B</option>}
            {activeTab !== 'RETAIL' && <option value="PENDING">Pending Approval</option>}
          </select>

          <button onClick={() => refetch()} disabled={isFetching} className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Data Table */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                      <span className="text-sm font-medium">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <Users className="w-8 h-8 text-slate-300" />
                      <span className="text-sm font-medium">No users found matching your criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isB2B = user.isB2B
                  const initials = (user.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Avatar + Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isB2B ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-slate-900 truncate">
                              {user.name || 'Anonymous User'}
                            </span>
                            {user.role === 'ADMIN' && <span className="text-[10px] font-bold text-rose-600">ADMIN</span>}
                            {user.role === 'STAFF' && <span className="text-[10px] font-bold text-blue-600">STAFF</span>}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4">
                        {isB2B ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md w-fit">
                              <Building2 className="w-3 h-3" /> B2B
                            </span>
                            {user.businessName && (
                              <span className="text-xs text-slate-500 mt-1 truncate max-w-[120px]">{user.businessName}</span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <ShoppingBag className="w-3 h-3" /> Retail
                          </span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 text-xs text-slate-600">
                          {user.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> +91 {user.phone}</div>}
                          {user.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> <span className="truncate max-w-[120px]">{user.email}</span></div>}
                        </div>
                      </td>

                      {/* Orders */}
                      <td className="px-5 py-4">
                        <Link href={`/admin/orders?q=${encodeURIComponent(user.phone || user.name || '')}`} className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 hover:text-amber-700">
                          {user._count?.orders || 0} <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <button
                            onClick={() => toggleActiveMutation.mutate(user.id)}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md uppercase transition-colors ${
                              user.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            }`}
                          >
                            {user.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            {user.isActive ? 'Active' : 'Blocked'}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id, user.name || 'User')}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. EDIT USER MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-lg text-slate-900">Edit User Account</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 flex flex-col gap-6">
              
              {/* Basic Info */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                    <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                  </div>
                </div>
              </div>

              {/* Account Type */}
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Account Type</h4>
                <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-fit">
                  <button onClick={() => setEditIsB2B(false)} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${!editIsB2B ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>
                    <ShoppingBag className="w-4 h-4" /> Retail
                  </button>
                  <button onClick={() => setEditIsB2B(true)} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${editIsB2B ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'}`}>
                    <Building2 className="w-4 h-4" /> B2B Commercial
                  </button>
                </div>
              </div>

              {/* B2B Details */}
              {editIsB2B && (
                <div className="border-t border-slate-100 pt-5 flex flex-col gap-5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Commercial Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business Name</label>
                        <input type="text" value={editBusinessName} onChange={(e) => setEditBusinessName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">GSTIN Number</label>
                        <input type="text" value={editGstin} onChange={(e) => setEditGstin(e.target.value.toUpperCase())} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business Type</label>
                        <select value={editBusinessType} onChange={(e) => setEditBusinessType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                          <option value="HOTEL">Hotel / Resort</option>
                          <option value="CAFE">Cafe / Fast Food</option>
                          <option value="RESTAURANT">Restaurant</option>
                          <option value="CATERER">Event Caterer</option>
                          <option value="RETAILER">Grocery / Supermarket</option>
                          <option value="OTHER">Other Business</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Verification Status</label>
                        <select value={editVerificationStatus} onChange={(e) => setEditVerificationStatus(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                          <option value="VERIFIED">Verified</option>
                          <option value="PENDING">Pending</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Credit Settings</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Credit Facility</label>
                        <button
                          type="button"
                          onClick={() => setEditCreditEnabled(!editCreditEnabled)}
                          className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${
                            editCreditEnabled ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {editCreditEnabled ? 'Credit Enabled' : 'Credit Disabled'}
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Credit Limit (₹)</label>
                        <input type="number" step="1000" value={editCreditLimit} onChange={(e) => setEditCreditLimit(Number(e.target.value))} disabled={!editCreditEnabled} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setSelectedUser(null)} className="px-5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSaveModal} className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm transition-colors">Save Changes</button>
            </div>

          </div>
        </div>
      )}

      {/* 6. CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl flex flex-col">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Create New User</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
                <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" placeholder="e.g. Rahul Sharma" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number (10-digit) *</label>
                <input type="text" maxLength={10} value={createPhone} onChange={(e) => setCreatePhone(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" placeholder="9876543210" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address (Optional)</label>
                <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" placeholder="rahul@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role</label>
                  <select value={createRole} onChange={(e) => setCreateRole(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                    <option value="CUSTOMER">Customer</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Account Type</label>
                  <select value={createIsB2B ? 'B2B' : 'RETAIL'} onChange={(e) => setCreateIsB2B(e.target.value === 'B2B')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                    <option value="RETAIL">Retail</option>
                    <option value="B2B">B2B Commercial</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleCreateUser} disabled={createMutation.isPending} className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm transition-colors disabled:opacity-50">Create User</button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
