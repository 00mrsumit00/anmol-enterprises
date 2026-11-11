'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Sparkles,
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
  UtensilsCrossed,
  Phone,
  Sun,
  Moon,
  Send,
  Lock,
  Mail,
  User,
  Check,
  MousePointer,
  HelpCircle,
  X
} from 'lucide-react'
import AnimatedLogo from '@/components/storefront/AnimatedLogo'

// ─── TYPES ──────────────────────────────────────────────────────────────────────
type Theme = 'dark' | 'light'

interface TerminalSlide {
  title: string
  subtitle: string
  rows: { label: string; value: string; highlight?: boolean }[]
  pills: { text: string; color: string }[]
  footer: { label: string; badge: string }
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────────
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
    description: 'On the Anmol portal, select the Business / Wholesale Partner option to unlock wholesale carton packaging, B2B tiered rates, and credit facilities that individual consumers cannot see.',
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

// ─── FLOATING TERMINAL CARD (Hero Right Column) ───────────────────────────────────
function FloatingTerminalCard({ theme }: { theme: Theme }) {
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
    amber: 'bg-amber-400/15 text-amber-500 dark:text-amber-300 border-amber-400/30',
    emerald: 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-300 border-emerald-400/30',
    cyan: 'bg-cyan-400/15 text-cyan-600 dark:text-cyan-300 border-cyan-400/30',
    violet: 'bg-violet-400/15 text-violet-600 dark:text-violet-300 border-violet-400/30'
  }

  return (
    <div
      className="relative w-full max-w-[420px] mx-auto lg:mx-0"
      style={{ animation: 'float 6s ease-in-out infinite' }}
    >
      {/* Glow behind card */}
      <div className="absolute -inset-4 bg-amber-500/[0.08] rounded-[2rem] blur-2xl pointer-events-none" />

      <div className={`relative ${
        theme === 'dark'
          ? 'bg-[#0D1117] border-slate-700/40 text-slate-100 shadow-2xl shadow-black/60'
          : 'bg-white border-slate-200/90 text-slate-900 shadow-xl shadow-slate-300/40'
      } border rounded-2xl overflow-hidden transition-all duration-400 ${isTransitioning ? 'opacity-0 scale-[0.97]' : 'opacity-100 scale-100'}`}>
        
        {/* Terminal Header Bar */}
        <div className={`flex items-center justify-between px-4 py-2.5 ${
          theme === 'dark' ? 'bg-[#161B22] border-slate-700/40' : 'bg-slate-100/80 border-slate-200'
        } border-b`}>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className={`font-mono text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} tracking-wider uppercase font-semibold`}>
            {slide.title}
          </span>
          {/* Progress bar */}
          <div className="flex items-center gap-1">
            {TERMINAL_SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === activeSlide ? 'w-4 bg-amber-400' : (theme === 'dark' ? 'w-1.5 bg-slate-600' : 'w-1.5 bg-slate-300')
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-4">
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
            {slide.subtitle}
          </p>

          {/* Data Rows */}
          <div className="space-y-2">
            {slide.rows.map((row, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
                  row.highlight
                    ? (theme === 'dark' ? 'bg-amber-500/[0.08] border-amber-500/20' : 'bg-amber-50 border-amber-200')
                    : (theme === 'dark' ? 'bg-slate-800/40 border-slate-700/30' : 'bg-slate-50 border-slate-200/70')
                }`}
              >
                <span className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} font-medium`}>{row.label}</span>
                <span className={`text-xs font-bold ${
                  row.highlight
                    ? (theme === 'dark' ? 'text-amber-300' : 'text-amber-700')
                    : (theme === 'dark' ? 'text-slate-200' : 'text-slate-800')
                }`}>
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
          <div className={`flex items-center justify-between pt-2 border-t ${theme === 'dark' ? 'border-slate-700/30' : 'border-slate-100'}`}>
            <span className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'} flex items-center gap-1.5`}>
              <Sparkles className="w-3 h-3 text-amber-500" />
              {slide.footer.label}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              {slide.footer.badge}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── LIVE INTERACTIVE REGISTRATION SIMULATOR (Replaces Video) ────────────────────
function RegistrationSimulator({ theme }: { theme: Theme }) {
  // Current step in simulation: 1: Account Type, 2: Outlet Details, 3: GSTIN/FSSAI, 4: OTP, 5: Celebration
  const [simStep, setSimStep] = useState(1)
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState<1 | 2>(1)
  const [otpTimer, setOtpTimer] = useState(30)
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50, clicking: false })
  
  // Simulated form inputs state
  const [accountType, setAccountType] = useState<'CONSUMER' | 'BUSINESS'>('CONSUMER')
  const [ownerName, setOwnerName] = useState('')
  const [outletName, setOutletName] = useState('')
  const [businessType, setBusinessType] = useState('HOTEL')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gstin, setGstin] = useState('')
  const [fssai, setFssai] = useState('')
  const [volume, setVolume] = useState('200-500kg')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpSent, setOtpSent] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Virtual typing helper
  const typeText = useCallback((fullText: string, setter: (val: string) => void, onComplete?: () => void) => {
    let currentIdx = 0
    setter('')
    const interval = setInterval(() => {
      currentIdx++
      setter(fullText.slice(0, currentIdx))
      if (currentIdx >= fullText.length) {
        clearInterval(interval)
        if (onComplete) onComplete()
      }
    }, 45 / speed)
  }, [speed])

