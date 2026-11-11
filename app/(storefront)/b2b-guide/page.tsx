'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Sparkles,
  Video,
  ExternalLink,
  Snowflake,
  CreditCard,
  FileText,
  Shield,
  Zap,
  Clock,
  TrendingUp,
  Building2,
  Store,
  Coffee,
  ShoppingCart,
  UtensilsCrossed
} from 'lucide-react'

// ─── TYPES ──────────────────────────────────────────────────────────────────────
interface Chapter {
  time: number
  label: string
  shortLabel: string
}

interface TerminalSlide {
  title: string
  subtitle: string
  rows: { label: string; value: string; highlight?: boolean }[]
  pills: { text: string; color: string }[]
  footer: { label: string; badge: string }
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────────
const CHAPTERS: Chapter[] = [
  { time: 0, label: 'Account Type Selection', shortLabel: '0:00 — Type' },
  { time: 65, label: 'Outlet Information', shortLabel: '1:05 — Info' },
  { time: 110, label: 'GSTIN & FSSAI Entry', shortLabel: '1:50 — GSTIN' },
  { time: 150, label: 'Email OTP Verification', shortLabel: '2:30 — OTP' },
  { time: 195, label: 'Wholesale Catalog Access', shortLabel: '3:15 — Shop' }
]

const TERMINAL_SLIDES: TerminalSlide[] = [
  {
    title: 'WHOLESALE PRICING ENGINE',
    subtitle: 'McCain French Fries 750g — Carton Rate vs MRP',
    rows: [
      { label: 'Retail MRP (Single Pack)', value: '₹180.00' },
      { label: 'Your Wholesale Rate', value: '₹115.00', highlight: true },
      { label: 'Master Carton (20 Units)', value: '₹2,300.00', highlight: true }
    ],
    pills: [
      { text: '36% Savings', color: 'amber' },
      { text: '-₹65/Unit', color: 'emerald' }
    ],
    footer: { label: 'Validated Across 12 Product Lines', badge: 'Proven ROI' }
  },
  {
    title: 'COLD-CHAIN LOGISTICS',
    subtitle: 'Guaranteed frozen delivery at -18°C doorstep',
    rows: [
      { label: 'Temperature Control', value: '-18°C Maintained' },
      { label: 'Morning Slot', value: '7:00 AM — 12:00 PM', highlight: true },
      { label: 'Evening Slot', value: '4:00 PM — 9:00 PM', highlight: true }
    ],
    pills: [
      { text: 'Zero Thaw', color: 'cyan' },
      { text: 'Latur Coverage', color: 'emerald' }
    ],
    footer: { label: 'Dedicated Refrigerated Fleet', badge: 'On-Time 98%' }
  },
  {
    title: 'CREDIT & INVOICING',
    subtitle: 'Net 15–30 day commercial terms for verified partners',
    rows: [
      { label: 'Credit Limit Range', value: '₹25,000 — ₹1,00,000' },
      { label: 'GST Input Tax Invoice', value: 'Auto-Generated', highlight: true },
      { label: 'Monthly Ledger Export', value: 'Excel (.xlsx)', highlight: true }
    ],
    pills: [
      { text: 'Net 30 Days', color: 'violet' },
      { text: 'HSN Summary', color: 'amber' }
    ],
    footer: { label: 'GSTIN: 27AGEPT8074F1Z0', badge: 'Compliant' }
  }
]

const STEPS = [
  {
    num: '01',
    terminalTitle: 'ACCOUNT TYPE SELECTION',
    title: 'Choose "Business / Wholesale Partner"',
    description: 'On the Anmol portal, you\'ll be asked how you use our platform. Select the Business / Wholesale Partner option to unlock wholesale carton packaging, B2B tiered rates, and credit facilities.',
    pills: [
      { text: 'Wholesale Unlock', color: 'amber' },
      { text: 'B2B Tiers', color: 'emerald' }
    ],
    note: 'Individual consumers see MRP pricing only. Business accounts access Master Cartons (20 packs) and Medium Boxes (10 packs).',
    noteType: 'info' as const,
    visual: 'choice'
  },
  {
    num: '02',
    terminalTitle: 'OUTLET INFORMATION',
    title: 'Enter Your Business Details',
    description: 'Provide your establishment name (e.g. Hotel Grand Treat, Café Mocha) and choose your outlet category. This helps us tailor wholesale recommendations and delivery scheduling for your business.',
    pills: [
      { text: 'Hotel', color: 'amber' },
      { text: 'Café', color: 'emerald' },
      { text: 'Kirana', color: 'violet' },
      { text: 'Caterer', color: 'cyan' }
    ],
    note: 'Delivery address auto-maps to our Latur & Marathwada coverage zone for optimized routing.',
    noteType: 'info' as const,
    visual: 'categories'
  },
  {
    num: '03',
    terminalTitle: 'GST & COMPLIANCE',
    title: 'Add GSTIN & FSSAI (Optional for Small Vendors)',
    description: 'Enter your 15-character GSTIN to claim GST input tax credit and generate official statutory tax invoices with HSN summaries automatically. FSSAI helps verify food safety compliance.',
    pills: [
      { text: '✓ GSTIN', color: 'emerald' },
      { text: '✓ FSSAI', color: 'emerald' }
    ],
    note: 'No GSTIN? No problem! Small cloud kitchens and kirana stores can register and order with Cash-on-Delivery or UPI payment.',
    noteType: 'success' as const,
    visual: 'compliance'
  },
  {
    num: '04',
    terminalTitle: 'VERIFY & GO LIVE',
    title: 'Email OTP Verification & Instant Access',
    description: 'Enter your business email and receive a 6-digit verification code instantly. Set your password and your wholesale account goes live immediately — start adding cartons to your cart right away.',
    pills: [
      { text: '🎉 Instant Access', color: 'emerald' },
      { text: 'Live in 60s', color: 'amber' }
    ],
    note: 'B2B credit lines are reviewed within 2–4 hours by our operations team after account creation.',
    noteType: 'info' as const,
    visual: 'verify'
  }
]

const FAQS = [
  {
    q: 'Can I register and order without a GST number?',
    a: 'Yes! Small cafes, kirana stores, and cloud kitchens can register by entering their business outlet name and selecting "Kirana / Cloud Kitchen" mode. You can pay via Cash on Delivery or UPI upon delivery.'
  },
  {
    q: 'How does the B2B Credit facility work?',
    a: 'Commercial accounts with a valid GSTIN and business address are reviewed by our operations team within 2–4 hours. Once verified, a credit limit (Net 15–30 days) is assigned, allowing you to order frozen stocks and settle periodically.'
  },
  {
    q: 'How do I download monthly ledgers and tax invoices?',
    a: 'Download complete Excel (.xlsx) financial ledgers with opening balances, debits, credits, and running totals from your Account page or Order History. Statutory tax invoices are also emailed automatically upon delivery.'
  },
  {
    q: 'What is the minimum order for wholesale pricing?',
    a: 'Wholesale pricing is available on Medium Boxes (10 packs) and Bulk Master Cartons (20 packs). You can mix different items to fulfill your kitchen needs — no single-product minimums.'
  },
  {
    q: 'Can I get same-day emergency frozen food stock?',
    a: 'Yes. We operate dedicated cold-chain delivery vans in Latur with Morning and Evening dispatch slots. Select the immediate slot during checkout or contact us via WhatsApp for priority dispatch.'
  }
]

// ─── SCROLL ANIMATION HOOK ──────────────────────────────────────────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

// ─── FLOATING TERMINAL CARD COMPONENT ───────────────────────────────────────────
function FloatingTerminalCard() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setActiveSlide(prev => (prev + 1) % TERMINAL_SLIDES.length)
        setIsTransitioning(false)
      }, 400)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const slide = TERMINAL_SLIDES[activeSlide]

  const pillColorMap: Record<string, string> = {
    amber: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    emerald: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
    cyan: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30',
    violet: 'bg-violet-400/15 text-violet-300 border-violet-400/30'
  }

  return (
    <div
      className="relative w-full max-w-[420px] mx-auto lg:mx-0"
      style={{ animation: 'float 6s ease-in-out infinite' }}
    >
      {/* Glow behind card */}
      <div className="absolute -inset-4 bg-amber-500/[0.07] rounded-[2rem] blur-2xl pointer-events-none" />

      <div className={`relative bg-[#0D1117] border border-slate-700/40 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 transition-all duration-400 ${isTransitioning ? 'opacity-0 scale-[0.97]' : 'opacity-100 scale-100'}`}>
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#161B22] border-b border-slate-700/40">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="font-mono text-[10px] text-slate-400 tracking-wider uppercase">
            {slide.title}
          </span>
          {/* Progress bar */}
          <div className="flex items-center gap-1">
            {TERMINAL_SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === activeSlide ? 'w-4 bg-amber-400' : 'w-1.5 bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-4">
          {/* Subtitle */}
          <p className="text-xs text-slate-400 leading-relaxed">
            {slide.subtitle}
          </p>

          {/* Data Rows */}
          <div className="space-y-2">
            {slide.rows.map((row, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
                  row.highlight
                    ? 'bg-amber-500/[0.06] border-amber-500/20'
                    : 'bg-slate-800/40 border-slate-700/30'
                }`}
              >
                <span className="text-[11px] text-slate-400">{row.label}</span>
                <span className={`text-xs font-bold ${row.highlight ? 'text-amber-300' : 'text-slate-200'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Pill Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {slide.pills.map((pill, i) => (
              <span
                key={i}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${pillColorMap[pill.color] || pillColorMap.amber}`}
              >
                {pill.text}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
            <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400/60" />
              {slide.footer.label}
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
              {slide.footer.badge}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── STEP TERMINAL CARD COMPONENT ───────────────────────────────────────────────
function StepCard({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const { ref, isVisible } = useScrollReveal()

  const pillColorMap: Record<string, string> = {
    amber: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    emerald: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
    cyan: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30',
    violet: 'bg-violet-400/15 text-violet-300 border-violet-400/30'
  }

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="group bg-[#0D1117] border border-slate-700/30 rounded-2xl overflow-hidden hover:border-slate-600/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/[0.03] transition-all duration-300">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#161B22] border-b border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="font-mono text-[10px] text-slate-400 tracking-wider uppercase hidden sm:inline">
              {step.terminalTitle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {step.pills.map((pill, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${pillColorMap[pill.color] || pillColorMap.amber}`}
              >
                {pill.text}
              </span>
            ))}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 flex flex-col lg:flex-row gap-6">
          {/* Left: Content */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-black text-amber-400/40">
                {step.num}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {step.title}
              </h3>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              {step.description}
            </p>

            {/* Info/Success Note */}
            <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              step.noteType === 'success'
                ? 'bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-300'
                : 'bg-slate-800/40 border-slate-700/30 text-slate-400'
            }`}>
              <span className={`font-bold ${step.noteType === 'success' ? 'text-emerald-400' : 'text-slate-300'}`}>
                {step.noteType === 'success' ? '✓ ' : '💡 '}
              </span>
              {step.note}
            </div>
          </div>

          {/* Right: Visual Mock */}
          <div className="lg:w-[240px] shrink-0 flex items-center justify-center">
            {step.visual === 'choice' && (
              <div className="w-full space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 text-center">
                  <span className="text-xs text-slate-500">👤 Individual Consumer</span>
                  <span className="block text-[10px] text-slate-600 mt-0.5">MRP Pricing Only</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/30 text-center relative">
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-slate-950" />
                  </div>
                  <span className="text-xs font-bold text-amber-300">🏢 Business / Wholesale</span>
                  <span className="block text-[10px] text-amber-400/60 mt-0.5">Carton Rates + Credit</span>
                </div>
              </div>
            )}
            {step.visual === 'categories' && (
              <div className="w-full grid grid-cols-2 gap-2">
                {[
                  { icon: UtensilsCrossed, label: 'Hotel', color: 'amber' },
                  { icon: Coffee, label: 'Café', color: 'emerald' },
                  { icon: ShoppingCart, label: 'Kirana', color: 'violet' },
                  { icon: Store, label: 'Caterer', color: 'cyan' }
                ].map((cat, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center flex flex-col items-center gap-1">
                    <cat.icon className={`w-4 h-4 ${
                      cat.color === 'amber' ? 'text-amber-400' :
                      cat.color === 'emerald' ? 'text-emerald-400' :
                      cat.color === 'violet' ? 'text-violet-400' :
                      'text-cyan-400'
                    }`} />
                    <span className="text-[10px] text-slate-400 font-medium">{cat.label}</span>
                  </div>
                ))}
              </div>
            )}
            {step.visual === 'compliance' && (
              <div className="w-full space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <span className="text-[10px] text-slate-500 block mb-1">GSTIN</span>
                  <span className="font-mono text-xs text-emerald-400">27XXXXXXXX●●●●●</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <span className="text-[10px] text-slate-500 block mb-1">FSSAI</span>
                  <span className="font-mono text-xs text-emerald-400">1152404900●●●●</span>
                </div>
              </div>
            )}
            {step.visual === 'verify' && (
              <div className="w-full space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center">
                  <span className="text-[10px] text-slate-500 block">OTP Sent to</span>
                  <span className="text-xs text-slate-300 font-mono">b●●●@gmail.com</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <div key={n} className="w-7 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <span className="font-mono text-sm font-bold text-amber-300">•</span>
                    </div>
                  ))}
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-[10px] font-bold text-emerald-400">✓ Account Live — Start Ordering!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE COMPONENT ────────────────────────────────────────────────────────
export default function B2BRegistrationGuidePage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(222)
  const [activeChapter, setActiveChapter] = useState(0)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  // Video YouTube embed support — hidden from UI, configurable via code
  const youtubeUrl = '' // Set YouTube URL here when available

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return
    const cur = videoRef.current.currentTime
    setCurrentTime(cur)
    for (let i = CHAPTERS.length - 1; i >= 0; i--) {
      if (cur >= CHAPTERS[i].time) {
        setActiveChapter(i)
        break
      }
    }
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration || 222)
  }, [])

  const seekToChapter = useCallback((timeInSeconds: number, index: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = timeInSeconds
    setCurrentTime(timeInSeconds)
    setActiveChapter(index)
    if (!isPlaying) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = val
      setCurrentTime(val)
    }
  }, [])

  const handleFullscreen = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen()
    }
  }, [])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const getYoutubeEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const id = url.split('v=')[1]?.split('&')[0]
        return `https://www.youtube.com/embed/${id}?autoplay=1`
      }
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0]
        return `https://www.youtube.com/embed/${id}?autoplay=1`
      }
      if (url.includes('youtube.com/embed/')) return url
    } catch {
      return url
    }
    return url
  }

  // Scroll-reveal hooks for sections
  const videoSection = useScrollReveal()
  const stepsSection = useScrollReveal()
  const eligibilitySection = useScrollReveal()
  const faqSection = useScrollReveal()
  const ctaSection = useScrollReveal()

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">

      {/* ─── GLOBAL KEYFRAMES ──────────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-12px) translateX(6px); }
          66% { transform: translateY(6px) translateX(-6px); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fade-up 0.8s ease-out forwards;
        }
        .animate-fade-up-delay-1 {
          animation: fade-up 0.8s ease-out 0.1s forwards;
          opacity: 0;
        }
        .animate-fade-up-delay-2 {
          animation: fade-up 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }
        .animate-fade-up-delay-3 {
          animation: fade-up 0.8s ease-out 0.35s forwards;
          opacity: 0;
        }
        .animate-fade-up-delay-4 {
          animation: fade-up 0.8s ease-out 0.5s forwards;
          opacity: 0;
        }

        /* Custom range slider for video */
        input[type="range"].video-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #F59E0B;
          cursor: pointer;
          border: 2px solid #070A10;
          box-shadow: 0 0 8px rgba(245,158,11,0.4);
        }
        input[type="range"].video-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #F59E0B;
          cursor: pointer;
          border: 2px solid #070A10;
          box-shadow: 0 0 8px rgba(245,158,11,0.4);
        }
      `}</style>

      {/* ─── AMBIENT BACKGROUND GLOWS ──────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-[-15%] left-[-8%] w-[500px] h-[500px] bg-amber-500/[0.06] rounded-full blur-[160px]"
          style={{ animation: 'float-slow 8s ease-in-out infinite' }}
        />
        <div
          className="absolute top-[30%] right-[-10%] w-[450px] h-[450px] bg-emerald-500/[0.04] rounded-full blur-[160px]"
          style={{ animation: 'float-slow 10s ease-in-out infinite 2s' }}
        />
        <div
          className="absolute bottom-[-15%] left-[30%] w-[500px] h-[500px] bg-indigo-500/[0.04] rounded-full blur-[180px]"
          style={{ animation: 'float-slow 12s ease-in-out infinite 4s' }}
        />
      </div>

      {/* ─── COMPACT TOP NAVIGATION BAR ────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-[#070A10]/80 backdrop-blur-2xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-slate-950" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight hidden sm:inline">
                Anmol <span className="text-amber-400">Enterprises</span>
                <span className="text-slate-500 font-normal ml-2 text-xs">/ B2B Guide</span>
              </span>
            </div>
          </div>

          <Link
            href="/account"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <span>Register Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ─── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main className="relative z-10">

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 1: CINEMATIC HERO
        ════════════════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-20 sm:pb-28">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: Typography + CTAs */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: 'glow-pulse 2s ease-in-out infinite' }} />
                <span className="text-[11px] font-bold text-amber-300">B2B Commercial Onboarding</span>
                <span className="text-slate-600 mx-1">|</span>
                <span className="text-[11px] text-slate-400">Quick 3-Minute Process</span>
              </div>

              {/* Hero Title */}
              <h1 className="animate-fade-up-delay-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
                <span className="text-white">Become an Anmol</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">
                  Wholesale Partner.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="animate-fade-up-delay-2 text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Step-by-step registration guide and video demo for Hotels, Restaurants, Cafes & Caterers in Latur & Marathwada.
              </p>

              {/* CTAs */}
              <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <a
                  href="#video-section"
                  className="inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-amber-500/25 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Watch 3-Min Demo</span>
                </a>
                <Link
                  href="/account"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white px-5 py-3 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all hover:bg-slate-800/30"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Register as B2B</span>
                </Link>
              </div>

              {/* Value Pills Row */}
              <div className="animate-fade-up-delay-4 flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start pt-2">
                {[
                  { icon: TrendingUp, text: 'Up to 35% Savings' },
                  { icon: CreditCard, text: 'Net 15–30 Day Credit' },
                  { icon: Snowflake, text: '-18°C Cold Chain' },
                  { icon: FileText, text: 'GST Tax Invoices' }
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <item.icon className="w-3.5 h-3.5 text-slate-600" />
                    {item.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Floating Terminal Card */}
            <div className="w-full lg:w-auto flex-shrink-0 animate-fade-up-delay-3">
              <FloatingTerminalCard />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 2: VIDEO MASTERCLASS
        ════════════════════════════════════════════════════════════════════ */}
        <section
          id="video-section"
          ref={videoSection.ref}
          className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32 transition-all duration-700 ${
            videoSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-8 space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Video className="w-3.5 h-3.5" />
              Registration Walkthrough
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Watch the Complete Demo
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              A 3-minute screencast showing every step from account selection to your first wholesale order.
            </p>
          </div>

          {/* Video Container */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-700/40 shadow-2xl shadow-black/50 group">
            {youtubeUrl ? (
              <iframe
                src={getYoutubeEmbedUrl(youtubeUrl)}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  src="/videos/registration-demo.mp4"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  playsInline
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={togglePlay}
                />

                {/* Big Play Overlay */}
                {!isPlaying && (
                  <div
                    onClick={togglePlay}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs cursor-pointer transition-all"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform">
                      <Play className="w-7 h-7 fill-slate-950 ml-0.5" />
                    </div>
                    <p className="mt-4 text-sm font-bold text-white tracking-wide">
                      Play Demo
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      3:42 · Step-by-step walkthrough
                    </p>
                  </div>
                )}

                {/* Control Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <input
                    type="range"
                    min={0}
                    max={duration || 222}
                    step={0.5}
                    value={currentTime}
                    onChange={handleSeek}
                    className="video-slider w-full h-1 bg-slate-700/80 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-xs text-white">
                    <div className="flex items-center gap-2.5">
                      <button type="button" onClick={togglePlay} className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer">
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      </button>
                      <button type="button" onClick={toggleMute} className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer">
                        {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <span className="font-mono text-[11px] text-slate-300">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    <button type="button" onClick={handleFullscreen} className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer" title="Fullscreen">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Chapter Chips — horizontal scroll */}
          <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CHAPTERS.map((ch, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => seekToChapter(ch.time, idx)}
                className={`shrink-0 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  activeChapter === idx
                    ? 'bg-amber-400/15 border-amber-400/40 text-amber-300 shadow-sm shadow-amber-500/10'
                    : 'bg-[#0D1117] border-slate-700/30 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="font-mono font-bold">{ch.shortLabel.split(' — ')[0]}</span>
                <span className="ml-1.5">{ch.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 3: REGISTRATION STEPS — TERMINAL CARDS
        ════════════════════════════════════════════════════════════════════ */}
        <section
          ref={stepsSection.ref}
          className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32 transition-all duration-700 ${
            stepsSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Registration Blueprint
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              4 Steps to Wholesale Access
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Follow the registration flow on the Anmol Enterprises portal.
            </p>
          </div>

          <div className="space-y-6">
            {STEPS.map((step, idx) => (
              <StepCard key={idx} step={step} index={idx} />
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 4: ELIGIBILITY AT-A-GLANCE
        ════════════════════════════════════════════════════════════════════ */}
        <section
          ref={eligibilitySection.ref}
          className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32 transition-all duration-700 ${
            eligibilitySection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Quick Eligibility Check
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              What You Need to Register
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: UtensilsCrossed,
                title: 'Hotels & Restaurants',
                accentColor: 'amber',
                need: 'GSTIN + FSSAI',
                creditLine: '₹25K — ₹1,00,000',
                payment: 'Net 15–30 Days or COD',
                tag: 'Full Credit Access'
              },
              {
                icon: Coffee,
                title: 'Cafés & QSRs',
                accentColor: 'emerald',
                need: 'Email + Phone',
                creditLine: 'Eligible after 3 orders',
                payment: 'Pay-on-Delivery',
                tag: 'Quick Registration'
              },
              {
                icon: ShoppingCart,
                title: 'Kirana & Retail',
                accentColor: 'violet',
                need: 'Phone + Aadhaar OK',
                creditLine: 'Weekly settlement',
                payment: 'COD / UPI',
                tag: 'No GSTIN Needed'
              }
            ].map((card, i) => {
              const colorMap: Record<string, { border: string; bg: string; text: string; tag: string }> = {
                amber: { border: 'border-t-amber-500', bg: 'bg-amber-400/10', text: 'text-amber-400', tag: 'bg-amber-400/15 text-amber-300 border-amber-400/20' },
                emerald: { border: 'border-t-emerald-500', bg: 'bg-emerald-400/10', text: 'text-emerald-400', tag: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/20' },
                violet: { border: 'border-t-violet-500', bg: 'bg-violet-400/10', text: 'text-violet-400', tag: 'bg-violet-400/15 text-violet-300 border-violet-400/20' }
              }
              const c = colorMap[card.accentColor] || colorMap.amber
              return (
                <div
                  key={i}
                  className={`bg-[#0D1117] border border-slate-700/30 border-t-2 ${c.border} rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 space-y-5`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                      <card.icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.tag}`}>
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{card.title}</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Required</span>
                      <span className={`font-semibold ${c.text}`}>{card.need}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Credit Line</span>
                      <span className="font-semibold text-slate-300">{card.creditLine}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Payment</span>
                      <span className="text-slate-400">{card.payment}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 5: FAQ ACCORDION
        ════════════════════════════════════════════════════════════════════ */}
        <section
          ref={faqSection.ref}
          className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32 transition-all duration-700 ${
            faqSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Common Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              B2B Registration FAQs
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((item, idx) => (
              <div
                key={idx}
                className={`bg-[#0D1117] border rounded-2xl transition-all duration-300 ${
                  activeFaq === idx
                    ? 'border-amber-500/30 shadow-sm shadow-amber-500/5'
                    : 'border-slate-700/30 hover:border-slate-600/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className={`text-sm font-semibold transition-colors ${
                    activeFaq === idx ? 'text-amber-300' : 'text-slate-200'
                  }`}>
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-all duration-300 ${
                      activeFaq === idx ? 'rotate-180 text-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    activeFaq === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/50 pt-4">
                    {item.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 6: CTA BANNER
        ════════════════════════════════════════════════════════════════════ */}
        <section
          ref={ctaSection.ref}
          className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28 transition-all duration-700 ${
            ctaSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-8 sm:p-12 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-8 -top-8 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-3 text-center md:text-left relative z-10">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Ready to Unlock Wholesale Rates?
              </h3>
              <p className="text-sm font-medium text-slate-900/70 max-w-lg">
                Registration takes 2 minutes. Start ordering McCain French Fries, Smiles, and Veggie Burger Patties at distributor prices today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 shrink-0">
              <Link
                href="/account"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-950 text-white font-bold text-sm hover:bg-slate-900 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Register as B2B Partner</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </Link>
              <a
                href="https://wa.me/919112449612?text=Hello%20Anmol%20Enterprises,%20I%20want%20help%20with%20B2B%20Registration"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white/20 hover:bg-white/30 text-slate-950 font-bold text-sm transition-all border border-slate-950/15 flex items-center justify-center gap-2"
              >
                <span>WhatsApp Support</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
