import React from 'react'

const TRUST_ITEMS = [
  { icon: '❄️', label: '-18°C Cold Chain', sub: 'Sub-zero guaranteed', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  { icon: '⚡', label: '10-Min Express',   sub: 'Latur City delivery',  bg: 'bg-[#FFF8E7]', border: 'border-[#FFC700]/40', text: 'text-[#CC8800]' },
  { icon: '✅', label: '100% Fresh',       sub: 'Or full replacement',  bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  { icon: '🎉', label: 'Free 1st Delivery',sub: '₹0 for new customers', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  { icon: '🏆', label: 'Authorised McCain',sub: 'Official distributor', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  { icon: '💼', label: 'B2B Wholesale',    sub: 'Hotels · Cafes · QSRs', bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-700' },
]

export default function TrustStrip() {
  return (
    <div className="w-full overflow-x-auto no-scrollbar no-print">
      <div className="flex gap-3 pb-1 min-w-max">
        {TRUST_ITEMS.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-2.5 shrink-0 px-4 py-3 rounded-2xl border ${item.bg} ${item.border}`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <div>
              <p className={`font-black text-xs leading-tight ${item.text}`}>{item.label}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