  // Click simulation helper
  const triggerClick = useCallback((x: number, y: number, cb: () => void) => {
    setCursorPos({ x, y, clicking: false })
    setTimeout(() => {
      setCursorPos({ x, y, clicking: true })
      setTimeout(() => {
        setCursorPos({ x, y, clicking: false })
        cb()
      }, 200)
    }, 350 / speed)
  }, [speed, setCursorPos])

  // Simulation Sequence Engine
  useEffect(() => {
    if (!isPlaying) return

    let isCancelled = false
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms / speed))

    const runSimulation = async () => {
      // ─── STEP 1: SELECT ACCOUNT TYPE ───
      setSimStep(1)
      setAccountType('CONSUMER')
      setOwnerName('')
      setOutletName('')
      setEmail('')
      setPhone('')
      setGstin('')
      setFssai('')
      setOtpDigits(['', '', '', '', '', ''])
      setOtpSent(false)
      setToastMessage('Step 1: Choose Business / Wholesale Partner Mode')
      await delay(700)
      if (isCancelled) return

      // Click on Business Option
      triggerClick(65, 42, () => {
        setAccountType('BUSINESS')
      })
      await delay(1200)
      if (isCancelled) return

      // ─── STEP 2: OUTLET INFORMATION ───
      setSimStep(2)
      setToastMessage('Step 2: Enter Outlet Details & Verification Email')
      await delay(600)
      if (isCancelled) return

      // Type Owner Name
      triggerClick(30, 24, () => {})
      await delay(300)
      await new Promise<void>(res => typeText('Sumit Sharma', setOwnerName, res))
      await delay(400)
      if (isCancelled) return

      // Type Outlet Name
      triggerClick(30, 42, () => {})
      await delay(300)
      await new Promise<void>(res => typeText('Hotel Grand Treat & Bakers, Latur', setOutletName, res))
      await delay(400)
      if (isCancelled) return

      // Change Business Type to Hotel
      triggerClick(30, 60, () => {
        setBusinessType('HOTEL')
      })
      await delay(400)
      if (isCancelled) return

      // Type Email
      triggerClick(30, 78, () => {})
      await delay(300)
      await new Promise<void>(res => typeText('anmol.partner@gmail.com', setEmail, res))
      await delay(400)
      if (isCancelled) return

      // Type Mobile Number
      triggerClick(75, 78, () => {})
      await delay(300)
      await new Promise<void>(res => typeText('9112449612', setPhone, res))
      await delay(600)
      if (isCancelled) return

      // ─── STEP 3: GSTIN & FSSAI ───
      setSimStep(3)
      setToastMessage('Step 3: Enter GSTIN & FSSAI to Unlock B2B Credit')
      await delay(600)
      if (isCancelled) return

      // Type GSTIN
      triggerClick(30, 32, () => {})
      await delay(300)
      await new Promise<void>(res => typeText('27AGEPT8074F1Z0', setGstin, res))
      await delay(400)
      if (isCancelled) return

      // Type FSSAI
      triggerClick(75, 32, () => {})
      await delay(300)
      await new Promise<void>(res => typeText('11524049000286', setFssai, res))
      await delay(400)
      if (isCancelled) return

      // Select Volume
      triggerClick(50, 56, () => {
        setVolume('200-500kg')
      })
      await delay(700)
      if (isCancelled) return

      // ─── STEP 4: SEND OTP & VERIFY ───
      setSimStep(4)
      setToastMessage('Step 4: Request & Enter 6-Digit Email OTP')
      await delay(600)
      if (isCancelled) return

      // Click Send OTP
      triggerClick(50, 48, () => {
        setOtpSent(true)
        setOtpTimer(30)
      })
      await delay(900)
      if (isCancelled) return

      // Type OTP digits: 7-4-2-8-9-1
      const sampleOtp = ['7', '4', '2', '8', '9', '1']
      for (let i = 0; i < sampleOtp.length; i++) {
        await delay(200)
        triggerClick(32 + i * 7.5, 66, () => {
          setOtpDigits(prev => {
            const next = [...prev]
            next[i] = sampleOtp[i]
            return next
          })
        })
      }
      await delay(600)
      if (isCancelled) return

      // Click Verify Button
      triggerClick(50, 84, () => {})
      await delay(800)
      if (isCancelled) return

      // ─── STEP 5: CELEBRATION / UNLOCKED STATE ───
      setSimStep(5)
      setToastMessage('🎉 B2B Wholesale Account Activated! Credit Line & Carton Rates Live')
      await delay(5000)
      if (isCancelled) return

      // Loop restart
      if (!isCancelled && isPlaying) {
        runSimulation()
      }
    }

