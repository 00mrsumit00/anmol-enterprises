'use client'

import React from 'react'
import Link from 'next/link'

interface AnimatedLogoProps {
  className?: string
  showSubtext?: boolean
}

export default function AnimatedLogo({ className = '', showSubtext = true }: AnimatedLogoProps) {
  return (
    <Link
      href="/"
      className={`group flex items-center gap-2 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2 rounded-2xl py-1 transition-all ${className}`}
      aria-label="Anmol Enterprises Home"
    >
      <div className="relative flex items-center">
        <svg
          viewBox="0 0 264 68"
          className="h-10 sm:h-12 w-auto max-w-[220px] sm:max-w-[275px] overflow-visible drop-shadow-xs"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Scoped Animations */}
            <style>{`
              @keyframes logoTextFade {
                0% { opacity: 0; transform: translateX(-12px); }
                100% { opacity: 1; transform: translateX(0); }
              }
              @keyframes bikeDriveIn {
                0% { transform: translate(-170px, 0); opacity: 0; }
                40% { opacity: 1; }
                85% { transform: translate(182px, 0); }
                100% { transform: translate(175px, 0); opacity: 1; }
              }
              @keyframes scooterIdleBob {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-1.5px); }
              }
              @keyframes wheelSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes speedTrailPulse {
                0%, 100% { opacity: 0.25; stroke-dashoffset: 0; }
                50% { opacity: 0.95; stroke-dashoffset: -8; }
              }
              @keyframes snowflakeSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes wingGlint {
                0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 1px #FBBF24); }
                50% { opacity: 1; filter: drop-shadow(0 0 4px #FBBF24); }
              }
              @keyframes leafPulse {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(1.5deg); }
              }

              .text-entrance {
                animation: logoTextFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                will-change: opacity, transform;
              }
              .bike-entrance {
                animation: bikeDriveIn 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                will-change: transform, opacity;
                backface-visibility: hidden;
              }
              .scooter-bob {
                animation: scooterIdleBob 1.4s ease-in-out infinite;
                transform-origin: center bottom;
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                will-change: transform;
              }
              .group:hover .scooter-bob {
                transform: translateX(5px) translateY(-1px);
              }
              .wheel-rotate-rear {
                animation: wheelSpin 1s linear infinite;
                transform-origin: 18px 46px;
                will-change: transform;
              }
              .wheel-rotate-front {
                animation: wheelSpin 1s linear infinite;
                transform-origin: 57px 46px;
                will-change: transform;
              }
              .group:hover .wheel-rotate-rear,
              .group:hover .wheel-rotate-front {
                animation-duration: 0.4s;
              }
              .speed-trail {
                animation: speedTrailPulse 0.9s ease-in-out infinite;
                transition: all 0.3s ease;
              }
              .group:hover .speed-trail {
                stroke: #F59E0B;
                stroke-width: 2.5;
                animation-duration: 0.45s;
              }
              .logo-snowflake {
                animation: snowflakeSpin 8s linear infinite;
                transform-origin: 106px 12px;
              }
              .wing-glint {
                animation: wingGlint 3s ease-in-out infinite;
              }
              .organic-leaf {
                animation: leafPulse 4s ease-in-out infinite;
                transform-origin: 10px 14px;
              }
            `}</style>

            {/* Gradients */}
            {/* Sculpted Emerald 3D Gradient */}
            <linearGradient id="emerald3DGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="35%" stopColor="#059669" />
              <stop offset="75%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064E10" />
            </linearGradient>

            {/* Bevel Highlight Top Edge */}
            <linearGradient id="bevelHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>

            {/* Gleaming Polished Golden Wings Gradient */}
            <linearGradient id="goldenWingGrad" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#FFF9A6" />
              <stop offset="30%" stopColor="#FBBF24" />
              <stop offset="70%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            {/* Fresh Green Leaf Blades Gradient */}
            <linearGradient id="freshLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="40%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            {/* Scooter Box Gradient */}
            <linearGradient id="boxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>
          </defs>

          {/* ─── 1. HIGH-FIDELITY 3D 'ANMOL' WORDMARK & EMBLEMS (LEFT SIDE: x = 0 to 165) ─── */}
          <g className="text-entrance" transform="translate(0, 0)">

            {/* ─── A. GLEAMING POLISHED GOLDEN WINGS (Emerging behind 'mol' flowing right) ─── */}
            <g className="wing-glint" transform="translate(100, 6)">
              {/* Primary Feather Layer 1 */}
              <path
                d="M 5 20 C 18 12 36 6 60 2 C 45 10 32 18 15 25 C 26 21 42 16 62 12 C 46 20 30 26 10 30 Z"
                fill="url(#goldenWingGrad)"
              />
              {/* Secondary Feather Layer 2 */}
              <path
                d="M 12 24 C 28 17 48 13 65 10 C 48 18 32 25 18 31 C 28 27 45 23 60 21 C 42 27 26 31 14 34 Z"
                fill="#FBBF24"
                opacity="0.9"
              />
              {/* Wing Metallic Accent Stroke */}
              <path
                d="M 5 20 C 18 12 36 6 60 2"
                stroke="#FFF9A6"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />
            </g>

            {/* ─── B. CRITICAL: SWEEPING VIBRANT GREEN LEAF BLADES ON LETTER 'A' ─── */}
            <g className="organic-leaf" transform="translate(0, 0)">
              {/* Primary Leaf Blade 1 (Sweeping out from top-left of 'A') */}
              <path
                d="M 14 16 C 6 12 -4 4 2 -6 C 10 -2 18 6 18 14 Z"
                fill="url(#freshLeafGrad)"
                stroke="#047857"
                strokeWidth="0.6"
              />
              {/* Primary Leaf Veins */}
              <path d="M 2 -6 Q 10 4 18 14 M 4 -1 Q 8 2 10 -1 M 8 5 Q 12 8 14 5" stroke="#A7F3D0" strokeWidth="0.8" strokeLinecap="round" fill="none" />

              {/* Secondary Leaf Blade 2 (Organic Pair) */}
              <path
                d="M 17 12 C 12 6 6 -2 14 -10 C 20 -4 21 4 20 11 Z"
                fill="url(#freshLeafGrad)"
                stroke="#047857"
                strokeWidth="0.6"
                opacity="0.9"
              />
              {/* Secondary Leaf Veins */}
              <path d="M 14 -10 Q 18 0 20 11 M 16 -5 Q 19 -3 18 -6" stroke="#D1FAE5" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            </g>

            {/* ─── C. 3D SCULPTED EMERALD WORDMARK 'Anmol' ─── */}
            {/* 3D Drop Shadow Base for Tangible Weight */}
            <text
              x="0"
              y="37"
              fontFamily="'Urbanist', 'Cabinet Grotesk', 'Baloo 2', system-ui, sans-serif"
              fontWeight="900"
              fontSize="37"
              letterSpacing="-1.2"
              fill="#04360B"
              opacity="0.8"
            >
              Anmol
            </text>

            {/* Main Sculpted Emerald Text */}
            <text
              x="0"
              y="35"
              fontFamily="'Urbanist', 'Cabinet Grotesk', 'Baloo 2', system-ui, sans-serif"
              fontWeight="900"
              fontSize="37"
              letterSpacing="-1.2"
              fill="url(#emerald3DGrad)"
              stroke="#04470F"
              strokeWidth="0.8"
            >
              Anmol
            </text>

            {/* Top Bevel Highlight Sheen Layer */}
            <text
              x="0"
              y="35"
              fontFamily="'Urbanist', 'Cabinet Grotesk', 'Baloo 2', system-ui, sans-serif"
              fontWeight="900"
              fontSize="37"
              letterSpacing="-1.2"
              fill="url(#bevelHighlight)"
            >
              Anmol
            </text>



            {/* ─── E. SUBTITLE & TAGLINE RIBBON ─── */}
            {/* — ENTERPRISES — */}
            <g transform="translate(0, 48)">
              <line x1="0" y1="-4" x2="16" y2="-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
              <text
                x="20"
                y="0"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="900"
                fontSize="10.5"
                letterSpacing="3.5"
                fill="#1E293B"
              >
                ENTERPRISES
              </text>
              <line x1="140" y1="-4" x2="156" y2="-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Tagline Ribbon */}
            {showSubtext && (
              <g transform="translate(0, 52)">
                <rect x="0" y="0" width="156" height="13" rx="4" fill="url(#goldenWingGrad)" />
                <text
                  x="6"
                  y="9"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight="900"
                  fontSize="7.2"
                  letterSpacing="0.4"
                  fill="#451A03"
                >
                  FROZEN FOOD DELIVERY PARTNER
                </text>
              </g>
            )}

          </g>

          {/* ─── 2. DELIVERY BIKE RIDER (RIGHT SIDE: Drives in from Left & Parks Next to Wordmark) ─── */}
          <g className="bike-entrance">
            
            {/* Speed Trails Behind Rear Box */}
            <g className="speed-trail">
              <line x1="-12" y1="22" x2="-2" y2="22" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2" />
              <line x1="-16" y1="29" x2="-5" y2="29" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2" />
              <line x1="-10" y1="36" x2="-1" y2="36" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3" />
            </g>

            {/* Scooter Assembly with Engine Bobbing */}
            <g className="scooter-bob">
              
              {/* Scooter Body & Chassis */}
              <path d="M 8 38 Q 4 28 14 28 L 38 28 Q 44 28 48 35 L 54 35 Q 60 35 61 40 L 61 46 L 52 46 Q 52 39 44 39 Q 36 39 36 46 L 26 46 Q 26 39 18 39 Q 10 39 10 46 L 6 46 Z" fill="url(#goldenWingGrad)" />

              {/* Floorboard */}
              <rect x="28" y="40" width="14" height="3.5" rx="1.5" fill="#334155" />

              {/* Front Shield & Steering Column */}
              <path d="M 44 30 L 52 18 Q 54 14 58 15 L 60 18 L 54 32 Z" fill="#D97706" />
              <path d="M 48 21 L 56 21 L 58 28 L 49 28 Z" fill="url(#goldenWingGrad)" />

              {/* Headlight */}
              <circle cx="58" cy="18" r="3" fill="#FEF08A" stroke="#B45309" strokeWidth="0.8" />
              <path d="M 60 16 L 68 14 L 68 22 L 60 20 Z" fill="url(#goldenWingGrad)" opacity="0.15" />

              {/* Rear Delivery Box (Green with Snowflake) */}
              <rect x="1" y="12" width="18" height="17" rx="3" fill="url(#boxGrad)" stroke="#FEF08A" strokeWidth="0.8" />
              <rect x="3" y="14" width="14" height="2.5" rx="1" fill="#FBBF24" />
              
              {/* Snowflake Emblem on Box */}
              <g className="logo-snowflake">
                <path d="M 10 17 L 10 23 M 7 20 L 13 20 M 8 18 L 12 22 M 8 22 L 12 18" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
              </g>

              {/* Rider Figure */}
              {/* Legs */}
              <path d="M 22 28 L 30 26 L 32 38 L 38 38" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              
              {/* Jacket (Brand Emerald) */}
              <path d="M 20 21 C 22 17 28 17 32 20 C 34 22 38 26 38 28 L 28 30 Z" fill="url(#emerald3DGrad)" />
              
              {/* Arm & Handlebar */}
              <path d="M 28 21 L 40 23 L 50 19" stroke="#059669" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="50" cy="19" r="1.5" fill="#0F172A" />

              {/* Helmet (Safety Yellow with Visor) */}
              <circle cx="28" cy="12" r="6" fill="#FBBF24" />
              <path d="M 28 8 Q 33 8 33 12 L 28 13 Z" fill="#0F172A" />
              <path d="M 24 12 Q 24 8 28 8 Q 32 8 32 12 Q 32 14 28 14 Z" fill="none" stroke="#B45309" strokeWidth="0.8" />

              {/* Wheels */}
              {/* Rear Wheel */}
              <g className="wheel-rotate-rear">
                <circle cx="18" cy="46" r="7.5" fill="#1E293B" />
                <circle cx="18" cy="46" r="4" fill="#94A3B8" />
                <circle cx="18" cy="46" r="2" fill="#F8FAFC" />
                <line x1="18" y1="38.5" x2="18" y2="53.5" stroke="#475569" strokeWidth="1" />
                <line x1="10.5" y1="46" x2="25.5" y2="46" stroke="#475569" strokeWidth="1" />
              </g>

              {/* Front Wheel */}
              <g className="wheel-rotate-front">
                <circle cx="57" cy="46" r="7.5" fill="#1E293B" />
                <circle cx="57" cy="46" r="4" fill="#94A3B8" />
                <circle cx="57" cy="46" r="2" fill="#F8FAFC" />
                <line x1="57" y1="38.5" x2="57" y2="53.5" stroke="#475569" strokeWidth="1" />
                <line x1="49.5" y1="46" x2="64.5" y2="46" stroke="#475569" strokeWidth="1" />
              </g>

              {/* Ground Shadow */}
              <ellipse cx="38" cy="54" rx="30" ry="2" fill="#000000" opacity="0.12" />
            </g>

          </g>

        </svg>
      </div>
    </Link>
  )
}
