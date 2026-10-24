'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Truck,
  Plus,
  CheckCircle,
  XCircle,
  Search,
  Edit2,
  Wallet,
  Phone,
  Calendar,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Trash2,
  X,
  RefreshCw,
  Award,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface DriverData {
  id: string
  name: string
  phone: string
  vehicleNumber: string
  vehicleType: string
  isActive: boolean
  createdAt: string
  deliveredCount: number
  activeCount: number
  totalEarned: number
  unsettledCommission: number
  settledCommission: number
}

export default function AdminDriversPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState<DriverData | null>(null)
  const [settlingDriver, setSettlingDriver] = useState<DriverData | null>(null)
  const [deletingDriver, setDeletingDriver] = useState<DriverData | null>(null)

  // Add Form state
  const [addName, setAddName] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [addVehicleNumber, setAddVehicleNumber] = useState('')
  const [addVehicleType, setAddVehicleType] = useState('Van')

  // Edit Form state
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editVehicleNumber, setEditVehicleNumber] = useState('')
  const [editVehicleType, setEditVehicleType] = useState('Van')
  const [editIsActive, setEditIsActive] = useState(true)

  // 1. Fetch Drivers with stats
  const { data: drivers = [], isLoading, refetch } = useQuery<DriverData[]>({
    queryKey: ['admin-drivers'],
    queryFn: async () => {
      const res = await fetch('/api/drivers')
      if (!res.ok) throw new Error('Failed to fetch drivers')
      return res.json()
    },
  })

  // 2. Add Driver Mutation
  const addMutation = useMutation({
    mutationFn: async (payload: { name: string; phone: string; vehicleNumber: string; vehicleType: string }) => {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add driver')
      return data
    },
    onSuccess: () => {
      showToast('Delivery driver registered successfully!', 'success')
      setAddName('')
      setAddPhone('')
      setAddVehicleNumber('')
      setAddVehicleType('Van')
      setShowAddModal(false)
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Action failed', 'error')
    },
  })

  // 3. Edit Driver Mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/drivers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Failed to update driver')
      return resData
    },
    onSuccess: () => {
      showToast('Driver profile updated successfully!', 'success')
      setEditingDriver(null)
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Update failed', 'error')
    },
  })

  // 4. Settle Commission Mutation
  const settleMutation = useMutation({
    mutationFn: async (driverId: string) => {
      const res = await fetch(`/api/drivers/${driverId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to settle commission')
      return data
    },
    onSuccess: (data) => {
      showToast(`Settled ${data.settledCount} commission entries successfully!`, 'success')
      setSettlingDriver(null)
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Settlement failed', 'error')
    },
  })

  // 5. Delete Driver Mutation
  const deleteMutation = useMutation({
    mutationFn: async (driverId: string) => {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete driver')
      return data
    },
    onSuccess: () => {
      showToast('Driver deleted successfully', 'success')
      setDeletingDriver(null)
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] })
    },
    onError: (err: any) => {
      showToast(err.message || 'Delete failed', 'error')
    },
  })

  const openEditModal = (driver: DriverData) => {
    setEditingDriver(driver)
    setEditName(driver.name)
    setEditPhone(driver.phone)
    setEditVehicleNumber(driver.vehicleNumber)
    setEditVehicleType(driver.vehicleType)
    setEditIsActive(driver.isActive)
  }

  // Filtered drivers list
  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery) ||
      d.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && d.isActive) ||
      (statusFilter === 'INACTIVE' && !d.isActive)

    return matchesSearch && matchesStatus
  })

  // Aggregated Summary Metrics
  const totalDrivers = drivers.length
  const activeDrivers = drivers.filter((d) => d.isActive).length
  const totalCompletedRides = drivers.reduce((sum, d) => sum + (d.deliveredCount || 0), 0)
  const totalPendingPayout = drivers.reduce((sum, d) => sum + (d.unsettledCommission || 0), 0)

  return (
    <div className="flex flex-col gap-6 font-sans select-none">
      
      {/* ─── 1. TOP METRICS DASHBOARD ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fleet Drivers</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalDrivers}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active On Duty</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{activeDrivers}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivered Rides</p>
            <p className="text-xl font-black text-indigo-700 mt-0.5">{totalCompletedRides}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Payouts</p>
            <p className="text-xl font-black text-rose-600 mt-0.5">₹{Math.round(totalPendingPayout)}</p>
          </div>
        </div>
      </div>

      {/* ─── 2. CONTROLS BAR: SEARCH, STATUS FILTER & ADD DRIVER ─────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search driver by name, phone (+91), or vehicle plate..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'INACTIVE' ? 'bg-rose-600 text-white shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition active:scale-95"
            title="Refresh fleet list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Driver</span>
          </button>
        </div>
      </div>

      {/* ─── 3. DRIVERS DATA TABLE ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Fleet Records...</span>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Truck className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No delivery drivers found</p>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or register a new driver partner.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 border-b border-slate-200/80 font-bold uppercase tracking-wider select-none text-[11px]">
                  <th className="py-3.5 px-4">Driver Profile</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Vehicle Details</th>
                  <th className="py-3.5 px-4 text-center">Rides Delivered</th>
                  <th className="py-3.5 px-4 text-right">Commission & Balance</th>
                  <th className="py-3.5 px-4 text-center">Duty Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredDrivers.map((driver) => {
                  const initials = driver.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

                  return (
                    <tr key={driver.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Driver Avatar & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            driver.isActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-sm leading-tight">{driver.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              Joined {new Date(driver.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4">
                        <a
                          href={`tel:+91${driver.phone}`}
                          className="font-bold text-slate-800 hover:text-amber-600 transition flex items-center gap-1.5"
                          title="Click to call driver"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>+91 {driver.phone}</span>
                        </a>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5 px-4">
                        <div className="leading-tight">
                          <span className="font-mono font-bold text-slate-900">{driver.vehicleNumber}</span>
                          <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">
                            {driver.vehicleType}
                          </span>
                        </div>
                      </td>

                      {/* Rides Completed */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {driver.deliveredCount} rides
                        </span>
                      </td>

                      {/* Earnings & Pending Settlement */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="leading-tight">
                          <span className="font-extrabold text-slate-900 text-xs">Total: ₹{driver.totalEarned}</span>
                          {driver.unsettledCommission > 0 ? (
                            <span className="block text-[10px] font-bold text-rose-600 mt-0.5">
                              Pending: ₹{driver.unsettledCommission}
                            </span>
                          ) : (
                            <span className="block text-[10px] font-bold text-emerald-600 mt-0.5">
                              All settled ✓
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Duty / Active Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => editMutation.mutate({ id: driver.id, data: { isActive: !driver.isActive } })}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition active:scale-95 ${
                            driver.isActive
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                          }`}
                          title="Click to toggle active status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${driver.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{driver.isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Settle Commission Payout Button */}
                          {driver.unsettledCommission > 0 && (
                            <button
                              onClick={() => setSettlingDriver(driver)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] flex items-center gap-1 transition active:scale-95 shadow-2xs"
                              title="Settle pending commission payout"
                            >
                              <Wallet className="w-3 h-3" />
                              <span>Settle ₹{Math.round(driver.unsettledCommission)}</span>
                            </button>
                          )}

                          {/* Edit Profile */}
                          <button
                            onClick={() => openEditModal(driver)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                            title="Edit Driver Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Driver */}
                          <button
                            onClick={() => setDeletingDriver(driver)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                            title="Delete Driver"
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

      {/* ─── 4. MODAL: REGISTER NEW DRIVER ───────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Register New Driver</h3>
                  <p className="text-[11px] text-slate-400">Add a new delivery fleet partner</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!addName.trim() || !addPhone.trim() || !addVehicleNumber.trim()) {
                  return showToast('Please enter full name, phone and vehicle number', 'error')
                }
                addMutation.mutate({
                  name: addName.trim(),
                  phone: addPhone.trim().replace(/\D/g, '').slice(-10),
                  vehicleNumber: addVehicleNumber.trim().toUpperCase(),
                  vehicleType: addVehicleType,
                })
              }}
              className="mt-4 space-y-4 text-xs font-semibold"
            >
              <div>
                <label className="text-slate-600 uppercase tracking-wide block mb-1">Driver Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-slate-600 uppercase tracking-wide block mb-1">Phone Number (10 digits) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 942207xxxx"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 uppercase tracking-wide block mb-1">Vehicle Plate *</label>
                  <input
                    type="text"
                    required
                    placeholder="MH-24-AG-7000"
                    value={addVehicleNumber}
                    onChange={(e) => setAddVehicleNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold uppercase focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-slate-600 uppercase tracking-wide block mb-1">Vehicle Type *</label>
                  <select
                    value={addVehicleType}
                    onChange={(e) => setAddVehicleType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  >
                    <option value="Van">Freezer Van (Recommended)</option>
                    <option value="Three-Wheeler">Auto / E-Rickshaw</option>
                    <option value="Two-Wheeler">Motorcycle (Short routes)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold shadow-md transition disabled:opacity-50"
                >
                  {addMutation.isPending ? 'Registering...' : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 5. MODAL: EDIT DRIVER PROFILE ───────────────────────────────────── */}
      {editingDriver && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Edit Driver Profile</h3>
                  <p className="text-[11px] text-slate-400">Update contact and fleet vehicle information</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDriver(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                editMutation.mutate({
                  id: editingDriver.id,
                  data: {
                    name: editName.trim(),
                    phone: editPhone.trim().replace(/\D/g, '').slice(-10),
                    vehicleNumber: editVehicleNumber.trim().toUpperCase(),
                    vehicleType: editVehicleType,
                    isActive: editIsActive,
                  },
                })
              }}
              className="mt-4 space-y-4 text-xs font-semibold"
            >
              <div>
                <label className="text-slate-600 uppercase tracking-wide block mb-1">Driver Full Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-slate-600 uppercase tracking-wide block mb-1">Phone Number (10 digits) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 uppercase tracking-wide block mb-1">Vehicle Plate *</label>
                  <input
                    type="text"
                    required
                    value={editVehicleNumber}
                    onChange={(e) => setEditVehicleNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold uppercase focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-slate-600 uppercase tracking-wide block mb-1">Vehicle Type *</label>
                  <select
                    value={editVehicleType}
                    onChange={(e) => setEditVehicleType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  >
                    <option value="Van">Freezer Van</option>
                    <option value="Three-Wheeler">Auto / E-Rickshaw</option>
                    <option value="Two-Wheeler">Motorcycle</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 uppercase tracking-wide block mb-1">Duty & Fleet Status</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsActive(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-extrabold border transition ${
                      editIsActive
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    🟢 Active On Duty
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIsActive(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-extrabold border transition ${
                      !editIsActive
                        ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    ⚪ Inactive / Off Duty
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md transition disabled:opacity-50"
                >
                  {editMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 6. MODAL: SETTLE COMMISSION PAYOUT ──────────────────────────────── */}
      {settlingDriver && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Wallet className="w-7 h-7" />
            </div>

            <h3 className="font-extrabold text-base text-slate-900">Settle Commission Payout</h3>
            <p className="text-xs text-slate-500 mt-1">
              Mark pending delivery earnings as paid for <strong className="text-slate-800">{settlingDriver.name}</strong>.
            </p>

            <div className="my-5 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Total Unsettled Balance</p>
              <p className="text-3xl font-black mt-1">₹{settlingDriver.unsettledCommission}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                From completed doorstep deliveries
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSettlingDriver(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={settleMutation.isPending}
                onClick={() => settleMutation.mutate(settlingDriver.id)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md transition disabled:opacity-50"
              >
                {settleMutation.isPending ? 'Settling...' : 'Confirm Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 7. MODAL: DELETE DRIVER CONFIRMATION ────────────────────────────── */}
      {deletingDriver && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <AlertCircle className="w-7 h-7" />
            </div>

            <h3 className="font-extrabold text-base text-slate-900">Delete Driver Record?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to remove <strong className="text-slate-800">{deletingDriver.name}</strong> from fleet? This cannot be undone.
            </p>

            <div className="flex items-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => setDeletingDriver(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingDriver.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
