'use client'

import React from 'react'
import { Calendar, Sun, Moon, ShieldCheck } from 'lucide-react'

interface SlotPickerProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  selectedSlot: 'MORNING' | 'EVENING' | ''
  onSlotChange: (slot: 'MORNING' | 'EVENING') => void
}

// Helper to generate next 5 days
function getNext5Days(): Date[] {
  const days: Date[] = []
  const today = new Date()
  for (let i = 0; i < 5; i++) {
    const nextDay = new Date(today)
    nextDay.setDate(today.getDate() + i)
    days.push(nextDay)
  }
  return days
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function SlotPicker({
  selectedDate,
  onDateChange,
  selectedSlot,
  onSlotChange,
}: SlotPickerProps) {
  const dates = getNext5Days()

  // Format date helper
  const formatDateLabel = (date: Date) => {
    const dayName = DAYS_OF_WEEK[date.getDay()]
    const dateNum = date.getDate()
    const month = MONTHS[date.getMonth()]
    return { dayName, dateNum, month }
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    )
  }

  return (
    <div className="w-full flex flex-col gap-5 no-print">
      
      {/* Date Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-brand-orange" />
          <h4 className="font-display text-sm sm:text-base font-bold text-brand-charcoal">
            1. Choose Delivery Date
          </h4>
        </div>

        {/* Date Row */}
        <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-3 pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {dates.map((date, idx) => {
            const isSelected = isSameDay(date, selectedDate)
            const { dayName, dateNum, month } = formatDateLabel(date)
            const isToday = idx === 0

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onDateChange(date)}
                className={`flex flex-col items-center justify-center p-3 rounded-card min-w-[64px] h-[72px] transition-all border tap-scale shrink-0 ${
                  isSelected
                    ? 'bg-brand-orange text-white border-brand-orange shadow-md shadow-brand-orange/20 font-extrabold'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider mb-0.5">
                  {isToday ? 'Today' : dayName}
                </span>
                <span className="text-lg font-display font-black leading-none">{dateNum}</span>
                <span className="text-[9px] mt-0.5 font-medium">{month}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Slot Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sun className="w-5 h-5 text-brand-orange" />
          <h4 className="font-display text-sm sm:text-base font-bold text-brand-charcoal">
            2. Select Delivery Window
          </h4>
        </div>

        {/* Slot Cards Stack */}
        <div className="flex flex-col gap-3">
          
          {/* Morning Slot */}
          <button
            type="button"
            onClick={() => onSlotChange('MORNING')}
            className={`w-full flex items-center justify-between p-4 rounded-card border transition-all text-left tap-scale ${
              selectedSlot === 'MORNING'
                ? 'bg-brand-orange-light border-brand-orange ring-1 ring-brand-orange'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-card flex items-center justify-center text-amber-500">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-brand-charcoal">
                  🌅 Morning Delivery
                </p>
                <p className="font-body text-[11px] text-gray-400 mt-0.5">
                  9:00 AM – 1:00 PM
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold bg-[#00A67E]/10 text-[#00A67E] px-2 py-0.5 rounded-pill uppercase tracking-wide">
                8 slots left
              </span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedSlot === 'MORNING' ? 'border-brand-orange bg-brand-orange text-white' : 'border-gray-300'
              }`}>
                {selectedSlot === 'MORNING' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
              </div>
            </div>
          </button>

          {/* Evening Slot */}
          <button
            type="button"
            onClick={() => onSlotChange('EVENING')}
            className={`w-full flex items-center justify-between p-4 rounded-card border transition-all text-left tap-scale ${
              selectedSlot === 'EVENING'
                ? 'bg-brand-orange-light border-brand-orange ring-1 ring-brand-orange'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-card flex items-center justify-center text-indigo-500">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-brand-charcoal">
                  🌆 Evening Delivery
                </p>
                <p className="font-body text-[11px] text-gray-400 mt-0.5">
                  4:00 PM – 8:00 PM
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-pill uppercase tracking-wide">
                3 slots left
              </span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedSlot === 'EVENING' ? 'border-brand-orange bg-brand-orange text-white' : 'border-gray-300'
              }`}>
                {selectedSlot === 'EVENING' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
              </div>
            </div>
          </button>

        </div>
      </div>

      {/* Cold Chain Protected Reminder Strip */}
      <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-3.5 rounded-card flex items-start gap-3">
        <div className="p-1 bg-brand-yellow text-brand-charcoal rounded-md flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-display text-xs font-bold text-brand-charcoal uppercase tracking-wider leading-none">
            Cold Chain Protected
          </span>
          <span className="font-body text-[11px] text-brand-charcoal/70 leading-normal">
            Our delivery vehicles maintain strict -18°C. Your products arrive perfectly frozen and fresh.
          </span>
        </div>
      </div>

    </div>
  )
}
