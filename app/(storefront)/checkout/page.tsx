'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ArrowRight, Building2, User, Home, Plus, CheckCircle2, BookmarkPlus, Trash2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/ui/Toast'

export default function CheckoutDeliveryPage() {
  const router = useRouter()
  const { total, items } = useCart()
  const { showToast } = useToast()

  // Form states
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [flatNo, setFlatNo] = useState('')
  const [street, setStreet] = useState('')
  const [landmark, setLandmark] = useState('')
  const [city, setCity] = useState('Latur')
  const [pincode, setPincode] = useState('')
  const [addressLabel, setAddressLabel] = useState('Home')
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(true)
  const [isB2BCheckout, setIsB2BCheckout] = useState(false)
  const [businessName, setBusinessName] = useState('')

  // Saved Addresses state
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loadingAddresses, setLoadingAddresses] = useState(true)

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      showToast('Your basket is empty. Please add items to checkout.', 'warning')
      router.push('/')
    }
  }, [items, router, showToast])

  // Fetch logged in user & saved addresses
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          const u = data.user
          setUser(u)
          setName(u.name || '')
          setPhone(u.phone || '')
          setIsB2BCheckout(u.isB2B)
          if (u.isB2B) {
            setBusinessName(u.businessName || u.businessProfile?.businessName || '')
            setAddressLabel('Hotel/Cafe Outlet')
          }

          // Fetch user's saved addresses
          fetch('/api/addresses')
            .then(r => r.json())
            .then(addrList => {
              if (Array.isArray(addrList) && addrList.length > 0) {
                setSavedAddresses(addrList)
                // Preselect default or first saved address
                const defaultAddr = addrList.find((a: any) => a.isDefault) || addrList[0]
                selectSavedAddress(defaultAddr)
              }
            })
            .catch(() => {})
            .finally(() => setLoadingAddresses(false))
        } else {
          showToast('Please login or register to complete your purchase.', 'warning')
          router.replace('/account?redirect=/checkout')
        }
      })
      .catch(() => {
        showToast('Please login or register to complete your purchase.', 'warning')
        router.replace('/account?redirect=/checkout')
      })

    // Load existing checkout info from localStorage if available
    try {
      const saved = localStorage.getItem('checkout_delivery_info')
      if (saved) {
        const info = JSON.parse(saved)
        setName(info.name || '')
        setPhone(info.phone || '')
        setFlatNo(info.flatNo || '')
        setStreet(info.street || '')
        setLandmark(info.landmark || '')
        setCity(info.city || 'Latur')
        setPincode(info.pincode || '')
        setIsB2BCheckout(info.isB2BCheckout || false)
        setBusinessName(info.businessName || '')
      }
    } catch (e) {}
  }, [])

  // Helper to apply saved address into form fields
  const selectSavedAddress = (addr: any) => {
    setSelectedAddressId(addr.id)
    setFlatNo(addr.flatNo || '')
    setStreet(addr.street || '')
    setLandmark(addr.landmark || '')
    setCity(addr.city || 'Latur')
    setPincode(addr.pincode || '')
    setAddressLabel(addr.label || 'Home')
  }

  // Handle switching to enter a new address
  const handleAddNewAddressOption = () => {
    setSelectedAddressId('NEW')
    setFlatNo('')
    setStreet('')
    setLandmark('')
    setPincode('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return showToast('Please enter your name', 'error')
    if (!phone.trim() || phone.length < 10) return showToast('Please enter a valid 10-digit phone number', 'error')
    if (!flatNo.trim()) return showToast('Please enter house/flat/shop number', 'error')
    if (!street.trim()) return showToast('Please enter street/area name', 'error')
    if (!pincode.trim() || pincode.length !== 6) return showToast('Please enter a valid 6-digit pincode', 'error')
    if (isB2BCheckout && !businessName.trim()) return showToast('Please enter your business name', 'error')

    // If user selected "Add New Address" & checkbox is checked, save to DB
    if (user && saveAddressToAccount && selectedAddressId === 'NEW') {
      try {
        await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: addressLabel,
            flatNo,
            street,
            landmark,
            city,
            pincode,
            isDefault: savedAddresses.length === 0
          })
        })
      } catch (err) {
        console.error('Save address error:', err)
      }
    }

    const deliveryInfo = {
      name,
      phone,
      flatNo,
      street,
      landmark,
      city,
      pincode,
      isB2BCheckout,
      businessName: isB2BCheckout ? businessName : null,
      fullAddress: `${flatNo}, ${street}${landmark ? `, Near ${landmark}` : ''}, ${city} - ${pincode}`
    }

    // Save express slot automatically behind the scenes
    const slotInfo = {
      slot: 'MORNING',
      slotLabel: '⚡ Express 10-Minute Cold Chain Delivery',
      deliveryDate: new Date().toISOString()
    }

    localStorage.setItem('checkout_delivery_info', JSON.stringify(deliveryInfo))
    localStorage.setItem('checkout_slot_info', JSON.stringify(slotInfo))

    // Directly skip slot step and proceed straight to payment!
    router.push('/checkout/payment')
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6 no-print font-body">
      
      {/* 2-Step Indicator (Slot step skipped as requested) */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border border-ice-blue-dk/20 rounded-card shadow-sm text-xs font-bold text-gray-400 select-none">
        <div className="flex items-center gap-1.5 text-brand-orange">
          <div className="w-5 h-5 rounded-full bg-brand-orange text-white flex items-center justify-center text-[10px]">1</div>
          <span>Delivery Address</span>
        </div>
        <div className="h-px bg-gray-200 flex-1 mx-4" />
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gray-100 border text-gray-500 flex items-center justify-center text-[10px]">2</div>
          <span>Review & Pay</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-card border border-ice-blue-dk/20 shadow-md p-5 sm:p-6">
        
        {/* Title */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
          <div className="p-3 bg-brand-orange-light text-brand-orange rounded-card">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-brand-charcoal">
              Select Delivery Address
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">
              Choose a saved address or enter a new address for express delivery.
            </p>
          </div>
        </div>

        {/* ================= SAVED ADDRESS SELECTION SYSTEM ================= */}
        {user && savedAddresses.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <BookmarkPlus className="w-4 h-4 text-purple-600" />
                <span>Your Saved Addresses ({savedAddresses.length})</span>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {savedAddresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id
                return (
                  <div
                    key={addr.id}
                    onClick={() => selectSavedAddress(addr)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 tap-scale ${
                      isSelected
                        ? 'bg-purple-50/70 border-purple-500 ring-1 ring-purple-500 shadow-xs'
                        : 'bg-gray-50/70 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl mt-0.5 ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {addr.label === 'Office' ? <Building2 className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-xs font-black text-brand-charcoal">
                            {addr.label || 'Saved Address'}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 font-semibold mt-1 leading-snug">
                          {addr.flatNo}, {addr.street}{addr.landmark ? `, Near ${addr.landmark}` : ''}, {addr.city} - {addr.pincode}
                        </p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                      isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                )
              })}

              {/* Add New Address Button */}
              <button
                type="button"
                onClick={handleAddNewAddressOption}
                className={`p-3.5 rounded-2xl border border-dashed text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedAddressId === 'NEW'
                    ? 'bg-brand-orange-light/40 border-brand-orange text-brand-orange'
                    : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>+ Add / Use New Delivery Address</span>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* B2B Checkout Toggle */}
          <div className="bg-purple-50/60 border border-purple-200/80 p-3.5 rounded-card flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-purple-700" />
              <div>
                <span className="text-xs font-bold text-brand-charcoal block leading-tight">
                  Ordering for Business / Hotel / Cafe?
                </span>
                <span className="text-[10px] text-gray-500 font-semibold leading-none">
                  Check this for GST Tax Invoice & commercial tags.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isB2BCheckout} 
                onChange={(e) => setIsB2BCheckout(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-700" />
            </label>
          </div>

          {/* Business Name Field */}
          {isB2BCheckout && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                Business / Outlet Name *
              </label>
              <div className="relative flex items-center">
                <Building2 className="w-4.5 h-4.5 text-gray-400 absolute left-3" />
                <input
                  type="text"
                  placeholder="Hotel / Cafe / Bakery / Restaurant Name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-sm rounded-card pl-10 pr-4 py-2.5 focus:outline-none focus:border-brand-orange"
                  required={isB2BCheckout}
                />
              </div>
            </div>
          )}

          {/* Customer Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
              {isB2BCheckout ? 'Contact Manager Name *' : 'Full Name *'}
            </label>
            <div className="relative flex items-center">
              <User className="w-4.5 h-4.5 text-gray-400 absolute left-3" />
              <input
                type="text"
                placeholder="Enter recipient full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-gray-200 text-sm rounded-card pl-10 pr-4 py-2.5 focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
          </div>

          {/* Mobile Phone Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
              Mobile Number for Delivery Call *
            </label>
            <div className="flex rounded-card border border-gray-200 overflow-hidden focus-within:border-brand-orange">
              <span className="bg-gray-100 text-gray-500 text-sm font-bold px-3.5 flex items-center border-r border-gray-200 select-none">
                +91
              </span>
              <input
                type="tel"
                placeholder="10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full bg-white text-sm px-4 py-2.5 focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              Mandatory: Delivery driver will call on this number for handover and navigation.
            </p>
          </div>

          {/* Address Label (Home / Office / Hotel Outlet) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
              Address Label / Type
            </label>
            <div className="flex items-center gap-2">
              {['Home', 'Office', 'Hotel/Cafe Outlet', 'Warehouse'].map((lbl) => (
                <button
                  type="button"
                  key={lbl}
                  onClick={() => setAddressLabel(lbl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    addressLabel === lbl
                      ? 'bg-brand-charcoal text-white border-brand-charcoal shadow-xs'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Flat / House No */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
              Flat / House / Shop Number *
            </label>
            <input
              type="text"
              placeholder="e.g. Shop No. 4 / Flat 102, Building Name"
              value={flatNo}
              onChange={(e) => setFlatNo(e.target.value)}
              className="w-full bg-white border border-gray-200 text-sm rounded-card px-4 py-2.5 focus:outline-none focus:border-brand-orange"
              required
            />
          </div>

          {/* Street / Landmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                Street / Area *
              </label>
              <input
                type="text"
                placeholder="e.g. Gandhi Nagar / MIDC Area"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full bg-white border border-gray-200 text-sm rounded-card px-4 py-2.5 focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                Landmark (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Near City Market / Bus Stand"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full bg-white border border-gray-200 text-sm rounded-card px-4 py-2.5 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          {/* City / Pincode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                City *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-white border border-gray-200 text-sm rounded-card px-4 py-2.5 focus:outline-none focus:border-brand-orange font-semibold"
                required
              >
                <option value="Latur">Latur (Free express delivery)</option>
                <option value="Osmanabad">Osmanabad</option>
                <option value="Nanded">Nanded</option>
                <option value="Bidar">Bidar</option>
                <option value="Other">Other (Regional Express)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                Pincode *
              </label>
              <input
                type="text"
                placeholder="6-digit pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-white border border-gray-200 text-sm rounded-card px-4 py-2.5 focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
          </div>

          {/* Save Address Checkbox */}
          {user && selectedAddressId === 'NEW' && (
            <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveAddressToAccount}
                onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                className="w-4 h-4 accent-brand-orange rounded"
              />
              <span className="text-xs font-bold text-gray-600">
                Save this address to my account for 1-click future orders
              </span>
            </label>
          )}

          {/* Submit button: Directly proceeds to Payment! */}
          <button
            type="submit"
            className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-display text-sm font-extrabold py-3.5 rounded-pill shadow-lg hover:shadow-brand-orange/20 flex items-center justify-center gap-2 tap-scale mt-4"
          >
            <span>Proceed to Payment</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>
      </div>

    </div>
  )
}
