'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Users, Building2, ShoppingBag, Search, RefreshCw, UserCheck, UserX,
  CreditCard, Calendar, Trash2, Plus, Phone, Mail, Edit3, X, ChevronRight, AlertTriangle,
  Printer, Clock, DollarSign, CheckCircle2, Eye, Package, ShieldCheck
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

  // Selected user for Orders History Modal Popup (No page redirect!)
  const [viewOrdersUser, setViewOrdersUser] = useState<any>(null)

  // Edit Modal Form State
  const [editName, setEditName] = useState<string>('')
  const [editPhone, setEditPhone] = useState<string>('')
  const [editEmail, setEditEmail] = useState<string>('')
  const [editPassword, setEditPassword] = useState<string>('')
  const [editRole, setEditRole] = useState<'CUSTOMER' | 'STAFF' | 'ADMIN'>('CUSTOMER')
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
  const [createPassword, setCreatePassword] = useState<string>('')
  const [createRole, setCreateRole] = useState<'CUSTOMER' | 'STAFF' | 'ADMIN'>('CUSTOMER')
  const [createIsB2B, setCreateIsB2B] = useState<boolean>(false)

  // Fetch logged in admin / staff info
  const { data: meData } = useQuery({
    queryKey: ['admin-me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) return null
      return res.json()
    }
  })
  const currentUser = meData?.user
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'
  const isAdmin = currentUser?.role === 'ADMIN' || isSuperAdmin
  const isStaff = currentUser?.role === 'STAFF'

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

  // Query orders for selected user when Orders Modal is opened
  const { data: userOrdersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['admin-user-orders', viewOrdersUser?.id],
    queryFn: async () => {
      if (!viewOrdersUser?.id) return null
      const res = await fetch(`/api/admin/users/${viewOrdersUser.id}/orders`)
      if (!res.ok) throw new Error('Failed to fetch user orders')
      return res.json()
    },
    enabled: Boolean(viewOrdersUser?.id)
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
      const res = await fetch(`/api/admin/users/${userId}/toggle-active`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
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

  // Update basic user info & password
  const updateUserInfoMutation = useMutation({
    mutationFn: async ({ userId, name, phone, email, role, password }: any) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, role, password: password || undefined })
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Failed to update user info')
      return resData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setEditPassword('')
    },
    onError: (err: any) => {
      showToast(err.message || 'Action failed', 'error')
    }
  })

  // Delete User Mutation (includes Content-Type header to satisfy server CSRF filter)
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
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
    onSuccess: (data) => {
      showToast(data.message || 'User created successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setShowCreateModal(false)
      setCreateName('')
      setCreatePhone('')
      setCreateEmail('')
      setCreatePassword('')
      setCreateRole('CUSTOMER')
      setCreateIsB2B(false)
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create user', 'error')
    }
  })

  const handleDeleteUser = (user: any) => {
    if (confirm(`Are you sure you want to permanently delete user "${user.name || user.phone}"? This action cannot be undone.`)) {
      deleteMutation.mutate(user.id)
    }
  }

  const handleCreateUser = () => {
    if (!createName.trim()) {
      showToast('Name is required', 'error')
      return
    }
    if (!createPhone.trim() && !createEmail.trim()) {
      showToast('Please enter either a mobile number or an email address', 'error')
      return
    }
    if (createPhone.trim() && !/^\d{10}$/.test(createPhone.trim())) {
      showToast('Please enter a valid 10-digit mobile number', 'error')
      return
    }
    if ((createRole === 'STAFF' || createRole === 'ADMIN') && createPassword && createPassword.length < 6) {
      showToast('Password must be at least 6 characters for staff/admin accounts', 'error')
      return
    }
    createMutation.mutate({
      name: createName.trim(),
      phone: createPhone.trim() || undefined,
      email: createEmail.trim() || undefined,
      password: createPassword.trim() || undefined,
      role: createRole,
      isB2B: createIsB2B
    })
  }

  // Open modal with user data
  const handleOpenEdit = (user: any) => {
    setSelectedUser(user)
    setEditName(user.name || '')
    setEditPhone(user.phone || '')
    setEditEmail(user.email || '')
    setEditPassword('')
    setEditRole(user.role || 'CUSTOMER')
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
      // 1. Update basic info, role, and password if changed
      if (
        editName !== selectedUser.name || 
        editPhone !== selectedUser.phone || 
        editEmail !== (selectedUser.email || '') ||
        editRole !== selectedUser.role ||
        Boolean(editPassword.trim())
      ) {
        await updateUserInfoMutation.mutateAsync({
          userId: selectedUser.id,
          name: editName,
          phone: editPhone,
          email: editEmail,
          role: editRole,
          password: editPassword.trim() || undefined,
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

  // Status badge helper for customer orders popup
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-slate-100 text-slate-700'
      case 'CONFIRMED': return 'bg-blue-50 text-blue-700 border border-blue-200'
      case 'PACKING': return 'bg-amber-50 text-amber-700 border border-amber-200'
      case 'PACKED': return 'bg-purple-50 text-purple-700 border border-purple-200'
      case 'ASSIGNED': return 'bg-indigo-50 text-indigo-700 border border-indigo-200'
      case 'OUT_FOR_DELIVERY': return 'bg-orange-100 text-orange-800 border border-orange-200 animate-pulse'
      case 'DELIVERED': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 line-through'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="flex flex-col gap-6 font-sans text-white">
      
      {/* 1. Header Banner & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Registered Customers & B2B Accounts</h1>
          <p className="text-sm text-slate-400 mt-1">Manage verified retail consumers and commercial hotel/caterer partners.</p>
        </div>
        {!isStaff && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all active:scale-95 w-fit cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Customer</span>
          </button>
        )}
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-[#111625] p-5 rounded-2xl shadow-xl border border-slate-800/80 border-l-4 border-l-amber-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Customers</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.total}</h3>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-xl"><Users className="w-5 h-5 text-amber-400" /></div>
          </div>
          <span className="text-xs text-slate-500 mt-3 font-medium">All registered buyers</span>
        </div>

        {/* Retail */}
        <div className="bg-[#111625] p-5 rounded-2xl shadow-xl border border-slate-800/80 border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Retail</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.retailCount}</h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl"><ShoppingBag className="w-5 h-5 text-emerald-400" /></div>
          </div>
          <span className="text-xs text-slate-500 mt-3 font-medium">Households & direct buyers</span>
        </div>

        {/* B2B Partners */}
        <div className="bg-[#111625] p-5 rounded-2xl shadow-xl border border-slate-800/80 border-l-4 border-l-violet-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">B2B Partners</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.b2bCount}</h3>
            </div>
            <div className="p-2.5 bg-violet-500/10 rounded-xl"><Building2 className="w-5 h-5 text-violet-400" /></div>
          </div>
          <span className="text-xs text-slate-500 mt-3 font-medium">Hotels, Cafes & Caterers</span>
        </div>

        {/* Credit Allocated */}
        <div className="bg-[#111625] p-5 rounded-2xl shadow-xl border border-slate-800/80 border-l-4 border-l-blue-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Credit Active</p>
              <h3 className="text-2xl font-bold text-white mt-1">₹{(stats.creditAllocated || 0).toLocaleString('en-IN')}</h3>
            </div>
            <div className="p-2.5 bg-blue-500/10 rounded-xl"><CreditCard className="w-5 h-5 text-blue-400" /></div>
          </div>
          {stats.pendingB2bCount > 0 ? (
            <p className="text-xs text-amber-400 font-medium mt-3 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {stats.pendingB2bCount} pending approval
            </p>
          ) : (
            <span className="text-xs text-slate-500 mt-3 font-medium">All applications reviewed</span>
          )}
        </div>
      </div>

      {/* 3. Controls: Search, Tabs, Filters */}
      <div className="bg-[#111625] p-4 rounded-2xl shadow-xl border border-slate-800/80 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, phone, email, GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-[#0B0F19] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#0B0F19] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'ALL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('RETAIL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'RETAIL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              Retail
            </button>
            <button
              onClick={() => setActiveTab('B2B')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'B2B' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              B2B
            </button>
            {stats.pendingB2bCount > 0 && (
              <button
                onClick={() => setActiveTab('PENDING')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'PENDING' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'}`}
              >
                Pending ({stats.pendingB2bCount})
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#0B0F19] border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Blocked</option>
            {activeTab !== 'RETAIL' && <option value="VERIFIED">Verified B2B</option>}
            {activeTab !== 'RETAIL' && <option value="PENDING">Pending Approval</option>}
          </select>

          <button onClick={() => refetch()} disabled={isFetching} className="p-2 bg-[#0B0F19] border border-slate-800 rounded-xl hover:bg-slate-800/60 transition-colors" title="Reload list">
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Data Table with Sticky Header & Vertical Scrolling */}
      <div className="bg-[#111625] border border-slate-800/80 shadow-xl rounded-2xl overflow-hidden">
        {/* Scrollable viewport with maximum height */}
        <div className="overflow-x-auto max-h-[calc(100vh-320px)] min-h-[350px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#0E1320] border-b border-slate-800 z-10">
              <tr>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Orders</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Loading registered customers...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-medium text-slate-400">No customers found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isB2B = user.isB2B
                  const initials = (user.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* User Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            isB2B ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-white leading-none">{user.name}</span>
                              {user.role === 'SUPER_ADMIN' && <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-amber-500/30">Super Admin</span>}
                              {user.role === 'ADMIN' && <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-500/30">Admin</span>}
                              {user.role === 'STAFF' && <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30">Staff</span>}
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">ID: {user.id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4">
                        {isB2B ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/30 px-2 py-0.5 rounded-md w-fit">
                              <Building2 className="w-3 h-3" /> B2B
                            </span>
                            {user.businessName && (
                              <span className="text-xs text-slate-400 mt-1 truncate max-w-[120px] font-medium">{user.businessName}</span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                            <ShoppingBag className="w-3 h-3" /> Retail
                          </span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 text-xs text-slate-300">
                          {user.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span className="font-mono text-slate-300">+91 {user.phone}</span>
                            </div>
                          )}
                          {user.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span className="truncate max-w-[140px] text-slate-400">{user.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Orders — Opens Customer Orders Modal Popup (No page redirect!) */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setViewOrdersUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B0F19] hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 rounded-lg text-xs font-bold border border-slate-800 hover:border-amber-500/40 transition-all active:scale-95 group cursor-pointer"
                          title={`View ${user.name}'s orders`}
                        >
                          <span className="font-extrabold text-amber-400">{user._count?.orders || 0}</span>
                          <span className="text-[11px] font-medium text-slate-400 group-hover:text-amber-300">Orders</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                        </button>
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-4 text-xs font-medium text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {isStaff ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                              user.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {user.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            {user.isActive ? 'Active' : 'Blocked'}
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleActiveMutation.mutate(user.id)}
                            disabled={user.role === 'SUPER_ADMIN' || (user.role === 'ADMIN' && !isSuperAdmin)}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md uppercase transition-colors ${
                              user.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                            title={user.role === 'SUPER_ADMIN' ? 'Super Admin cannot be blocked' : (user.role === 'ADMIN' && !isSuperAdmin) ? 'Only Super Admin can block Admins' : 'Toggle status'}
                          >
                            {user.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            {user.isActive ? 'Active' : 'Blocked'}
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        {!isStaff ? (
                          <div className="inline-flex items-center gap-1 justify-end">
                            {(isSuperAdmin || (user.role !== 'SUPER_ADMIN' && (user.role !== 'ADMIN' || currentUser?.id === user.id))) && (
                              <button
                                onClick={() => handleOpenEdit(user)}
                                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-[#0B0F19] border border-transparent hover:border-slate-800 rounded-lg transition-colors"
                                title="Manage Account"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {user.role !== 'SUPER_ADMIN' && (user.role !== 'ADMIN' || isSuperAdmin) && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={deleteMutation.isPending}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#0B0F19] border border-transparent hover:border-rose-900/40 rounded-lg transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium italic">Read-only</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CUSTOMER RECENT ORDERS POPUP MODAL (View Orders without leaving page) */}
      {viewOrdersUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#111625] rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[88vh] overflow-hidden border border-slate-800">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
                  viewOrdersUser.isB2B ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {(viewOrdersUser.name || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white">{viewOrdersUser.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      viewOrdersUser.isB2B ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {viewOrdersUser.isB2B ? 'B2B Partner' : 'Retail'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    📞 +91 {viewOrdersUser.phone || 'N/A'} {viewOrdersUser.email ? `• ${viewOrdersUser.email}` : ''}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setViewOrdersUser(null)}
                className="w-8 h-8 rounded-full bg-[#0B0F19] hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm border border-slate-800 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#0B0F19] p-3 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Orders</span>
                <span className="text-base font-extrabold text-white mt-0.5 block">
                  {userOrdersData?.totalOrders ?? (viewOrdersUser._count?.orders || 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Spent</span>
                <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">
                  ₹{(userOrdersData?.totalSpent || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Customer Since</span>
                <span className="text-xs font-semibold text-slate-300 mt-1 block">
                  {new Date(viewOrdersUser.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Orders List Container */}
            <div className="overflow-y-auto max-h-[50vh] pr-1 flex flex-col gap-3">
              {isLoadingOrders ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-slate-400">Loading orders history...</span>
                </div>
              ) : !userOrdersData?.orders || userOrdersData.orders.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="text-xs font-medium text-slate-400">No orders recorded for this customer yet.</p>
                </div>
              ) : (
                userOrdersData.orders.map((order: any) => {
                  const paymentText = order.paymentMethod === 'CASH_ON_DELIVERY' 
                    ? '💵 Cash on Delivery' 
                    : order.paymentMethod === 'CREDIT_ACCOUNT' 
                    ? '💼 B2B Credit' 
                    : '💳 Paid Online'

                  return (
                    <div 
                      key={order.id}
                      className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 hover:border-amber-500/40 transition-colors"
                    >
                      {/* Top Order Row: ID, Date, Amount, Status */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white">#{order.orderNumber}</span>
                          <span className="text-slate-600 text-xs">•</span>
                          <span className="text-xs text-slate-400 font-medium">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })} at {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getOrderStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                          <span className="text-sm font-black text-white">
                            ₹{order.totalAmount}
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="bg-[#111625] p-2.5 rounded-xl border border-slate-800/80 flex flex-col gap-1 text-xs">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-slate-300">
                            <span className="font-medium truncate max-w-[320px]">
                              <strong className="text-white">{item.quantity}×</strong> {item.productName} ({item.packagingType})
                            </span>
                            <span className="font-semibold text-white">₹{item.lineTotal || (item.unitPrice * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Footer Row: Payment method, Delivery info, Print Bill */}
                      <div className="flex items-center justify-between pt-1 text-xs gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                            {paymentText}
                          </span>
                          {order.driver && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              🚚 {order.driver.name}
                            </span>
                          )}
                        </div>

                        {/* Print Bill Action Button */}
                        <a
                          href={`/admin/orders/${order.id}/invoice`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95"
                          title="Print Tax Invoice / Bill"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Print Bill</span>
                        </a>
                      </div>

                    </div>
                  )
                })
              )}
            </div>

            {/* Modal Bottom Close */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewOrdersUser(null)}
                className="px-5 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. EDIT USER & COMMERCIAL ACCOUNT MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111625] rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto border border-slate-800">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-lg text-white">Manage Account: {selectedUser.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Phone: +91 {selectedUser.phone || 'N/A'} • {selectedUser.email || 'No email'}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Basic Information</p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-[#0B0F19] border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input type="text" maxLength={10} value={editPhone} onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))} className="w-full bg-[#0B0F19] border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full bg-[#0B0F19] border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                </div>
              </div>

              {/* Password Reset Field (Only for Admin / Super Admin managing staff/users) */}
              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reset Password (leave empty to keep current password)
                  </label>
                  <input 
                    type="password" 
                    value={editPassword} 
                    onChange={(e) => setEditPassword(e.target.value)} 
                    placeholder="Enter new password (min. 6 chars)" 
                    className="w-full bg-[#0B0F19] border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-500" 
                  />
                </div>
              )}

              {/* Role Management */}
              {isAdmin && selectedUser.role !== 'SUPER_ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full bg-[#0B0F19] border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
                  >
                    <option value="CUSTOMER">Customer (Retail / B2B)</option>
                    <option value="STAFF">Staff (Dispatch Manager)</option>
                    {isSuperAdmin && <option value="ADMIN">Admin (Full Access)</option>}
                  </select>
                </div>
              )}
            </div>

            {/* Account Classification */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Classification</p>
              <div className="grid grid-cols-2 gap-2 bg-[#0B0F19] p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditIsB2B(false)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${!editIsB2B ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Retail Customer
                </button>
                <button
                  type="button"
                  onClick={() => setEditIsB2B(true)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${editIsB2B ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  <Building2 className="w-3.5 h-3.5" /> B2B Commercial
                </button>
              </div>
            </div>

            {/* B2B Commercial Fields */}
            {editIsB2B && (
              <div className="bg-[#0B0F19] rounded-xl p-4 border border-violet-500/20 flex flex-col gap-3">
                <p className="text-xs font-bold text-violet-300 uppercase tracking-wider">Commercial Credentials</p>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Business Name</label>
                  <input type="text" value={editBusinessName} onChange={(e) => setEditBusinessName(e.target.value)} placeholder="e.g. Grand Hotel Latur" className="w-full bg-[#111625] border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 placeholder-slate-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Business Type</label>
                    <select value={editBusinessType} onChange={(e) => setEditBusinessType(e.target.value)} className="w-full bg-[#111625] border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 font-medium">
                      <option value="HOTEL">Hotel / Resort</option>
                      <option value="CAFE">Cafe / Fast Food</option>
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="CATERER">Caterer</option>
                      <option value="RETAILER">Grocery / Supermarket</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">GSTIN Number</label>
                    <input type="text" value={editGstin} onChange={(e) => setEditGstin(e.target.value.toUpperCase())} placeholder="27AAAAA0000A1Z5" className="w-full bg-[#111625] border border-slate-800 text-white rounded-xl px-3 py-2 text-sm uppercase focus:outline-none focus:border-violet-500 placeholder-slate-500" />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Credit Account Facility</p>
                      <p className="text-[11px] text-slate-400">Allow placing orders on credit</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditCreditEnabled(!editCreditEnabled)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${editCreditEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                    >
                      {editCreditEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Credit Limit (₹)</label>
                      <input type="number" value={editCreditLimit} onChange={(e) => setEditCreditLimit(Number(e.target.value))} step="5000" className="w-full bg-[#111625] border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                      <select value={editVerificationStatus} onChange={(e) => setEditVerificationStatus(e.target.value as any)} className="w-full bg-[#111625] border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 font-medium">
                        <option value="VERIFIED">Verified</option>
                        <option value="PENDING">Pending Review</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setSelectedUser(null)} className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button type="button" onClick={handleSaveModal} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95">Save Changes</button>
            </div>

          </div>
        </div>
      )}

      {/* 7. CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111625] rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col border border-slate-800">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-lg text-white">Create New Customer</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
                <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} className="w-full bg-[#0B0F19] border border-slate-800 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" placeholder="e.g. Rahul Sharma" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number (10-digit, optional if Email provided)</label>
                <input type="text" maxLength={10} value={createPhone} onChange={(e) => setCreatePhone(e.target.value.replace(/\D/g, ''))} className="w-full bg-[#0B0F19] border border-slate-800 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" placeholder="9876543210" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address (optional if Phone provided)</label>
                <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} className="w-full bg-[#0B0F19] border border-slate-800 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" placeholder="rahul@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password (required for Staff / Admin, min. 6 chars)
                </label>
                <input 
                  type="password" 
                  value={createPassword} 
                  onChange={(e) => setCreatePassword(e.target.value)} 
                  className="w-full bg-[#0B0F19] border border-slate-800 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" 
                  placeholder="Set account login password" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role</label>
                  <select value={createRole} onChange={(e) => setCreateRole(e.target.value as any)} className="w-full bg-[#0B0F19] border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold">
                    <option value="CUSTOMER">Customer</option>
                    <option value="STAFF">Staff (Dispatch)</option>
                    {isSuperAdmin && <option value="ADMIN">Admin</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Type</label>
                  <select value={createIsB2B ? 'B2B' : 'RETAIL'} onChange={(e) => setCreateIsB2B(e.target.value === 'B2B')} className="w-full bg-[#0B0F19] border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                    <option value="RETAIL">Retail</option>
                    <option value="B2B">B2B Commercial</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-5 py-2 text-sm font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleCreateUser} disabled={createMutation.isPending} className="px-5 py-2 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50">Create Customer</button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
