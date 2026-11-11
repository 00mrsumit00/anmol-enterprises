'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import {
  Building2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  CheckCircle2,
  FileText,
  CreditCard,
  Truck,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Sparkles,
  HelpCircle,
  Clock,
  Percent,
  BadgePercent,
  Video,
  Layers,
  MapPin,
  ExternalLink
} from 'lucide-react'

interface Chapter {
  time: number
  label: string
  description: string
}

const CHAPTERS: Chapter[] = [
  { time: 0, label: '0:00 — Account Type', description: 'Selecting Business / Wholesale Partner' },
  { time: 65, label: '1:05 — Outlet Info', description: 'Entering Business Name, Category & Address' },
  { time: 110, label: '1:50 — GSTIN & FSSAI', description: 'Entering tax credentials to unlock credit lines' },
  { time: 150, label: '2:30 — Email OTP', description: 'Instant verification code & account creation' },
  { time: 195, label: '3:15 — Wholesale Catalog', description: 'Browsing master cartons & wholesale rates' }
]

export default function B2BRegistrationGuidePage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(222) // 3m 42s default
  const [activeChapter, setActiveChapter] = useState(0)
  const [customYoutubeUrl, setCustomYoutubeUrl] = useState('')
  const [videoMode, setVideoMode] = useState<'LOCAL' | 'EMBED'>('LOCAL')
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const cur = videoRef.current.currentTime
    setCurrentTime(cur)

    // Update active chapter
    for (let i = CHAPTERS.length - 1; i >= 0; i--) {
      if (cur >= CHAPTERS[i].time) {
        setActiveChapter(i)
        break
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 222)
    }
  }

  const seekToChapter = (timeInSeconds: number, index: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = timeInSeconds
    setCurrentTime(timeInSeconds)
    setActiveChapter(index)
    if (!isPlaying) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = val
      setCurrentTime(val)
    }
  }

  const handleFullscreen = () => {
    if (!videoRef.current) return
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen()
    }
  }

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

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      {/* ─── AMBIENT BACKGROUND GLOW ────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[160px]" />
      </div>

      {/* ─── STICKY HEADER ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0A0D14]/85 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
              title="Back to Login / Registration"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-black text-slate-950 shadow-md shadow-amber-500/20">
                <Building2 className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight text-white block leading-tight">
                  Anmol <span className="text-amber-400">Enterprises</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  B2B Commercial Partner Onboarding
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 transition"
            >
              <span>Back to Portal</span>
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-amber-500/25 transition active:scale-95"
            >
              <span>Register as B2B</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
        
        {/* ─── 1. HERO SECTION ──────────────────────────────────────────────── */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Official B2B Registration Guide & Video Demonstration</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.15]">
            How to Register as an Anmol{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">
              Commercial Partner
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            A comprehensive, 3-minute video masterclass and step-by-step walkthrough for Hotels, Restaurants, Cafes, Caterers & Retail Outlets in Latur & Marathwada.
          </p>

          {/* Quick Perks Strip */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <span className="text-lg mb-1 block">📦</span>
              <span className="text-xs font-black text-white block">Bulk Box Pricing</span>
              <span className="text-[10px] text-slate-400">Save up to 35% vs retail MRP</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <span className="text-lg mb-1 block">💳</span>
              <span className="text-xs font-black text-white block">Net 15–30 Days Credit</span>
              <span className="text-[10px] text-slate-400">For verified commercial outlets</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <span className="text-lg mb-1 block">🚚</span>
              <span className="text-xs font-black text-white block">-18°C Cold Chain</span>
              <span className="text-[10px] text-slate-400">Guaranteed frozen doorstep delivery</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <span className="text-lg mb-1 block">🧾</span>
              <span className="text-xs font-black text-white block">GST Input Invoices</span>
              <span className="text-[10px] text-slate-400">Instant Excel ledgers & PDF bills</span>
            </div>
          </div>
        </section>

        {/* ─── 2. VIDEO MASTERCLASS SECTION ─────────────────────────────────── */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Registration Video Walkthrough (3:42)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Watch the complete screencast showing how to fill out the form, verify your email, and unlock wholesale rates.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-[11px] font-bold text-slate-400">Source:</span>
              <button
                type="button"
                onClick={() => setVideoMode('LOCAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  videoMode === 'LOCAL'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Local / HD Stream
              </button>
              <button
                type="button"
                onClick={() => setVideoMode('EMBED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  videoMode === 'EMBED'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                YouTube / Embed
              </button>
            </div>
          </div>

          {/* Embedded YouTube / Vimeo Input if in EMBED mode */}
          {videoMode === 'EMBED' && (
            <div className="mt-4 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
              <input
                type="text"
                placeholder="Paste YouTube or Vimeo URL here (e.g. https://youtu.be/...)"
                value={customYoutubeUrl}
                onChange={(e) => setCustomYoutubeUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-400"
              />
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                Default: Local Demo Video
              </span>
            </div>
          )}

          {/* Video Player Container */}
          <div className="mt-5 relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl group">
            {videoMode === 'EMBED' && customYoutubeUrl ? (
              <iframe
                src={getYoutubeEmbedUrl(customYoutubeUrl)}
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

                {/* Big Play Overlay (when paused) */}
                {!isPlaying && (
                  <div
                    onClick={togglePlay}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xs cursor-pointer group-hover:bg-black/30 transition"
                  >
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/40 transform group-hover:scale-105 active:scale-95 transition-all">
                      <Play className="w-8 h-8 fill-slate-950 ml-1" />
                    </div>
                    <p className="mt-4 text-sm font-black text-white tracking-wide uppercase">
                      Click to Play Demo (3:42)
                    </p>
                    <p className="text-xs text-slate-300 font-medium mt-1">
                      Step-by-step B2B registration walkthrough
                    </p>
                  </div>
                )}

                {/* Custom Control Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 sm:p-4 flex flex-col gap-2 opacity-95 group-hover:opacity-100 transition">
                  {/* Progress Slider */}
                  <input
                    type="range"
                    min={0}
                    max={duration || 222}
                    step={0.5}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />

                  {/* Buttons Row */}
                  <div className="flex items-center justify-between text-xs text-white">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white transition cursor-pointer"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      </button>

                      <button
                        type="button"
                        onClick={toggleMute}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white transition cursor-pointer"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <span className="font-mono text-[11px] text-slate-300">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline text-[11px] text-amber-300 font-bold bg-amber-400/20 px-2 py-0.5 rounded-md">
                        {CHAPTERS[activeChapter]?.label.split(' — ')[1] || 'Registration Walkthrough'}
                      </span>
                      <button
                        type="button"
                        onClick={handleFullscreen}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white transition cursor-pointer"
                        title="Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Interactive Chapter Jump Chips */}
          <div className="mt-5 space-y-2">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
              Jump to Chapter:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {CHAPTERS.map((ch, idx) => {
                const isActive = activeChapter === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => seekToChapter(ch.time, idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-400/15 border-amber-400/50 text-amber-300 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black block text-white leading-tight">
                      {ch.label}
                    </span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {ch.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── 3. STEP-BY-STEP VISUAL CARDS ─────────────────────────────────── */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Registration Blueprint
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              4 Simple Steps to Unlock Wholesale Access
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Follow these simple steps on the Anmol registration portal to set up your business account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Step 1 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center border border-amber-500/30">
                    1
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Step 1 of 4
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Choose &quot;Business / Wholesale Partner&quot;
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  On the portal, you will be asked how you will use Anmol Enterprises. Choose the{' '}
                  <strong className="text-amber-400">Business / Wholesale Partner</strong> option. This enables wholesale carton packaging, B2B tiered rates, and credit facilities that individual consumers cannot see.
                </p>
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400">
                  <strong className="text-slate-200">💡 Important:</strong> Individual consumer accounts only purchase single retail packs at MRP. To access Master Cartons (20 packs) and Medium Boxes (10 packs), select Business.
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center border border-emerald-500/30">
                    2
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Step 2 of 4
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Enter Business Outlet Details
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Provide your official establishment name (e.g. <em>Hotel Grand Treat</em>, <em>Cafe Mocha</em>) and choose your outlet category:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                    ☕ <strong>Cafe / Fast Food QSR</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                    🍽️ <strong>Hotel / Restaurant</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                    🛒 <strong>Kirana / Supermarket</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                    🎉 <strong>Caterer / Cloud Kitchen</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 font-black text-sm flex items-center justify-center border border-indigo-500/30">
                    3
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Step 3 of 4
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Add GSTIN & FSSAI (Optional for Small Vendors)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your 15-character GSTIN to claim GST input tax credit and generate official statutory tax invoices with HSN summaries automatically.
                </p>
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <p>
                    <strong className="text-emerald-400">✓ Have GSTIN?</strong> Unlocks 15–30 day credit limits and automatic GST credit invoices.
                  </p>
                  <p>
                    <strong className="text-amber-400">⚡ No GSTIN?</strong> No problem! Small cloud kitchens and kiranas can leave this empty and order with Cash-on-Delivery or UPI.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 font-black text-sm flex items-center justify-center border border-teal-500/30">
                    4
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Step 4 of 4
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Verify with Email OTP & Instant Ordering
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your business email. A 6-digit verification code will be sent immediately. Enter the code and set your password to finalize your account.
                </p>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>
                    <strong>Instant Activation:</strong> Your wholesale account is live immediately! You can start adding wholesale cartons to your cart right away.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. REQUIRED DOCUMENTS MATRIX ─────────────────────────────────── */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Document Checklist by Business Type
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Check what information you need before filling out the registration form.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full self-start">
              Zero Signup Fees
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-black">Business Type</th>
                  <th className="py-3 px-4 font-black">Mandatory</th>
                  <th className="py-3 px-4 font-black">Recommended</th>
                  <th className="py-3 px-4 font-black">Default Payment Mode</th>
                  <th className="py-3 px-4 font-black">Credit Facility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-bold text-white">Hotels & Multi-Cuisine Restaurants</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold">Name, Phone, Email, Address</td>
                  <td className="py-3.5 px-4">GSTIN, FSSAI Number</td>
                  <td className="py-3.5 px-4">Net 15–30 Days or COD</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">₹25,000 – ₹1,00,000</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-bold text-white">Cafes & Fast Food QSRs</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold">Name, Phone, Email, Address</td>
                  <td className="py-3.5 px-4">FSSAI or GSTIN</td>
                  <td className="py-3.5 px-4">Pay-on-Delivery (COD/UPI)</td>
                  <td className="py-3.5 px-4 text-amber-400 font-bold">Eligible after 3 orders</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-bold text-white">Kirana & Retail Grocery Stores</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold">Name, Phone, Email, Address</td>
                  <td className="py-3.5 px-4">Shop Act / Board Photo</td>
                  <td className="py-3.5 px-4">Pay-on-Delivery (COD/UPI)</td>
                  <td className="py-3.5 px-4 text-amber-400 font-bold">Weekly settlement</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-bold text-white">Caterers & Cloud Kitchens</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold">Name, Phone, Email, Address</td>
                  <td className="py-3.5 px-4">FSSAI License</td>
                  <td className="py-3.5 px-4">Advance or Pay-on-Delivery</td>
                  <td className="py-3.5 px-4 text-slate-400">On custom volume agreement</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── 5. FREQUENTLY ASKED QUESTIONS ────────────────────────────────── */}
        <section className="space-y-4 max-w-3xl mx-auto">
          <div className="text-center space-y-1 mb-6">
            <span className="text-xs font-black uppercase text-amber-400">Got Questions?</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              B2B Commercial FAQs
            </h2>
          </div>

          {[
            {
              q: 'Can I register and order if I do not have a GST number?',
              a: 'Yes! Small cafes, kirana stores, and cloud kitchens can register by entering their business outlet name and selecting "Kirana / Cloud Kitchen" mode. You can pay via Cash on Delivery or UPI upon delivery.'
            },
            {
              q: 'How does the B2B Credit facility work?',
              a: 'Commercial accounts that submit a valid GSTIN and business address are reviewed by our operations team within 2–4 hours. Once verified, a credit limit (Net 15–30 days) is assigned to your account, allowing you to order frozen stocks and settle periodically.'
            },
            {
              q: 'How do I download my monthly ledger and tax invoices for accounting?',
              a: 'You can download complete official Excel (.xlsx) financial ledgers with opening balances, debits, credits, and running totals directly from your account page (/account) or order history (/order-again). Statutory tax invoices are also emailed automatically upon delivery.'
            },
            {
              q: 'What is the minimum order quantity for wholesale carton pricing?',
              a: 'Wholesale pricing is available on Medium Boxes (10 packs) and Bulk Master Cartons (20 packs). You can also mix different items to fulfill your kitchen needs.'
            },
            {
              q: 'What if I need emergency frozen food stock on the same day?',
              a: 'We operate dedicated cold-chain delivery vans in Latur with Morning and Evening dispatch slots. Select the immediate slot during checkout or contact us via 1-tap WhatsApp chat for priority dispatch.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-amber-400 transition cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    activeFaq === idx ? 'rotate-180 text-amber-400' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* ─── 6. BOTTOM CALL TO ACTION ─────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-10 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-2 text-center md:text-left relative z-10">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Ready to Upgrade Your Kitchen with Wholesale Rates?
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-900/80 max-w-xl">
              Registration takes only 2 minutes. Start ordering McCain French Fries, Smiles, and Veggie Burger Patties at distributor prices today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 shrink-0">
            <Link
              href="/account"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-950 text-white font-black text-xs hover:bg-slate-900 transition shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Register as B2B Partner</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </Link>
            <a
              href="https://wa.me/919888665971?text=Hello%20Anmol%20Enterprises,%20I%20want%20help%20with%20B2B%20Registration"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white/20 hover:bg-white/30 text-slate-950 font-black text-xs transition border border-slate-950/20 flex items-center justify-center gap-2"
            >
              <span>WhatsApp Support</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>

      </main>
    </div>
  )
}
