'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, ArrowRight, ArrowLeft, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/ui/Toast'
import SlotPicker from '@/components/storefront/SlotPicker'

export default function CheckoutSlotPage() {
  const router = useRouter()
  const { total, items } = useCart()
  const { showToast } = useToast()

  // Slot states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<'MORNING' | 'EVENING' | ''>('')
  const [showSummary, setShowSummary] = useState(false)

  // Redirect if cart empty
  // Redirect directly to payment step (Slot step removed as requested)
  useEffect(() => {
    // Save express slot info if missing
    if (!localStorage.getItem('checkout_slot_info')) {
      localStorage.setItem('checkout_slot_info', JSON.stringify({
        deliveryDate: new Date().toISOString(),
        deliverySlot: 'MORNING',
        slotLabel: '⚡ Express 10-Minute Cold Chain Delivery'
      }))
    }
    router.replace('/checkout/payment')
  }, [router])

  const handleSlotChange = (slot: 'MORNING' | 'EVENING') => {
    setSelectedSlot(slot)
  }

  const handleContinue = () => {
    if (!selectedSlot) {
      showToast('Please select a delivery window.', 'error')
      return
    }

    const slotInfo = {
      deliveryDate: selectedDate.toISOString(),
      deliverySlot: selectedSlot,
      formattedDate: selectedDate.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      })
    }

    localStorage.setItem('checkout_slot_info', JSON.stringify(slotInfo))
    router.push('/checkout/payment')
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6 no-print">
      
      {/* Step Indicator */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border border-ice-blue-dk/20 rounded-card shadow-sm text-xs font-bold font-body text-gray-400 select-none">
        <button 
          onClick={() => router.push('/checkout')}
          className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">✓</div>
          <span>Delivery</span>
        </button>
        <div className="h-px bg-emerald-600 flex-1 mx-2" />
        <div className="flex items-center gap-1.5 text-brand-orange">
          <div className="w-5 h-5 rounded-full bg-brand-orange text-white flex items-center justify-center pulse-glow">2</div>
          <span>Slot</span>
        </div>
        <div className="h-px bg-gray-200 flex-1 mx-2" />
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gray-100 border text-gray-500 flex items-center justify-center">3</div>
          <span>Payment</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-card border border-ice-blue-dk/20 shadow-md p-5 sm:p-6">
        
        {/* Title */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
          <Clock className="w-6 h-6 text-brand-orange" />
          <div>
            <h2 className="font-display text-lg font-bold text-brand-charcoal">
              Select Delivery Window
            </h2>
            <p className="font-body text-xs text-gray-400 mt-0.5 leading-tight">
              Our cold storage vehicles keep items at -18°C.
            </p>
          </div>
        </div>

        {/* Slot Picker Component */}
        <SlotPicker
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedSlot={selectedSlot}
          onSlotChange={handleSlotChange}
        />

        {/* Accordion Order Summary Preview */}
        <div className="border border-gray-200 rounded-card mt-6 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSummary(!showSummary)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100/60 transition-colors text-left"
          >
            <div className="flex items-center gap-2 text-brand-charcoal text-xs font-bold uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4 text-brand-orange" />
              <span>Basket Summary ({items.length} items)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-display text-sm font-black text-brand-charcoal">
                ₹{total}
              </span>
              {showSummary ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </button>

          {showSummary && (
            <div className="p-4 border-t border-gray-200 flex flex-col gap-3 max-h-48 overflow-y-auto bg-white">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between items-center text-xs font-body">
                  <div className="min-w-0 pr-4">
                    <p className="font-bold text-brand-charcoal truncate">{item.productName}</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                      {item.packagingType.toLowerCase()} • {item.weightGrams}g ({item.unitsInPack} units)
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display font-bold text-brand-charcoal">₹{item.lineTotal}</p>
                    <p className="text-[10px] text-gray-400">Qty: {item.quantity} × ₹{item.unitPrice}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => router.push('/checkout')}
            className="flex-1 border border-gray-200 hover:bg-gray-50 text-brand-charcoal font-body text-sm font-bold py-3.5 rounded-pill flex items-center justify-center gap-2 tap-scale"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          
          <button
            type="button"
            disabled={!selectedSlot}
            onClick={handleContinue}
            className={`flex-[2] font-body text-sm font-extrabold py-3.5 rounded-pill shadow-lg flex items-center justify-center gap-2 tap-scale transition-all ${
              selectedSlot
                ? 'bg-brand-orange hover:bg-brand-orange-dark text-white shadow-brand-orange/20'
                : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Continue to Payment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  )
}