    runSimulation()

    return () => {
      isCancelled = true
    }
  }, [isPlaying, speed, typeText, triggerClick])

  // OTP Countdown Timer tick
  useEffect(() => {
    if (!otpSent || simStep !== 4) return
    const interval = setInterval(() => {
      setOtpTimer(prev => (prev > 0 ? prev - 1 : 30))
    }, 1000)
    return () => clearInterval(interval)
  }, [otpSent, simStep])

  const restartSimulation = () => {
    setIsPlaying(false)
    setTimeout(() => {
      setIsPlaying(true)
    }, 50)
  }

  return (
    <div className={`relative w-full rounded-3xl border overflow-hidden transition-all duration-300 ${
      theme === 'dark'
        ? 'bg-[#0D1117] border-slate-700/50 shadow-2xl shadow-black/60'
        : 'bg-white border-slate-200/90 shadow-xl shadow-slate-300/40'
    }`}>
      {/* ─── SIMULATOR TOP CONSOLE BAR ────────────────────────────────────────── */}
      <div className={`flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 border-b gap-3 ${
        theme === 'dark' ? 'bg-[#161B22] border-slate-700/50' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Left: Window Dots & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-xs" />
          </div>
          <span className={`font-mono text-xs font-bold uppercase tracking-wider ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Anmol Commercial Onboarding Simulator
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            LIVE AUTOPLAY DEMO
          </span>
        </div>

        {/* Right: Controls (Speed, Pause, Restart) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSpeed(speed === 1 ? 2 : 1)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
              speed === 2
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : (theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-700 border-slate-200')
            }`}
            title="Toggle playback speed"
          >
            {speed}x SPEED
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={restartSimulation}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Restart from Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── STEP PROGRESS TRACK ──────────────────────────────────────────────── */}
      <div className={`px-4 sm:px-6 py-2.5 border-b flex items-center justify-between overflow-x-auto gap-2 ${
        theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/50 border-slate-200'
      }`}>
        {[
          { num: 1, label: 'Account Type' },
          { num: 2, label: 'Outlet Details' },
          { num: 3, label: 'GST & FSSAI' },
          { num: 4, label: 'OTP Verify' },
          { num: 5, label: 'Carton Rates Live 🎉' }
        ].map((s) => {
          const isActive = simStep === s.num
          const isPassed = simStep > s.num
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                setSimStep(s.num)
                setIsPlaying(false)
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : isPassed
                  ? 'text-emerald-500'
                  : (theme === 'dark' ? 'text-slate-500' : 'text-slate-400')
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                isActive ? 'bg-slate-950 text-white' : isPassed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-500/20'
              }`}>
                {isPassed ? '✓' : s.num}
              </span>
              <span>{s.label}</span>
            </button>
          )
        })}
      </div>

      {/* ─── SIMULATION STAGE (Two-Column Layout) ──────────────────────────────── */}
      <div className="relative p-4 sm:p-7 min-h-[460px] flex flex-col lg:flex-row gap-6">

        {/* VIRTUAL MOUSE CURSOR */}
        <div
          className="absolute pointer-events-none z-50 transition-all duration-300 hidden md:block"
          style={{
            left: `${cursorPos.x}%`,
            top: `${cursorPos.y}%`,
            transform: 'translate(-2px, -2px)'
          }}
        >
          <div className="relative">
            <svg
              className={`w-6 h-6 filter drop-shadow-md ${cursorPos.clicking ? 'scale-90' : 'scale-100'} transition-transform`}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.5 3L11.5 21L14.5 13.5L22 10.5L4.5 3Z"
                fill="#F59E0B"
                stroke="#070A10"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            {cursorPos.clicking && (
              <span className="absolute -inset-2 rounded-full border-2 border-amber-400 animate-ping opacity-75" />
            )}
          </div>
        </div>

        {/* LEFT COLUMN: SIMULATED FORM */}
        <div className="flex-1 space-y-4">

          {/* SIMULATED STEP 1: ACCOUNT TYPE */}
          {simStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                  Step 1 of 4
                </span>
                <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  How will you use Anmol Enterprises?
                </h4>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Select your commercial mode to unlock wholesale pricing.
                </p>
              </div>

              {/* Option 1: Consumer */}
              <div className={`p-4 rounded-2xl border transition-all ${
                accountType === 'CONSUMER'
                  ? 'border-amber-400 bg-amber-500/10 shadow-xs'
                  : (theme === 'dark' ? 'border-slate-800 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600')
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-300 dark:text-slate-200">
                      Individual Consumer
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Standard retail MRP pricing. Single home delivery packs.
                    </span>
                  </div>
                </div>
              </div>

              {/* Option 2: Business (Target of Demo) */}
              <div className={`p-4 rounded-2xl border-2 transition-all relative ${
                accountType === 'BUSINESS'
                  ? 'border-amber-500 bg-amber-500/[0.08] shadow-lg shadow-amber-500/10'
                  : (theme === 'dark' ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white')
              }`}>
                {accountType === 'BUSINESS' && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Selected ✓
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-black block ${accountType === 'BUSINESS' ? 'text-amber-500' : 'text-slate-300'}`}>
                      Business / Wholesale Partner
                    </span>
                    <span className="text-[10px] text-slate-400">
                      For Hotels, Restaurants, Cafes & Retailers. Unlocks Master Cartons & Credit.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATED STEP 2: OUTLET INFORMATION */}
          {simStep === 2 && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                  Step 2 of 4
                </span>
                <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Business Outlet Information
                </h4>
              </div>

              {/* Owner Name */}
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Owner / Manager Name *
                </label>
                <div className={`flex items-center px-3 py-2 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-900/80 border-slate-700/60 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}>
                  <User className="w-3.5 h-3.5 text-slate-400 mr-2" />
                  <span className="text-xs font-semibold font-mono">{ownerName || <span className="text-slate-500 italic">Enter full name</span>}</span>
                  <span className="w-1.5 h-3.5 bg-amber-400 ml-1 animate-pulse" />
                </div>
              </div>

              {/* Outlet Name */}
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Outlet / Establishment Name *
                </label>
                <div className={`flex items-center px-3 py-2 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-900/80 border-slate-700/60 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}>
                  <Building2 className="w-3.5 h-3.5 text-slate-400 mr-2" />
                  <span className="text-xs font-semibold font-mono">{outletName || <span className="text-slate-500 italic">e.g. Grand Hotel & Bakers</span>}</span>
                </div>
              </div>

              {/* Category & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Business Type *
                  </label>
                  <div className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
                    theme === 'dark' ? 'bg-slate-900/80 border-slate-700/60 text-amber-300' : 'bg-slate-50 border-slate-200 text-amber-700'
                  }`}>
                    🏨 Hotel / Multi-Cuisine
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Email Address *
                  </label>
                  <div className={`flex items-center px-3 py-2 rounded-xl border ${
                    theme === 'dark' ? 'bg-slate-900/80 border-slate-700/60 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}>
                    <Mail className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                    <span className="text-xs font-mono truncate">{email || <span className="text-slate-500 italic">name@gmail.com</span>}</span>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Mobile Number (Optional at signup)
                </label>
                <div className={`flex items-center px-3 py-2 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-900/80 border-slate-700/60 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}>
                  <Phone className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                  <span className="text-xs font-mono">{phone || <span className="text-slate-500 italic">10-digit mobile</span>}</span>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATED STEP 3: GSTIN & FSSAI */}
          {simStep === 3 && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                  Step 3 of 4
                </span>
                <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Statutory Tax & Volume Details
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    GSTIN (Optional)
                  </label>
                  <div className={`px-3 py-2 rounded-xl border font-mono text-xs font-bold ${
                    theme === 'dark' ? 'bg-slate-900/80 border-slate-700/60 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-700'
                  }`}>
                    {gstin || '27AGEPT8074F1Z0'}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    FSSAI License (Optional)
                  </label>
                  <div className={`px-3 py-2 rounded-xl border font-mono text-xs font-bold ${
                    theme === 'dark' ? 'bg-slate-900/80 border-slate-700/60 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-700'
                  }`}>
                    {fssai || '11524049000286'}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Estimated Monthly Order Volume
                </label>
                <div className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
                  theme === 'dark' ? 'bg-slate-900/80 border-slate-700/60 text-amber-300' : 'bg-slate-50 border-slate-200 text-amber-700'
                }`}>
                  📦 200 kg – 500 kg / month (Commercial Tier)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>GSTIN enables automated GST input credit invoices & Net 30-Day Credit facilities.</span>
              </div>
            </div>
          )}

          {/* SIMULATED STEP 4: OTP VERIFICATION */}
          {simStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                  Step 4 of 4
                </span>
                <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Verify Email via 6-Digit OTP
                </h4>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  A 6-digit code was sent to <strong className="text-amber-500 font-mono">anmol.partner@gmail.com</strong>
                </p>
              </div>

              {/* 6-Digit Boxes */}
              <div className="flex items-center justify-center gap-2 py-3">
                {otpDigits.map((digit, i) => (
                  <div
                    key={i}
                    className={`w-10 h-12 rounded-xl border flex items-center justify-center font-mono text-lg font-black transition-all ${
                      digit
                        ? 'border-amber-400 bg-amber-500/15 text-amber-500 scale-105'
                        : (theme === 'dark' ? 'border-slate-700 bg-slate-900/60 text-slate-500' : 'border-slate-300 bg-slate-50 text-slate-400')
                    }`}
                  >
                    {digit || '•'}
                  </div>
                ))}
              </div>

              {/* Timer Bar */}
              <div className="flex items-center justify-between text-xs px-2">
                <span className="text-slate-500 font-medium">
                  Resend code in <strong className="text-amber-500 font-mono">{otpTimer}s</strong>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Mail Delivered
                </span>
              </div>

              {/* Simulated Verify Button */}
              <div className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs text-center shadow-lg shadow-amber-500/20">
                Verify & Activate B2B Account →
              </div>
            </div>
          )}

          {/* SIMULATED STEP 5: ACTIVATION VICTORY */}
          {simStep === 5 && (
            <div className="space-y-4 py-2 animate-fade-in text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Wholesale Partner Account Activated! 🎉
                </h4>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Hotel Grand Treat & Bakers is now verified for bulk carton orders.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left pt-2">
                <div className={`p-3 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] text-slate-500 block">Assigned Tier</span>
                  <span className="text-xs font-bold text-amber-500">Tier 1 Master Carton (36% Margin)</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] text-slate-500 block">Credit Facility</span>
                  <span className="text-xs font-bold text-emerald-500">₹50,000 Net 30 Days</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/account"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-md"
                >
                  <span>Ready to Register Your Outlet? Start Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: REAL-TIME COMMERCIAL IMPACT MONITOR */}
        <div className={`lg:w-[280px] shrink-0 p-5 rounded-2xl border space-y-4 flex flex-col justify-between ${
          theme === 'dark' ? 'bg-[#161B22] border-slate-700/50' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/30">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Live Status Telemetry
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pricing Tier:</span>
                <span className="font-bold text-amber-500">
                  {simStep === 1 && accountType === 'CONSUMER' ? 'Retail MRP' : 'Bulk Master Box (36% Off)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Credit Line:</span>
                <span className="font-bold text-emerald-500">
                  {simStep >= 3 ? '₹50,000 (Net 30)' : 'Eligible after GST'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Cold Chain:</span>
                <span className="font-bold text-cyan-500">-18°C Dedicated Van</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Invoices:</span>
                <span className="font-bold text-slate-300 dark:text-slate-300">GST Input Credit</span>
              </div>
            </div>

            {/* Notification / Advice Box */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <span className="text-[10px] font-bold text-amber-500 block uppercase tracking-wider">
                💡 Live Step Guidance
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {toastMessage || 'Follow the simulated mouse clicks to see how each field is filled.'}
              </p>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 pt-3 border-t border-slate-700/30 text-center">
            Zero Real-Time Submission · Pure Interactive Walkthrough
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── STEP TERMINAL CARD COMPONENT ───────────────────────────────────────────────
function StepCard({ step, index, theme }: { step: typeof STEPS[0]; index: number; theme: Theme }) {
  const { ref, isVisible } = useScrollReveal()

  const pillColorMap: Record<string, string> = {
    amber: 'bg-amber-400/15 text-amber-500 dark:text-amber-300 border-amber-400/30',
    emerald: 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-300 border-emerald-400/30',
    cyan: 'bg-cyan-400/15 text-cyan-600 dark:text-cyan-300 border-cyan-400/30',
    violet: 'bg-violet-400/15 text-violet-600 dark:text-violet-300 border-violet-400/30'
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
      <div className={`group rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 ${
        theme === 'dark'
          ? 'bg-[#0D1117] border-slate-700/30 hover:border-slate-600/50 hover:shadow-xl hover:shadow-amber-500/[0.03]'
          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50'
      }`}>
        {/* Terminal Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${
          theme === 'dark' ? 'bg-[#161B22] border-slate-700/30' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className={`font-mono text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} tracking-wider uppercase font-semibold hidden sm:inline`}>
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
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-black text-amber-500/50">
                {step.num}
              </span>
              <h3 className={`text-lg sm:text-xl font-bold leading-snug ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {step.title}
              </h3>
            </div>

            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              {step.description}
            </p>

            <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              step.noteType === 'success'
                ? 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                : (theme === 'dark' ? 'bg-slate-800/40 border-slate-700/30 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600')
            }`}>
              <span className={`font-bold ${step.noteType === 'success' ? 'text-emerald-500' : (theme === 'dark' ? 'text-slate-200' : 'text-slate-800')}`}>
                {step.noteType === 'success' ? '✓ ' : '💡 '}
              </span>
              {step.note}
            </div>
          </div>

          {/* Right: Visual Mock */}
          <div className="lg:w-[240px] shrink-0 flex items-center justify-center">
            {step.visual === 'choice' && (
              <div className="w-full space-y-2.5">
                <div className={`p-3 rounded-xl border text-center ${
                  theme === 'dark' ? 'bg-slate-800/40 border-slate-700/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-xs text-slate-400">👤 Individual Consumer</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">MRP Pricing Only</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/30 text-center relative">
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-slate-950" />
                  </div>
                  <span className="text-xs font-bold text-amber-500">🏢 Business / Wholesale</span>
                  <span className="block text-[10px] text-amber-600 dark:text-amber-400/60 mt-0.5">Carton Rates + Credit</span>
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
                  <div key={i} className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 ${
                    theme === 'dark' ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <cat.icon className={`w-4 h-4 ${
                      cat.color === 'amber' ? 'text-amber-500' :
                      cat.color === 'emerald' ? 'text-emerald-500' :
                      cat.color === 'violet' ? 'text-violet-500' :
                      'text-cyan-500'
                    }`} />
                    <span className="text-[10px] text-slate-500 font-medium">{cat.label}</span>
                  </div>
                ))}
              </div>
            )}
            {step.visual === 'compliance' && (
              <div className="w-full space-y-2.5">
                <div className={`p-3 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] text-slate-400 block mb-1">GSTIN</span>
                  <span className="font-mono text-xs text-emerald-500">27XXXXXXXX●●●●●</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] text-slate-400 block mb-1">FSSAI</span>
                  <span className="font-mono text-xs text-emerald-500">1152404900●●●●</span>
                </div>
              </div>
            )}
            {step.visual === 'verify' && (
              <div className="w-full space-y-2.5">
                <div className={`p-3 rounded-xl border text-center ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] text-slate-400 block">OTP Sent to</span>
                  <span className="text-xs text-slate-500 font-mono">b●●●@gmail.com</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <div key={n} className="w-7 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <span className="font-mono text-sm font-bold text-amber-500">•</span>
                    </div>
                  ))}
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-[10px] font-bold text-emerald-500">✓ Account Live — Start Ordering!</span>
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
  const [theme, setTheme] = useState<Theme>('dark')
  const [isThemeChanging, setIsThemeChanging] = useState(false)
  const [showInquiryModal, setShowInquiryModal] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  // Initialize theme from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('b2b_guide_theme') as Theme
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved)
      }
    } catch {}
  }, [])

  // Top-to-Bottom Curtain Theme Toggle
  const toggleTheme = () => {
    setIsThemeChanging(true)
    setTimeout(() => {
      setTheme(prev => {
        const next = prev === 'dark' ? 'light' : 'dark'
        try {
          localStorage.setItem('b2b_guide_theme', next)
        } catch {}
        return next
      })
    }, 300)

    setTimeout(() => {
      setIsThemeChanging(false)
    }, 700)
  }

  // Scroll-reveal hooks for sections
  const simulatorSection = useScrollReveal()
  const stepsSection = useScrollReveal()
  const eligibilitySection = useScrollReveal()
  const faqSection = useScrollReveal()
  const ctaSection = useScrollReveal()

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      theme === 'dark' ? 'bg-[#070A10] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    } selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden`}>

      {/* ─── TOP-TO-BOTTOM THEME CHANGER ANIMATED CURTAIN ─────────────────────── */}
      <div
        className={`fixed inset-x-0 z-[100] pointer-events-none transition-transform duration-700 ease-in-out ${
          isThemeChanging ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{
          top: 0,
          height: '100vh',
          background: theme === 'dark'
            ? 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)'
            : 'linear-gradient(180deg, #070A10 0%, #0D1117 100%)'
        }}
      />

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
      `}</style>

      {/* ─── AMBIENT BACKGROUND GLOWS ──────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute top-[-15%] left-[-8%] w-[500px] h-[500px] rounded-full blur-[160px] transition-opacity duration-700 ${
            theme === 'dark' ? 'bg-amber-500/[0.07]' : 'bg-amber-400/[0.12]'
          }`}
          style={{ animation: 'float-slow 8s ease-in-out infinite' }}
        />
        <div
          className={`absolute top-[30%] right-[-10%] w-[450px] h-[450px] rounded-full blur-[160px] transition-opacity duration-700 ${
            theme === 'dark' ? 'bg-emerald-500/[0.04]' : 'bg-emerald-400/[0.08]'
          }`}
          style={{ animation: 'float-slow 10s ease-in-out infinite 2s' }}
        />
        <div
          className={`absolute bottom-[-15%] left-[30%] w-[500px] h-[500px] rounded-full blur-[180px] transition-opacity duration-700 ${
            theme === 'dark' ? 'bg-indigo-500/[0.04]' : 'bg-indigo-400/[0.06]'
          }`}
          style={{ animation: 'float-slow 12s ease-in-out infinite 4s' }}
        />
      </div>

      {/* ─── TOP NAVIGATION BAR (Matching Screenshot 2) ───────────────────────── */}
      <nav className={`sticky top-0 z-40 backdrop-blur-2xl border-b transition-colors duration-500 ${
        theme === 'dark' ? 'bg-[#070A10]/85 border-slate-800/60' : 'bg-white/90 border-slate-200/90 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Left: Back button + Original AnimatedLogo */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/account"
              className={`p-2 rounded-xl border transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
                  : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Back to Account"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            {/* Original AnimatedLogo with full bike and wordmark animations */}
            <div className="flex items-center">
              <div className={`px-2.5 py-1 rounded-xl transition-all ${
                theme === 'dark' ? 'bg-white/95 shadow-xs border border-white/20' : ''
              }`}>
                <AnimatedLogo
                  asDiv
                  svgClassName="h-7 sm:h-8 w-auto max-w-[180px] sm:max-w-[220px]"
                  showSubtext={false}
                />
              </div>
              <span className={`hidden md:inline ml-2 text-xs font-semibold ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                / B2B User Guide
              </span>
            </div>
          </div>

          {/* Right Action Cluster (Matching Screenshot 2) */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* 1. Theme Toggle Button (Dark ⇄ Light with Top-to-Bottom Wipe) */}
            <button
              type="button"
              onClick={toggleTheme}
              disabled={isThemeChanging}
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                theme === 'dark'
                  ? 'bg-slate-900/90 border-slate-700/70 text-emerald-400 hover:border-emerald-400/60 hover:shadow-emerald-500/10'
                  : 'bg-white border-slate-300 text-amber-500 hover:border-amber-400 hover:shadow-amber-500/10'
              }`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-emerald-400" />
              ) : (
                <Moon className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {/* 2. Direct Inquiries Button (Matching Screenshot 2 Pill with Phone Icon) */}
            <button
              type="button"
              onClick={() => setShowInquiryModal(true)}
              className={`hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#0D1117] border-slate-700/70 text-white hover:border-amber-400/50 hover:bg-slate-800/80 shadow-xs'
                  : 'bg-white border-slate-300 text-slate-800 hover:border-amber-500 hover:bg-amber-50/40 shadow-xs'
              }`}
            >
              <Phone className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Direct Inquiries</span>
            </button>

            {/* 3. Register Now CTA Button */}
            <Link
              href="/account"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs px-4 sm:px-5 py-2.5 rounded-2xl shadow-lg shadow-amber-500/25 transition-all active:scale-95 whitespace-nowrap"
            >
              <span>Register Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </nav>

      {/* ─── DIRECT INQUIRIES MODAL ───────────────────────────────────────────── */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl border p-6 space-y-5 relative shadow-2xl ${
            theme === 'dark' ? 'bg-[#0D1117] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              type="button"
              onClick={() => setShowInquiryModal(false)}
              className={`absolute top-5 right-5 p-1.5 rounded-xl border ${
                theme === 'dark' ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-900'
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                Direct B2B Commercial Line
              </span>
              <h3 className="text-xl font-black">Speak with Our Operations Team</h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Have custom volume requirements or need assistance with your B2B onboarding?
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <a
                href="tel:+919112449612"
                className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-500 text-amber-500 transition-all font-bold text-sm"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-amber-500" />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">Call Helpline Directly</span>
                    <span className="text-sm font-mono">+91 9112449612</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="https://wa.me/919112449612?text=Hello%20Anmol%20Enterprises,%20I%20want%20to%20inquire%20about%20B2B%20Commercial%20Partnership"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 transition-all font-bold text-sm"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-5 h-5 text-emerald-500" />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">Chat on WhatsApp</span>
                    <span className="text-xs font-medium text-slate-400">Instant response from dispatch</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main className="relative z-10">

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 1: CINEMATIC HERO
        ════════════════════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-24">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left: Hero Headline & Value Statements */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              
              <div className="animate-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" style={{ animation: 'glow-pulse 2s ease-in-out infinite' }} />
                <span className="text-[11px] font-bold text-amber-500">B2B Commercial Onboarding</span>
                <span className="text-slate-400 mx-1">|</span>
                <span className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>3-Minute Walkthrough</span>
              </div>

              <h1 className="animate-fade-up-delay-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
                <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>Become an Anmol</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400">
                  Wholesale Partner.
                </span>
              </h1>

              <p className={`animate-fade-up-delay-2 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Step-by-step interactive simulator and registration guide for Hotels, Restaurants, Cafes & Caterers in Latur & Marathwada.
              </p>

              <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <a
                  href="#simulator-section"
                  className="inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-amber-500/25 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Interactive Walkthrough</span>
                </a>
                <Link
                  href="/account"
                  className={`inline-flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-2xl border transition-all ${
                    theme === 'dark'
                      ? 'text-slate-300 hover:text-white border-slate-700/60 hover:bg-slate-800/40'
                      : 'text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Register as B2B</span>
                </Link>
              </div>

              {/* Value Pills */}
              <div className="animate-fade-up-delay-4 flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start pt-2">
                {[
                  { icon: TrendingUp, text: 'Up to 35% Savings' },
                  { icon: CreditCard, text: 'Net 15–30 Day Credit' },
                  { icon: Snowflake, text: '-18°C Cold Chain' },
                  { icon: FileText, text: 'GST Tax Invoices' }
                ].map((item, i) => (
                  <span key={i} className={`flex items-center gap-1.5 text-xs ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <item.icon className="w-3.5 h-3.5 text-amber-500" />
                    {item.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Floating Terminal Card */}
            <div className="w-full lg:w-auto flex-shrink-0 animate-fade-up-delay-3">
              <FloatingTerminalCard theme={theme} />
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 2: LIVE INTERACTIVE REGISTRATION SIMULATOR (Replaced Video)
        ════════════════════════════════════════════════════════════════════ */}
        <section
          id="simulator-section"
          ref={simulatorSection.ref}
          className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28 transition-all duration-700 ${
            simulatorSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-8 space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
              <MousePointer className="w-3.5 h-3.5" />
              Automated Registration Simulation
            </span>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Interactive Registration Console
            </h2>
            <p className={`text-sm max-w-md mx-auto ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Watch the auto-typing simulation showing how to select B2B mode, enter your outlet details, and verify via OTP.
            </p>
          </div>

          <RegistrationSimulator theme={theme} />
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 3: REGISTRATION BLUEPRINT (Full-Width Terminal Cards)
        ════════════════════════════════════════════════════════════════════ */}
        <section
          ref={stepsSection.ref}
          className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28 transition-all duration-700 ${
            stepsSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
              Registration Blueprint
            </span>
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              4 Steps to Wholesale Access
            </h2>
          </div>

          <div className="space-y-6">
            {STEPS.map((step, idx) => (
              <StepCard key={idx} step={step} index={idx} theme={theme} />
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 4: ELIGIBILITY CHECKLIST
        ════════════════════════════════════════════════════════════════════ */}
        <section
          ref={eligibilitySection.ref}
          className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28 transition-all duration-700 ${
            eligibilitySection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
              Quick Eligibility Check
            </span>
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
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
                amber: { border: 'border-t-amber-500', bg: 'bg-amber-400/10', text: 'text-amber-500', tag: 'bg-amber-400/15 text-amber-500 border-amber-400/20' },
                emerald: { border: 'border-t-emerald-500', bg: 'bg-emerald-400/10', text: 'text-emerald-500', tag: 'bg-emerald-400/15 text-emerald-500 border-emerald-400/20' },
                violet: { border: 'border-t-violet-500', bg: 'bg-violet-400/10', text: 'text-violet-500', tag: 'bg-violet-400/15 text-violet-500 border-violet-400/20' }
              }
              const c = colorMap[card.accentColor] || colorMap.amber
              return (
                <div
                  key={i}
                  className={`border border-t-2 ${c.border} rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 space-y-5 ${
                    theme === 'dark' ? 'bg-[#0D1117] border-slate-700/30' : 'bg-white border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                      <card.icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.tag}`}>
                      {card.tag}
                    </span>
                  </div>
                  <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{card.title}</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Required</span>
                      <span className={`font-semibold ${c.text}`}>{card.need}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Credit Line</span>
                      <span className={`font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{card.creditLine}</span>
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
          className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28 transition-all duration-700 ${
            faqSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
              Common Questions
            </span>
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              B2B Registration FAQs
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((item, idx) => (
              <div
                key={idx}
                className={`border rounded-2xl transition-all duration-300 ${
                  theme === 'dark' ? 'bg-[#0D1117]' : 'bg-white'
                } ${
                  activeFaq === idx
                    ? 'border-amber-500/40 shadow-sm shadow-amber-500/10'
                    : (theme === 'dark' ? 'border-slate-700/30 hover:border-slate-600/40' : 'border-slate-200/90 hover:border-slate-300')
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className={`text-sm font-semibold transition-colors ${
                    activeFaq === idx ? 'text-amber-500' : (theme === 'dark' ? 'text-slate-200' : 'text-slate-800')
                  }`}>
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-all duration-300 ${
                      activeFaq === idx ? 'rotate-180 text-amber-500' : 'text-slate-400'
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    activeFaq === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className={`px-6 pb-5 text-sm leading-relaxed border-t pt-4 ${
                    theme === 'dark' ? 'border-slate-800/50 text-slate-400' : 'border-slate-100 text-slate-600'
                  }`}>
                    {item.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 6: GRADIENT CTA BANNER
        ════════════════════════════════════════════════════════════════════ */}
        <section
          ref={ctaSection.ref}
          className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28 transition-all duration-700 ${
            ctaSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-8 sm:p-12 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-8 -top-8 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-3 text-center md:text-left relative z-10">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Ready to Unlock Wholesale Rates?
              </h3>
              <p className="text-sm font-semibold text-slate-900/80 max-w-lg">
                Registration takes only 2 minutes. Start ordering McCain French Fries, Smiles, and Veggie Burger Patties at distributor prices today.
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
              <button
                type="button"
                onClick={() => setShowInquiryModal(true)}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white/20 hover:bg-white/30 text-slate-950 font-bold text-sm transition-all border border-slate-950/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Direct Inquiries</span>
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
