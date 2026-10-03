'use client'

import React, { useState, useEffect } from 'react'
import { ShieldCheck, Lock, RefreshCw, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface OtpVerificationModalProps {
  isOpen: boolean
  phone?: string
  email?: string
  channel?: 'SMS' | 'EMAIL'
  purpose: 'SIGNUP' | 'GUEST_CHECKOUT'
  onClose: () => void
  onVerified: (proofToken: string) => void
  onSwitchToLogin?: (emailOrPhone?: string) => void
}

export default function OtpVerificationModal({
  isOpen,
  phone = '',
  email = '',
  channel = 'SMS',
  purpose,
  onClose,
  onVerified,
  onSwitchToLogin
}: OtpVerificationModalProps) {
  const { showToast } = useToast()
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [cooldown, setCooldown] = useState(60)
  const [errorMsg, setErrorMsg] = useState('')
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false)

  // Cooldown countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isOpen && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isOpen, cooldown])

  // Trigger initial OTP send when modal opens
  useEffect(() => {
    if (isOpen && ((channel === 'SMS' && phone) || (channel === 'EMAIL' && email))) {
      sendOtp()
    }
  }, [isOpen, phone, email, channel])

  const sendOtp = async () => {
    setIsSending(true)
    setErrorMsg('')
    try {
      const endpoint = channel === 'EMAIL' ? '/api/otp/send-email' : '/api/otp/send'
      const payload = channel === 'EMAIL' ? { email, purpose } : { phone, purpose }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.alreadyRegistered || (data.error && data.error.toLowerCase().includes('already registered'))) {
          setIsAlreadyRegistered(true)
        }
        throw new Error(data.error || 'Failed to send OTP')
      }

      setIsAlreadyRegistered(false)
      if (channel === 'EMAIL') {
        showToast('6-digit OTP code sent via Email to ' + email, 'info')
      } else {
        showToast('6-digit OTP code sent via SMS to +91 ' + phone, 'info')
      }
      setCooldown(data.cooldownSeconds || 60)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP')
      showToast(err.message || 'Failed to send OTP', 'error')
    } finally {
      setIsSending(false)
    }
  }

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste of 6 digits
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newOtp = [...otp]
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d
      })
      setOtp(newOtp)
      const nextInput = document.getElementById(`otp-input-${Math.min(digits.length, 5)}`)
      nextInput?.focus()
      return
    }

    const digit = value.replace(/\D/g, '')
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    // Auto-focus next box
    if (digit && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = otp.join('')
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the OTP code.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')
    try {
      const endpoint = channel === 'EMAIL' ? '/api/otp/verify-email' : '/api/otp/verify'
      const payload = channel === 'EMAIL' ? { email, code: fullCode, purpose } : { phone, code: fullCode, purpose }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP code')
      }

      if (channel === 'EMAIL') {
        showToast('Email address verified successfully!', 'success')
        onVerified(data.emailOtpToken)
      } else {
        showToast('Phone number verified successfully!', 'success')
        onVerified(data.phoneOtpToken)
      }
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed')
      showToast(err.message || 'Verification failed', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-150 relative animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#0c831f] border border-emerald-100 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">
            {channel === 'EMAIL' ? 'Verify Email Address' : 'Verify Mobile Number'}
          </h3>
          <p className="text-xs text-gray-500 max-w-xs font-medium">
            {channel === 'EMAIL' ? (
              <>Enter the 6-digit security OTP sent via Email to <span className="font-extrabold text-gray-800">{email}</span></>
            ) : (
              <>Enter the 6-digit security OTP sent via SMS to <span className="font-extrabold text-gray-800">+91 {phone}</span></>
            )}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 flex flex-col gap-2">
            <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {isAlreadyRegistered && onSwitchToLogin && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onSwitchToLogin(channel === 'EMAIL' ? email : phone)
                }}
                className="w-full py-2.5 px-3 bg-brand-orange hover:bg-brand-orange-dark active:scale-98 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
              >
                <span>Existing Account Found — Click Here to Sign In</span>
              </button>
            )}
          </div>
        )}

        {/* 6-Digit OTP Box Grid */}
        <form onSubmit={handleVerify} className="flex flex-col gap-6">
          <div className="flex justify-center gap-2 sm:gap-2.5">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={e => handleInputChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black text-gray-900 bg-gray-50 border-2 border-gray-200 focus:border-[#0c831f] focus:bg-white rounded-xl outline-none transition-all shadow-sm"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || otp.join('').length !== 6}
            className="w-full bg-[#0c831f] hover:bg-[#096918] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Verify & Proceed</span>
              </>
            )}
          </button>
        </form>

        {/* Resend Cooldown & Action */}
        <div className="mt-6 flex items-center justify-between text-xs border-t border-gray-100 pt-4">
          <span className="text-gray-500 font-medium">Didn't receive code?</span>
          <button
            type="button"
            disabled={cooldown > 0 || isSending}
            onClick={sendOtp}
            className="font-extrabold text-[#0c831f] hover:text-[#096918] disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
            <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}</span>
          </button>
        </div>

      </div>
    </div>
  )
}
