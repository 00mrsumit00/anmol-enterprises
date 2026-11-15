'use client'

import React, { useRef } from 'react'
import { Star, ShieldCheck, Quote, ChevronLeft, ChevronRight, ThumbsUp } from 'lucide-react'

interface ReviewItem {
  id: string
  name: string
  role: string
  business: string
  location: string
  rating: number
  comment: string
  tag: string
  verified: boolean
  avatarBg: string
}

const REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    name: 'Rajesh Patil',
    role: 'F&B Manager',
    business: 'Hotel Grand International',
    location: 'MIDC Latur',
    rating: 5,
    comment: 'McCain French Fries & Aloo Tikkis always arrive at rock-solid -18°C. Reliable cold-chain partner for our banquet and wedding catering.',
    tag: 'Banquet & Hotel',
    verified: true,
    avatarBg: 'bg-emerald-600',
  },
  {
    id: 'rev-2',
    name: 'Sneha Deshmukh',
    role: 'Cafe Owner',
    business: 'Beans & Bites Cafe',
    location: 'Barshi Road, Latur',
    rating: 5,
    comment: 'The Sure Crisp fries stay crunchy for over 30 mins for our takeaway orders. Super prompt morning deliveries before opening hours!',
    tag: 'Cafe & Bistro',
    verified: true,
    avatarBg: 'bg-amber-600',
  },
  {
    id: 'rev-3',
    name: 'Chef Amit Shinde',
    role: 'Executive Chef',
    business: 'Hotel Sai Residency',
    location: 'Shivaji Chowk, Latur',
    rating: 5,
    comment: 'Direct distributor wholesale pricing saved our kitchen almost 18% monthly. Product expiration dates are always long and fresh.',
    tag: 'Fine Dine Restaurant',
    verified: true,
    avatarBg: 'bg-blue-600',
  },
  {
    id: 'rev-4',
    name: 'Vikram Rathod',
    role: 'Store Manager',
    business: 'Burger Point QSR',
    location: 'Mitra Nagar, Latur',
    rating: 5,
    comment: 'Consistent quality on Veggie Burger Patties & Cheese Corn Nuggets. Credit ledger system makes our accounting effortless.',
    tag: 'Fast Food QSR',
    verified: true,
    avatarBg: 'bg-purple-600',
  },
  {
    id: 'rev-5',
    name: 'Priya Kulkarni',
    role: 'Home Caterer',
    business: 'Kulkarni Caterers',
    location: 'Ausa Road, Latur',
    rating: 5,
    comment: 'Frozen peas, corn, and McCain smiles arrive in prime condition even during peak summer afternoons. Exceptional delivery staff.',
    tag: 'Catering & Events',
    verified: true,
    avatarBg: 'bg-rose-600',
  },
  {
    id: 'rev-6',
    name: 'Anand Joshi',
    role: 'General Manager',
    business: 'Hotel Vrindavan',
    location: 'Old Ausa Road',
    rating: 5,
    comment: 'Ordering 2.5kg wholesale cartons online is so convenient. No daily cash hassles, monthly statement export is super clean.',
    tag: 'Hotel & Lodging',
    verified: true,
    avatarBg: 'bg-indigo-600',
  },
  {
    id: 'rev-7',
    name: 'Sagar Gaikwad',
    role: 'Head Chef',
    business: 'The Yellow Chillies Lounge',
    location: 'Barshi Road, Latur',
    rating: 5,
    comment: 'Best authorized McCain distributor in Marathwada region. Always have stock of speciality fries like wedges and chilli garlic bites.',
    tag: 'Lounge & Bar',
    verified: true,
    avatarBg: 'bg-amber-700',
  },
  {
    id: 'rev-8',
    name: 'Sunita Mane',
    role: 'Managing Partner',
    business: 'Royal Family Restaurant',
    location: 'Nanded Highway, Latur',
    rating: 5,
    comment: 'Prompt delivery before lunch service begins. They have been our trusted frozen food partner for over 2 years now.',
    tag: 'Family Restaurant',
    verified: true,
    avatarBg: 'bg-teal-600',
  },
]

export default function CustomerReviewsMarquee() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleManualScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 360
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <section className="w-full my-8 pt-4 pb-2 font-sans no-print">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 px-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified Commercial Reviews
            </span>
            <span className="text-xs text-amber-500 font-extrabold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              4.9 / 5 Rating
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Trusted by 150+ Hotels, Cafes & Kitchens
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real feedback from commercial partners and caterers across Latur & Marathwada
          </p>
        </div>

        {/* Manual Scroll Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
            Scroll or hover to pause
          </span>
          <button
            onClick={() => handleManualScroll('left')}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 shadow-xs"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleManualScroll('right')}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 shadow-xs"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Marquee Container with Hover Pause & Manual Touch Scrolling */}
      <div 
        ref={scrollRef}
        className="w-full overflow-x-auto no-scrollbar scroll-smooth py-2 px-0.5"
      >
        <div className="flex gap-4 w-max animate-reviews-scroll hover:[animation-play-state:paused]">
          {/* Double array to create seamless infinite loop effect */}
          {[...REVIEWS, ...REVIEWS].map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="w-[310px] sm:w-[340px] shrink-0 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-amber-400/50 transition-all flex flex-col justify-between select-none group"
            >
              {/* Card Top: Rating Stars + Tag */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-0.5">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {item.tag}
                  </span>
                </div>

                {/* Comment Text with Quote Icon */}
                <div className="relative mb-4">
                  <Quote className="w-6 h-6 text-amber-500/15 absolute -left-1 -top-2 pointer-events-none" />
                  <p className="text-xs text-slate-700 leading-relaxed font-normal italic relative z-10 pl-2">
                    &ldquo;{item.comment}&rdquo;
                  </p>
                </div>
              </div>

              {/* Card Bottom: Reviewer Profile */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-full ${item.avatarBg} text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                    {item.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {item.business} • <span className="text-slate-400">{item.location}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </section>
  )
}
