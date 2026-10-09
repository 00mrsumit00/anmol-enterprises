import React from 'react'

const TRUST_ITEMS = [
  { icon: '❄️', label: '-18°C Cold Chain', sub: 'Sub-zero guaranteed', bg: 'bg-blue-50/70 hover:bg-blue-50', border: 'border-blue-200/80', text: 'text-blue-800' },
  { icon: '⚡', label: '10-Min Express',   sub: 'Latur City delivery',  bg: 'bg-amber-50/70 hover:bg-amber-50', border: 'border-amber-200/80', text: 'text-amber-800' },
  { icon: '✅', label: '100% Fresh',       sub: 'Or full replacement',  bg: 'bg-emerald-50/70 hover:bg-emerald-50', border: 'border-emerald-200/80', text: 'text-emerald-800' },
  { icon: '🎉', label: 'Free 1st Delivery',sub: '₹0 for new customers', bg: 'bg-orange-50/70 hover:bg-orange-50', border: 'border-orange-200/80', text: 'text-orange-800' },
  { icon: '🏆', label: 'Authorised McCain',sub: 'Official distributor', bg: 'bg-purple-50/70 hover:bg-purple-50', border: 'border-purple-200/80', text: 'text-purple-800' },
  { icon: '💼', label: 'B2B Wholesale',    sub: 'Hotels · Cafes · QSRs', bg: 'bg-slate-50/80 hover:bg-slate-100/80', border: 'border-slate-200/80', text: 'text-slate-800' },
]

export default function TrustStrip() {
  return (
    <div className="w-full overflow-x-auto no-scrollbar no-print py-1">
      <div className="flex gap-2.5 sm:gap-3 pb-1 min-w-max">
        {TRUST_ITEMS.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-2.5 shrink-0 px-3.5 py-2.5 rounded-2xl border backdrop-blur-xs shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${item.bg} ${item.border}`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <div>
              <p className={`font-black text-xs leading-tight ${item.text}`}>{item.label}</p>
              <p className="text-[10px] text-slate-500 font-semibold leading-tight">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
