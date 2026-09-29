'use client'

import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Truck, Plus, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function AdminDriversPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // Form states
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [vehicleType, setVehicleType] = useState('Van')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch drivers
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: async () => {
      const res = await fetch('/api/drivers')
      if (!res.ok) throw new Error('Failed to fetch drivers')
      return res.json()
    }
  })

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !vehicleNumber.trim()) {
      return showToast('Please fill in all fields', 'error')
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, vehicleNumber, vehicleType })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add driver')
      }

      showToast('Driver added successfully!', 'success')
      setName('')
      setPhone('')
      setVehicleNumber('')
      setVehicleType('Van')
      setShowAddForm(false)
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] })
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle driver active status
  const toggleActiveStatus = async (driverId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle status')
      }

      showToast(`Driver status updated to: ${!currentStatus ? 'Active' : 'Inactive'}`, 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] })
    } catch (err: any) {
      showToast(err.message || 'Status toggle failed', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-5 font-body select-none">
      
      {/* Header action */}
      <div className="flex justify-between items-center no-print">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-brand-orange" />
          <h3 className="text-sm font-bold text-brand-charcoal">
            Active Delivery Agents
          </h3>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-orange hover:bg-brand-orange-dark text-white rounded-pill text-xs font-bold transition-all tap-scale shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Form' : 'Register Driver'}</span>
        </button>
      </div>

      {/* Add Driver Slide Panel Form */}
      {showAddForm && (
        <div className="bg-white p-5 rounded-card border border-brand-orange/15 shadow-md max-w-lg animate-fade-in no-print">
          <h4 className="font-display text-sm font-bold text-brand-charcoal mb-4">
            🚚 Register New Driver
          </h4>
          
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 text-xs font-semibold">
            
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-gray-500 uppercase tracking-wide">Driver Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-card px-4 py-2.5 focus:outline-none focus:border-brand-orange font-bold text-brand-charcoal"
                required
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1">
              <label className="text-gray-500 uppercase tracking-wide">Phone Number *</label>
              <input
                type="tel"
                placeholder="e.g. 942207xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full bg-gray-50 border border-gray-200 rounded-card px-4 py-2.5 focus:outline-none focus:border-brand-orange font-bold text-brand-charcoal"
                required
              />
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 uppercase tracking-wide">Vehicle Number *</label>
                <input
                  type="text"
                  placeholder="e.g. MH-24-AG-7000"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-card px-4 py-2.5 focus:outline-none focus:border-brand-orange font-bold text-brand-charcoal"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-500 uppercase tracking-wide">Vehicle Type *</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-card px-4 py-2.5 focus:outline-none focus:border-brand-orange font-bold text-brand-charcoal"
                >
                  <option value="Van">Freezer Van (Recommended)</option>
                  <option value="Three-Wheeler">Auto / E-Rickshaw</option>
                  <option value="Two-Wheeler">Motorcycle (Short routes)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-bold py-3 rounded-pill shadow-lg hover:shadow-brand-orange/20 flex items-center justify-center gap-2 tap-scale mt-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Register Driver Agent</span>
                </>
              )}
            </button>

          </form>
        </div>
      )}

      {/* Driver List Table */}
      <div className="bg-white rounded-card border border-gray-200 shadow-md overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400 font-bold uppercase">Loading Drivers list...</span>
          </div>
        ) : drivers.length === 0 ? (
          <div className="py-20 text-center text-xs text-gray-400 font-bold uppercase select-none">
            No delivery agents registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 border-b border-gray-200 font-bold uppercase tracking-wider select-none">
                  <th className="p-4">Driver Name</th>
                  <th className="p-4">Mobile Contact</th>
                  <th className="p-4">Vehicle Details</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Toggle status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drivers.map((driver: any) => (
                  <tr key={driver.id} className="hover:bg-gray-50/50">
                    
                    {/* Name */}
                    <td className="p-4 font-bold text-brand-charcoal">
                      {driver.name}
                    </td>

                    {/* Phone */}
                    <td className="p-4 font-semibold text-gray-600">
                      +91 {driver.phone}
                    </td>

                    {/* Vehicle */}
                    <td className="p-4">
                      <span className="font-semibold text-brand-charcoal">{driver.vehicleNumber}</span>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{driver.vehicleType}</p>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-gray-400 font-semibold">
                      {new Date(driver.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Status badge */}
                    <td className="p-4 text-center select-none">
                      <span className={`px-2 py-0.5 rounded-pill font-black text-[9px] tracking-wider uppercase inline-block border ${
                        driver.isActive 
                          ? 'bg-emerald-50 border-emerald-200 text-[#00A67E]' 
                          : 'bg-red-50 border-red-200 text-red-600'
                      }`}>
                        {driver.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    {/* Toggle Active status */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleActiveStatus(driver.id, driver.isActive)}
                        className={`p-1.5 rounded-md border text-xs font-bold tap-scale transition-all ${
                          driver.isActive
                            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 border-emerald-200 text-[#00A67E] hover:bg-emerald-100'
                        }`}
                      >
                        {driver.isActive ? (
                          <span className="flex items-center gap-0.5 justify-center"><XCircle className="w-3.5 h-3.5" /> Deactivate</span>
                        ) : (
                          <span className="flex items-center gap-0.5 justify-center"><CheckCircle className="w-3.5 h-3.5" /> Activate</span>
                        )}
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
