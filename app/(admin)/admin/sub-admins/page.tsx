'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Check, 
  X, 
  ClipboardList, 
  Users, 
  Package, 
  BarChart3, 
  Truck, 
  Power,
  Mail,
  Phone,
  Lock,
  UserCheck,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface StaffMember {
  id: string
  name: string
  phone: string
  email: string | null
  role: 'ADMIN' | 'STAFF'
  permissions: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// The core 5 business modules available for delegation
const AVAILABLE_PERMISSIONS = [
  { id: 'orders', label: 'Orders Dispatch', icon: ClipboardList, desc: 'Manage orders, accept & dispatch' },
  { id: 'users', label: 'Registered Users', icon: Users, desc: 'View B2B & retail clients, credit limits' },
  { id: 'products', label: 'Product List', icon: Package, desc: 'Catalog, pricing, units & stock visibility' },
  { id: 'inventory', label: 'Inventory Manager', icon: BarChart3, desc: 'Stock in/out, returns & batches' },
  { id: 'drivers', label: 'Driver List', icon: Truck, desc: 'Delivery partner profiles & fleet' },
]

export default function SubAdminsPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'STAFF' | 'ADMIN'>('STAFF')
  const [newPermissions, setNewPermissions] = useState<string[]>(['orders', 'inventory'])

  // Local permissions editing state per user (userId -> string[])
  const [userPermsDraft, setUserPermsDraft] = useState<Record<string, string[]>>({})
  const [savingUserId, setSavingUserId] = useState<string | null>(null)

  // 1. Fetch Sub-Admins / Staff
  const { data, isLoading, error } = useQuery({
    queryKey: ['sub-admins'],
    queryFn: async () => {
      const res = await fetch('/api/admin/sub-admins')
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to load sub-admin accounts')
      }
      return res.json() as Promise<{ staffMembers: StaffMember[] }>
    },
  })

  // 2. Mutation: Save Permissions
  const savePermsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      setSavingUserId(userId)
      const res = await fetch(`/api/admin/sub-admins/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to update permissions')
      }
      return res.json()
    },
    onSuccess: (resData, vars) => {
      showToast(resData.message || 'Permissions updated successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['sub-admins'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      // Clear draft for this user so it syncs with remote
      setUserPermsDraft((prev) => {
        const copy = { ...prev }
        delete copy[vars.userId]
        return copy
      })
    },
    onError: (err: any) => {
      showToast(err.message || 'Error updating permissions', 'error')
    },
    onSettled: () => {
      setSavingUserId(null)
    },
  })

  // 3. Mutation: Toggle Status (Active / Disabled)
  const toggleStatusMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/sub-admins/${userId}/status`, {
        method: 'PUT',
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to toggle account status')
      }
      return res.json()
    },
    onSuccess: (resData) => {
      showToast(resData.message || 'Account status updated', 'success')
      queryClient.invalidateQueries({ queryKey: ['sub-admins'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Error updating account status', 'error')
    },
  })

  // 4. Mutation: Delete Sub-Admin
  const deleteSubAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/sub-admins/${userId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to delete account')
      }
      return res.json()
    },
    onSuccess: (resData) => {
      showToast(resData.message || 'Sub-admin deleted', 'success')
      queryClient.invalidateQueries({ queryKey: ['sub-admins'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Error deleting account', 'error')
    },
  })

  // 5. Mutation: Create Sub-Admin
  const createSubAdminMutation = useMutation({
    mutationFn: async (formData: any) => {
      const res = await fetch('/api/admin/sub-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to create sub-admin')
      }
      return res.json()
    },
    onSuccess: (resData) => {
      showToast(resData.message || 'Sub-admin account created!', 'success')
      setShowAddModal(false)
      setNewName('')
      setNewPhone('')
      setNewEmail('')
      setNewPassword('')
      setNewRole('STAFF')
      setNewPermissions(['orders', 'inventory'])
      queryClient.invalidateQueries({ queryKey: ['sub-admins'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create sub-admin', 'error')
    },
  })

  // Helper to toggle permission in draft state
  const handleTogglePerm = (userId: string, currentRemotePerms: string[], permId: string) => {
    const activePerms = userPermsDraft[userId] ?? currentRemotePerms
    const isSelected = activePerms.includes(permId)
    const updated = isSelected 
      ? activePerms.filter((p) => p !== permId)
      : [...activePerms, permId]

    setUserPermsDraft((prev) => ({
      ...prev,
      [userId]: updated,
    }))
  }

  const handleToggleNewModalPerm = (permId: string) => {
    setNewPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    )
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return showToast('Please enter full name', 'error')
    if (!/^\d{10}$/.test(newPhone.trim())) return showToast('Phone must be 10 digits', 'error')
    if (newPassword.length < 6) return showToast('Password must be at least 6 characters', 'error')
    
    createSubAdminMutation.mutate({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      password: newPassword,
      role: newRole,
      permissions: newPermissions,
    })
  }

  const staffMembers = data?.staffMembers || []

  return (
    <div className="min-h-[85vh] -m-5 md:-m-7 p-6 md:p-8 bg-[#0B0F19] text-white">
      {/* Header Bar */}
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" />
          <span>Access Control</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Sub-Admin Management
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl">
          Manage counselor access accounts and granular tab permissions for your dispatch and branch operations.
        </p>

        {/* Action Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add New Sub-Admin</span>
        </button>
      </div>

      {/* Main Grid of Sub-Admin Cards */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Loading sub-admin accounts...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-center max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
            <p className="font-semibold">Failed to load sub-admins</p>
            <p className="text-xs text-rose-400 mt-1">{(error as any)?.message}</p>
          </div>
        ) : staffMembers.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl p-8 max-w-lg mx-auto bg-[#111625]/50">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Sub-Admins Yet</h3>
            <p className="text-slate-400 text-sm mb-6">
              Create your first sub-admin or dispatch manager account and assign tailored module access.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Sub-Admin</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {staffMembers.map((member) => {
              const currentDraftPerms = userPermsDraft[member.id] ?? member.permissions
              const isDirty = userPermsDraft[member.id] !== undefined && 
                JSON.stringify([...userPermsDraft[member.id]].sort()) !== JSON.stringify([...member.permissions].sort())
              const isSaving = savingUserId === member.id

              return (
                <div
                  key={member.id}
                  className="rounded-2xl bg-[#111625] border border-slate-800/80 p-6 flex flex-col justify-between shadow-xl hover:border-slate-700/80 transition-all relative overflow-hidden"
                >
                  {/* Subtle top indicator glow */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${member.isActive ? 'bg-amber-500/60' : 'bg-rose-500/40'}`} />

                  {/* Top: Profile Header & Actions */}
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Avatar & Info */}
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-[#1E2538] border border-slate-700 flex items-center justify-center text-amber-400 font-extrabold text-lg shadow-inner">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white tracking-wide">
                              {member.name}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                              {member.role === 'ADMIN' ? 'Sub-Admin' : 'Staff Manager'}
                            </span>
                          </div>
                          {member.email && (
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span className="truncate max-w-[200px]">{member.email}</span>
                            </p>
                          )}
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>+91 {member.phone}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Trash / Delete Action */}
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete sub-admin "${member.name}"? This action cannot be undone.`)) {
                            deleteSubAdminMutation.mutate(member.id)
                          }
                        }}
                        disabled={deleteSubAdminMutation.isPending}
                        className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Delete Sub-Admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Account Status Row */}
                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                          Account Status
                        </span>
                        <span className={`text-xs font-bold inline-flex items-center gap-1.5 mt-0.5 ${
                          member.isActive ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {member.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleStatusMutation.mutate(member.id)}
                        disabled={toggleStatusMutation.isPending}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          member.isActive
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {member.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>

                    {/* Tab Permissions Section */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Tab Permissions
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {currentDraftPerms.length} / {AVAILABLE_PERMISSIONS.length} Enabled
                        </span>
                      </div>

                      {/* 5-tile permission grid matching reference UI */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {AVAILABLE_PERMISSIONS.map((perm) => {
                          const Icon = perm.icon
                          const isEnabled = currentDraftPerms.includes(perm.id)

                          return (
                            <button
                              key={perm.id}
                              type="button"
                              onClick={() => handleTogglePerm(member.id, member.permissions, perm.id)}
                              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                                isEnabled
                                  ? 'bg-[#181F30] border-amber-500/80 shadow-md shadow-amber-500/5 text-amber-400'
                                  : 'bg-[#0E131F] border-slate-800 text-slate-500 hover:border-slate-700'
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${isEnabled ? 'text-amber-400' : 'text-slate-600'}`} />
                              <span className={`text-xs font-semibold leading-tight line-clamp-1 ${isEnabled ? 'text-slate-200' : 'text-slate-500'}`}>
                                {perm.label}
                              </span>
                              <div className="mt-0.5">
                                {isEnabled ? (
                                  <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                                ) : (
                                  <X className="w-3.5 h-3.5 text-slate-600" />
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Save Permissions CTA */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => savePermsMutation.mutate({ userId: member.id, permissions: currentDraftPerms })}
                      disabled={isSaving}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        isDirty
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.98]'
                          : 'bg-[#1A2234] text-slate-400 hover:bg-[#202940] hover:text-white border border-slate-700/60'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>{isDirty ? '✓ Save Changes' : '✓ Save Permissions'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add New Sub-Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111625] border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" />
                <span>New Access Account</span>
              </div>
              <h2 className="text-xl font-bold text-white">Create Sub-Admin / Staff</h2>
              <p className="text-xs text-slate-400 mt-1">
                Set credentials and choose which management tabs this team member can access.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Ramesh Deshmukh"
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Phone (10 Digits) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="staff@anmolenterprises.com"
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Role Classification
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('STAFF')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      newRole === 'STAFF'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-[#0B0F19] border-slate-800 text-slate-500 hover:text-white'
                    }`}
                  >
                    Staff Dispatch Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('ADMIN')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      newRole === 'ADMIN'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-[#0B0F19] border-slate-800 text-slate-500 hover:text-white'
                    }`}
                  >
                    Sub-Admin
                  </button>
                </div>
              </div>

              {/* Module Permissions Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Initial Module Permissions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isSelected = newPermissions.includes(perm.id)
                    const Icon = perm.icon

                    return (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => handleToggleNewModalPerm(perm.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/60 text-amber-300'
                            : 'bg-[#0B0F19] border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-xs font-semibold">{perm.label}</span>
                        </div>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubAdminMutation.isPending}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  {createSubAdminMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
