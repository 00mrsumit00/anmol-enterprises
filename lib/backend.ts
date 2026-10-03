import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import express, { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import { Server as SocketIOServer } from 'socket.io'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from './prisma'
import { signToken, verifyToken, authMiddleware, requireRole } from './auth'
import { env } from './env'
import { sendTwilioVerifyOtp, checkTwilioVerifyOtp, isTwilioLive, toE164India } from './twilio'

// ─── UTILITIES & INITIALIZERS ────────────────────────────────────────────────

export const apiRouter = Router()
let ioInstance: SocketIOServer | null = null

export function setSocketIO(io: SocketIOServer) {
  ioInstance = io
}

// In-memory IP rate limiter tracker for OTP send requests (max 10 per IP per hour)
const ipOtpSendTracker = new Map<string, number[]>()

function checkIpOtpRateLimit(ip: string): boolean {
  if (process.env.NODE_ENV !== 'production' || ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1')) {
    return true
  }
  const now = Date.now()
  const windowMs = 60 * 60 * 1000 // 1 hour window
  const maxPerIp = 10

  const timestamps = (ipOtpSendTracker.get(ip) || []).filter(t => now - t < windowMs)
  if (timestamps.length >= maxPerIp) return false
  
  timestamps.push(now)
  ipOtpSendTracker.set(ip, timestamps)
  return true
}

// Generate cryptographically secure random 6-digit OTP code using CSPRNG
function generateCsprngOtp(): string {
  const num = crypto.randomInt(100000, 1000000)
  return String(num)
}

// Send OTP via Twilio Verify Service (or fallback to dev stub)
async function sendSmsOtp(phone: string): Promise<boolean> {
  // 1. Use Twilio Verify if configured (Twilio generates and sends the code itself)
  if (isTwilioLive()) {
    const result = await sendTwilioVerifyOtp(phone)
    if (result.success) return true
    console.error('[Twilio Verify]: OTP send failed:', result.error)
    // Fall through to stub in non-production
    if (process.env.NODE_ENV === 'production') return false
  }

  // 2. Dev/test stub — log to console so developer can see the code
  console.log(`[SMS Gateway Stub]: Twilio not configured. In production, OTP would be sent to +91${phone}`)
  return true
}

// Send OTP via Brevo HTTPS API (Uses HTTPS port 443 — NEVER blocked by Render Free Tier firewall)
async function sendEmailViaBrevo(apiKey: string, toEmail: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const senderEmail = process.env.SMTP_USER || 'anmolenterprizes2026@gmail.com'
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey.trim(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'Anmol Enterprises',
          email: senderEmail
        },
        to: [{ email: toEmail }],
        subject: `[Anmol Enterprises] ${code} is your Email Verification Code`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0c831f; margin: 0; font-size: 22px; font-weight: 800;">Anmol Enterprises — Latur</h2>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Direct McCain Frozen Food Distribution</p>
            </div>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="font-size: 13px; color: #475569; margin: 0 0 10px 0; font-weight: 600;">Your 6-Digit Email Verification Code:</p>
              <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0c831f; font-family: monospace;">
                ${code}
              </div>
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 15px 0 0 0;">
              This code will expire in <strong>10 minutes</strong>. Please enter this code on the registration page to verify your email address. Never share this code with anyone.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
            <p style="font-size: 11px; color: #94a3b8; margin: 0; text-align: center;">
              © ${new Date().getFullYear()} Anmol Enterprises, Latur, Maharashtra. If you did not request this code, you can safely ignore this email.
            </p>
          </div>
        `
      })
    })

    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.message || JSON.stringify(data) }
    }
    console.log(`[Brevo API]: Verification email successfully sent to ${toEmail}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Brevo network request failed' }
  }
}

// Send OTP via Resend HTTPS API (Uses HTTPS port 443)
async function sendEmailViaResend(apiKey: string, toEmail: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const fromAddress = process.env.SMTP_FROM_ADDRESS || 'Anmol Enterprises <onboarding@resend.dev>'
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toEmail],
        subject: `[Anmol Enterprises] ${code} is your Email Verification Code`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0c831f; margin: 0; font-size: 22px; font-weight: 800;">Anmol Enterprises — Latur</h2>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Direct McCain Frozen Food Distribution</p>
            </div>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="font-size: 13px; color: #475569; margin: 0 0 10px 0; font-weight: 600;">Your 6-Digit Email Verification Code:</p>
              <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0c831f; font-family: monospace;">
                ${code}
              </div>
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 15px 0 0 0;">
              This code will expire in <strong>10 minutes</strong>. Please enter this code on the registration page to verify your email address.
            </p>
          </div>
        `
      })
    })

    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.message || JSON.stringify(data) }
    }
    console.log(`[Resend API]: Verification email successfully sent to ${toEmail}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Resend network request failed' }
  }
}

// Send OTP via standard Nodemailer SMTP (Gmail / Custom Host)
async function sendEmailViaSmtp(toEmail: string, code: string): Promise<{ success: boolean; error?: string }> {
  const host = (process.env.SMTP_HOST || '').trim()
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = (process.env.SMTP_USER || '').trim()
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '')
  const from = process.env.SMTP_FROM_ADDRESS || `Anmol Enterprises <${user || 'anmolenterprizes2026@gmail.com'}>`

  if (!host || !user || !pass) {
    return { 
      success: false, 
      error: `Incomplete SMTP configuration in environment: host=${host ? 'OK' : 'MISSING'}, user=${user ? 'OK' : 'MISSING'}, pass=${pass ? 'OK' : 'MISSING'}` 
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 8000, // 8s fail-fast timeout if port blocked
      socketTimeout: 8000
    })

    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `[Anmol Enterprises] ${code} is your Email Verification Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0c831f; margin: 0; font-size: 22px; font-weight: 800;">Anmol Enterprises — Latur</h2>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Direct McCain Frozen Food Distribution</p>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="font-size: 13px; color: #475569; margin: 0 0 10px 0; font-weight: 600;">Your 6-Digit Email Verification Code:</p>
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0c831f; font-family: monospace;">
              ${code}
            </div>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 15px 0 0 0;">
            This code will expire in <strong>10 minutes</strong>. Please enter this code on the registration page to verify your email address. Never share this code with anyone.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
          <p style="font-size: 11px; color: #94a3b8; margin: 0; text-align: center;">
            © ${new Date().getFullYear()} Anmol Enterprises, Latur, Maharashtra. If you did not request this code, you can safely ignore this email.
          </p>
        </div>
      `
    })
    console.log(`[SMTP Nodemailer]: Verification email sent to ${toEmail}`)
    return { success: true }
  } catch (err: any) {
    const isTimeout = err.code === 'ETIMEDOUT' || err.message?.includes('timeout') || err.code === 'ECONNREFUSED'
    const note = isTimeout ? ' (Notice: Render Free Tier blocks outbound SMTP ports 25, 465, and 587. Please add BREVO_API_KEY to Render Environment variables for HTTP delivery)' : ''
    return { success: false, error: `${err.message || 'SMTP dispatch failed'}${note}` }
  }
}

// Master email OTP sender: Tries Brevo HTTPS API first, Resend second, then SMTP
async function sendEmailOtp(email: string, code: string): Promise<{ success: boolean; method?: string; error?: string }> {
  // 1. Try Brevo HTTPS API (Best for Render free tier — uses port 443)
  const brevoKey = process.env.BREVO_API_KEY || ''
  if (brevoKey && !brevoKey.includes('mock')) {
    const brevoRes = await sendEmailViaBrevo(brevoKey, email, code)
    if (brevoRes.success) return { success: true, method: 'BREVO_API' }
    console.error('[Brevo Dispatch Error]:', brevoRes.error)
  }

  // 2. Try Resend HTTPS API (Uses port 443)
  const resendKey = process.env.RESEND_API_KEY || ''
  if (resendKey && !resendKey.includes('mock')) {
    const resendRes = await sendEmailViaResend(resendKey, email, code)
    if (resendRes.success) return { success: true, method: 'RESEND_API' }
    console.error('[Resend Dispatch Error]:', resendRes.error)
  }

  // 3. Try standard SMTP (Nodemailer / Gmail)
  const smtpHost = process.env.SMTP_HOST || ''
  const smtpUser = process.env.SMTP_USER || ''
  const smtpPass = process.env.SMTP_PASS || ''
  if (smtpHost && smtpUser && smtpPass && !smtpHost.includes('mock')) {
    const smtpRes = await sendEmailViaSmtp(email, code)
    if (smtpRes.success) return { success: true, method: 'SMTP' }
    console.error('[SMTP Dispatch Error]:', smtpRes.error)
    return { success: false, method: 'SMTP', error: smtpRes.error }
  }

  // 4. In development mode with mock SMTP, stub the OTP
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV OTP STUB]: 6-digit code for ${email} is ${code}`)
    return { success: true, method: 'DEV_STUB' }
  }

  return {
    success: false,
    error: 'No email service configured on Render. Render Free Tier blocks outbound SMTP ports (587/465). Please add BREVO_API_KEY (HTTP API) or SMTP credentials to your Render dashboard.'
  }
}

// ─── HEALTH CHECK (used by Railway / load balancers) ─────────────────────────

apiRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    // Verify DB connection is live — not just that the process is running
    await prisma.$queryRaw`SELECT 1`
    return res.json({
      status: 'ok',
      db: 'connected',
      app: process.env.NEXT_PUBLIC_APP_NAME || 'Anmol Enterprises',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[Health] DB connection failed:', err)
    return res.status(503).json({ status: 'error', db: 'disconnected' })
  }
})

function generateOrderNumber() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const randomStr = Math.floor(1000 + Math.random() * 9000)
  return `ORD-${year}${month}${day}-${randomStr}`
}

// Send transactional SMS notification (console stub — extend with Twilio Messaging API if needed)
async function mockSendSMS(phone: string, message: string) {
  try {
    // Twilio Verify is for OTP only; transactional SMS requires Twilio Programmable Messaging.
    // For now, log to console. Upgrade to Twilio Messaging API when a phone number is provisioned.
    console.log(`[SMS Notification to ${phone}]: ${message}`)
  } catch (err) {
    console.error(`[SMS Dispatch Error for ${phone}]:`, err)
  }
}

// Mock PWA push
function mockSendPushNotification(title: string, body: string) {
  console.log(`[FCM PWA Push Notification]: ${title} - ${body}`)
  if (ioInstance) {
    ioInstance.emit('pwa_push', { title, body })
  }
}

// ─── OTP SMS VERIFICATION ENDPOINTS ──────────────────────────────────────────

const otpSendSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit mobile number required').regex(/^\+?91?\d{10}$|^\d{10}$/, 'Please enter a valid 10-digit mobile number'),
  purpose: z.enum(['SIGNUP', 'GUEST_CHECKOUT']),
})

apiRouter.post('/otp/send', async (req: Request, res: Response) => {
  try {
    const { phone, purpose } = otpSendSchema.parse(req.body)
    
    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.substring(2)
    }

    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1'
    if (!checkIpOtpRateLimit(clientIp)) {
      return res.status(429).json({
        error: 'Too many OTP requests from this IP address. Please try again after 1 hour.',
        retryAfterSeconds: 3600
      })
    }

    // Rate limit per phone: max 3 requests in 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentSendCount = await prisma.otpVerification.count({
      where: {
        phone: cleanPhone,
        createdAt: { gte: tenMinutesAgo }
      }
    })

    if (recentSendCount >= 3) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Maximum 3 OTP requests allowed per 10 minutes for this mobile number.',
        retryAfterSeconds: 600
      })
    }

    // With Twilio Verify, Twilio generates and sends the OTP code itself.
    // We store a DB marker record for rate-limiting and audit only.
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store marker record — otpHash is a sentinel value since Twilio owns the code
    await prisma.otpVerification.create({
      data: {
        phone: cleanPhone,
        otpHash: isTwilioLive() ? 'TWILIO_VERIFY' : await bcrypt.hash('000000', 4),
        purpose,
        expiresAt,
        attempts: 0,
        maxAttempts: 5,
        verified: false,
      }
    })

    // Dispatch OTP via Twilio Verify (Twilio generates and delivers the code)
    const sent = await sendSmsOtp(cleanPhone)
    if (!sent && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Failed to send OTP. Please try again.' })
    }

    return res.json({
      message: 'Verification OTP sent successfully',
      expiresAt: expiresAt.toISOString(),
      cooldownSeconds: 60
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Send OTP error:', error)
    return res.status(500).json({ error: 'Failed to send OTP verification code' })
  }
})

const otpVerifySchema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6, 'OTP must be exactly 6 digits'),
  purpose: z.enum(['SIGNUP', 'GUEST_CHECKOUT']),
})

apiRouter.post('/otp/verify', async (req: Request, res: Response) => {
  try {
    const { phone, code, purpose } = otpVerifySchema.parse(req.body)

    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.substring(2)
    }

    // Dev test code: 123456 always works when Twilio is not live
    const isDevTestCode = !isTwilioLive() && code === '123456'

    // Look up most recent unexpired, unverified OTP marker record (for rate limiting)
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phone: cleanPhone,
        purpose,
        verified: false,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!otpRecord && !isDevTestCode) {
      return res.status(400).json({ error: 'Invalid or expired OTP code. Please request a new OTP.' })
    }

    if (otpRecord && otpRecord.attempts >= otpRecord.maxAttempts && !isDevTestCode) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { expiresAt: new Date() }
      })
      return res.status(400).json({ error: 'Maximum verification attempts exceeded. Please request a new OTP.' })
    }

    let isValid = false

    if (isDevTestCode) {
      // Dev-mode bypass: accept 123456 when Twilio is not live
      isValid = true
    } else if (isTwilioLive()) {
      // Twilio Verify: let Twilio validate the code the user entered
      const result = await checkTwilioVerifyOtp(cleanPhone, code)
      if (!result.success && result.status === 'expired') {
        // Expire the DB record too
        if (otpRecord) {
          await prisma.otpVerification.update({ where: { id: otpRecord.id }, data: { expiresAt: new Date() } })
        }
        return res.status(400).json({ error: 'OTP expired. Please request a new code.' })
      }
      isValid = result.success
    }

    if (!isValid) {
      if (otpRecord) {
        const newAttempts = otpRecord.attempts + 1
        await prisma.otpVerification.update({
          where: { id: otpRecord.id },
          data: {
            attempts: newAttempts,
            expiresAt: newAttempts >= otpRecord.maxAttempts ? new Date() : otpRecord.expiresAt
          }
        })

        if (newAttempts >= otpRecord.maxAttempts) {
          return res.status(400).json({ error: 'Invalid OTP code. Maximum attempts exceeded — OTP invalidated. Request a new OTP.' })
        }

        return res.status(400).json({ error: `Invalid OTP code. ${otpRecord.maxAttempts - newAttempts} attempts remaining.` })
      }
      return res.status(400).json({ error: 'Invalid OTP code.' })
    }

    // Mark DB marker record as verified
    if (otpRecord) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { verified: true }
      })
    }

    // If user exists, update phoneVerified status
    const existingUser = await prisma.user.findUnique({ where: { phone: cleanPhone } })
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          phoneVerified: true,
          phoneVerifiedAt: new Date()
        }
      })
    }

    // Generate short-lived (15 min) scoped verification proof token
    const jwtSecret = process.env.JWT_SECRET || env.JWT_SECRET || 'a_very_secret_default_jwt_secret_key_32_chars_long'
    const phoneOtpToken = jwt.sign(
      {
        phone: cleanPhone,
        purpose,
        verified: true,
        type: 'PHONE_VERIFICATION_PROOF'
      },
      jwtSecret,
      { expiresIn: '15m' }
    )

    return res.json({
      message: 'Phone number verified successfully',
      phoneOtpToken,
      phone: cleanPhone,
      verified: true
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Verify OTP error:', error)
    return res.status(500).json({ error: 'Failed to verify OTP code' })
  }
})

// ─── EMAIL OTP ENDPOINTS ───────────────────────────────────────────────────

const otpEmailSendSchema = z.object({
  email: z.string().email('Valid email address required'),
  purpose: z.enum(['SIGNUP', 'GUEST_CHECKOUT']),
})

apiRouter.post('/otp/send-email', async (req: Request, res: Response) => {
  try {
    const { email, purpose } = otpEmailSendSchema.parse(req.body)
    const cleanEmail = email.toLowerCase().trim()

    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1'
    if (!checkIpOtpRateLimit(clientIp)) {
      return res.status(429).json({
        error: 'Too many OTP requests from this IP address. Please try again after 1 hour.',
        retryAfterSeconds: 3600
      })
    }

    // Rate limit per email: max 3 requests in 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentSendCount = await prisma.otpVerification.count({
      where: {
        email: cleanEmail,
        channel: 'EMAIL',
        createdAt: { gte: tenMinutesAgo }
      }
    })

    if (recentSendCount >= 3) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Maximum 3 OTP requests allowed per 10 minutes for this email address.',
        retryAfterSeconds: 600
      })
    }

    // Generate cryptographic random 6-digit code (CSPRNG)
    const rawCode = generateCsprngOtp()

    // Hash before storing — NEVER store or log plaintext OTP code
    const otpHash = await bcrypt.hash(rawCode, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry

    await prisma.otpVerification.create({
      data: {
        email: cleanEmail,
        channel: 'EMAIL',
        otpHash,
        purpose,
        expiresAt,
        attempts: 0,
        maxAttempts: 5,
        verified: false,
      }
    })

    // Send email OTP via configured provider (Brevo HTTPS / Resend HTTPS / SMTP)
    const sendResult = await sendEmailOtp(cleanEmail, rawCode)

    if (!sendResult.success) {
      console.error('[Send Email OTP Failed]:', sendResult.error)
      return res.status(500).json({
        error: `Could not send verification email: ${sendResult.error}`
      })
    }

    return res.json({
      message: 'Verification email OTP sent successfully',
      expiresAt: expiresAt.toISOString(),
      cooldownSeconds: 60,
      method: sendResult.method
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Send Email OTP error:', error)
    return res.status(500).json({ error: 'Failed to send email OTP verification code' })
  }
})

// ─── EMAIL DIAGNOSTICS ENDPOINT (Check Render Environment status) ──────────────
apiRouter.get('/otp/diagnostics', async (_req: Request, res: Response) => {
  const host = process.env.SMTP_HOST || 'NOT_SET'
  const port = process.env.SMTP_PORT || '587'
  const user = process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 5)}***` : 'NOT_SET'
  const passConfigured = process.env.SMTP_PASS ? `CONFIGURED (${process.env.SMTP_PASS.length} chars)` : 'NOT_SET'
  const brevoKey = process.env.BREVO_API_KEY ? `CONFIGURED (${process.env.BREVO_API_KEY.length} chars)` : 'NOT_SET'
  const resendKey = process.env.RESEND_API_KEY ? `CONFIGURED (${process.env.RESEND_API_KEY.length} chars)` : 'NOT_SET'

  return res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    config: {
      brevoApiKey: brevoKey,
      resendApiKey: resendKey,
      smtpHost: host,
      smtpPort: port,
      smtpUser: user,
      smtpPass: passConfigured,
      fromAddress: process.env.SMTP_FROM_ADDRESS || 'DEFAULT'
    },
    recommendation: brevoKey.startsWith('CONFIGURED') 
      ? 'Brevo HTTPS API is configured! Outbound email uses HTTPS (port 443) and will not be blocked by Render.' 
      : 'Render Free Tier blocks outbound SMTP ports 25, 465, and 587. To send emails on Render Free Tier without port blocks, add BREVO_API_KEY to Render Environment variables.'
  })
})

const otpEmailVerifySchema = z.object({
  email: z.string().email('Valid email address required'),
  code: z.string().length(6, 'OTP must be exactly 6 digits'),
  purpose: z.enum(['SIGNUP', 'GUEST_CHECKOUT']),
})

apiRouter.post('/otp/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, code, purpose } = otpEmailVerifySchema.parse(req.body)
    const cleanEmail = email.toLowerCase().trim()

    // Look up most recent unexpired, unverified Email OTP record
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        email: cleanEmail,
        channel: 'EMAIL',
        purpose,
        verified: false,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired Email OTP code. Please request a new OTP.' })
    }

    // Invalidate if maximum attempts reached
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { expiresAt: new Date() }
      })
      return res.status(400).json({ error: 'Maximum verification attempts exceeded. Please request a new OTP.' })
    }

    // In development mode with mock SMTP gateway, allow '123456' as developer test code
    const smtpHost = process.env.SMTP_HOST || ''
    const isMockSmtp = !smtpHost || smtpHost.toLowerCase().includes('mock') || smtpHost.toLowerCase().includes('placeholder')
    const isDevTestCode = (process.env.NODE_ENV !== 'production' && isMockSmtp && code === '123456')

    const isValid = isDevTestCode || (await bcrypt.compare(code, otpRecord.otpHash))

    if (!isValid) {
      const newAttempts = otpRecord.attempts + 1
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: {
          attempts: newAttempts,
          expiresAt: newAttempts >= otpRecord.maxAttempts ? new Date() : otpRecord.expiresAt
        }
      })

      if (newAttempts >= otpRecord.maxAttempts) {
        return res.status(400).json({ error: 'Invalid Email OTP code. Maximum attempts exceeded — OTP invalidated. Request a new OTP.' })
      }

      return res.status(400).json({ error: `Invalid Email OTP code. ${otpRecord.maxAttempts - newAttempts} attempts remaining.` })
    }

    // Mark OTP record as verified
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    })

    // If user exists, update emailVerified status
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date()
        }
      })
    }

    // Generate short-lived (15 min) scoped verification proof token
    const jwtSecret = process.env.JWT_SECRET || env.JWT_SECRET || 'a_very_secret_default_jwt_secret_key_32_chars_long'
    const emailOtpToken = jwt.sign(
      {
        email: cleanEmail,
        purpose,
        verified: true,
        type: 'EMAIL_VERIFICATION_PROOF'
      },
      jwtSecret,
      { expiresIn: '15m' }
    )

    return res.json({
      message: 'Email address verified successfully',
      emailOtpToken,
      email: cleanEmail,
      verified: true
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Verify Email OTP error:', error)
    return res.status(500).json({ error: 'Failed to verify email OTP code' })
  }
})

// ─── AUTHENTICATION ROUTES ───────────────────────────────────────────────────

function getZodErrorMessage(error: z.ZodError): string {
  if (error.issues && error.issues.length > 0) {
    return error.issues[0].message
  }
  if ((error as any).errors && (error as any).errors.length > 0) {
    return getZodErrorMessage(error)
  }
  return 'Invalid input data'
}

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  phoneOtpToken: z.string().optional(),
  emailOtpToken: z.string().optional(),
  isB2B: z.boolean().optional(),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  gstin: z.string().optional(),
  fssaiNumber: z.string().optional(),
  monthlyVolumeEst: z.string().optional(),
  businessAddress: z.string().optional(),
})

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body)
    const cleanEmail = data.email.toLowerCase().trim()

    // 1. Check if email is already registered
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    })
    if (existingEmailUser) {
      return res.status(400).json({ error: 'This email is already registered. Please login instead.' })
    }

    // 2. Normalize optional phone if provided
    let cleanPhone: string | null = null
    if (data.phone && data.phone.trim()) {
      cleanPhone = data.phone.replace(/\D/g, '')
      if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) {
        cleanPhone = cleanPhone.substring(2)
      }
      if (cleanPhone.length === 10) {
        const existingPhoneUser = await prisma.user.findUnique({
          where: { phone: cleanPhone }
        })
        if (existingPhoneUser) {
          return res.status(400).json({ error: 'This mobile number is already linked to another account.' })
        }
      } else {
        cleanPhone = null
      }
    }

    // 3. Verify Email verification proof token if supplied
    const emailProofHeader = (req.headers['x-email-otp-token'] || data.emailOtpToken) as string | undefined
    let isEmailVerified = false

    if (emailProofHeader) {
      try {
        const decoded = jwt.verify(emailProofHeader, env.JWT_SECRET) as any
        if (
          decoded &&
          decoded.type === 'EMAIL_VERIFICATION_PROOF' &&
          decoded.purpose === 'SIGNUP' &&
          decoded.verified === true &&
          decoded.email === cleanEmail
        ) {
          isEmailVerified = true
        }
      } catch (e) {}
    }

    const passwordHash = await bcrypt.hash(data.password, 10)
    
    // First user is Admin
    const totalUsers = await prisma.user.count()
    const role = totalUsers === 0 ? 'ADMIN' : 'CUSTOMER'

    // Create user and BusinessProfile if B2B
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        role,
        emailVerified: isEmailVerified,
        emailVerifiedAt: isEmailVerified ? new Date() : null,
        phoneVerified: false,
        businessName: data.isB2B ? (data.businessName || 'Business Partner') : null,
        isB2B: data.isB2B || false,
        creditLimit: data.isB2B ? 5000 : 0,
        businessProfile: data.isB2B ? {
          create: {
            businessName: data.businessName || 'Business Partner',
            businessType: data.businessType || 'OTHER',
            gstin: data.gstin || null,
            fssaiNumber: data.fssaiNumber || null,
            monthlyVolumeEst: data.monthlyVolumeEst || '< 50kg',
            businessAddress: data.businessAddress || null,
            verificationStatus: 'PENDING',
            creditTier: 'BRONZE',
          }
        } : undefined
      },
      include: {
        businessProfile: true
      }
    })

    const token = signToken(user.id, user.role)
    
    res.cookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS-only in prod
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isB2B: user.isB2B,
        businessName: user.businessName,
        creditLimit: user.creditLimit,
        creditUsed: user.creditUsed,
        businessProfile: user.businessProfile,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Registration error:', error)
    return res.status(500).json({ error: 'Internal server error during registration' })
  }
})

const loginSchema = z.object({
  identifier: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  password: z.string().min(1, 'Password required'),
})

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body)
    const rawIdentifier = (data.identifier || data.email || data.phone || '').trim()

    if (!rawIdentifier) {
      return res.status(400).json({ error: 'Please enter your email address or mobile number' })
    }

    let user = null

    if (rawIdentifier.includes('@')) {
      // Login via email address
      const cleanEmail = rawIdentifier.toLowerCase()
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: { businessProfile: true }
      })
    } else {
      // Login via phone number
      let cleanPhone = rawIdentifier.replace(/\D/g, '')
      if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) {
        cleanPhone = cleanPhone.substring(2)
      }
      if (cleanPhone.length === 10) {
        user = await prisma.user.findUnique({
          where: { phone: cleanPhone },
          include: { businessProfile: true }
        })
      }
    }

    // Fallback: If not found yet, try finding by email or phone directly
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: rawIdentifier.toLowerCase() },
            { phone: rawIdentifier }
          ]
        },
        include: { businessProfile: true }
      })
    }

    if (!user || !user.passwordHash || !(await bcrypt.compare(data.password, user.passwordHash))) {
      return res.status(400).json({ error: 'Invalid email/phone or password' })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact support.' })
    }

    const token = signToken(user.id, user.role)
    
    res.cookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS-only in prod
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isB2B: user.isB2B,
        businessName: user.businessName,
        creditLimit: user.creditLimit,
        creditUsed: user.creditUsed,
        businessProfile: user.businessProfile,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error during login' })
  }
})

// ─── GOOGLE OAUTH SIGN-IN ENDPOINT ─────────────────────────────────────────

const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID Token required'),
})

apiRouter.post('/auth/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = googleAuthSchema.parse(req.body)
    const clientId = process.env.GOOGLE_CLIENT_ID || ''

    if (!clientId) {
      return res.status(500).json({ error: 'Google OAuth Client ID is not configured in environment variables (GOOGLE_CLIENT_ID).' })
    }

    const googleClient = new OAuth2Client(clientId)
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientId
    })

    const payload = ticket.getPayload()
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google authentication token' })
    }

    if (!payload.email_verified) {
      return res.status(400).json({ error: 'Google account email is not verified by Google.' })
    }

    const email = payload.email.toLowerCase().trim()

    // Find existing User by email
    let user = await prisma.user.findUnique({
      where: { email },
      include: { businessProfile: true }
    })

    if (user) {
      // User exists! Link Google login & mark email verified
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: user.emailVerifiedAt || new Date(),
          authProvider: user.authProvider === 'LOCAL' ? 'GOOGLE_LINKED' : user.authProvider,
          name: user.name || payload.name || 'User'
        },
        include: { businessProfile: true }
      })
    } else {
      // Create new Google user record (phone & passwordHash null)
      const totalUsers = await prisma.user.count()
      const role = totalUsers === 0 ? 'ADMIN' : 'CUSTOMER'

      user = await prisma.user.create({
        data: {
          name: payload.name || 'Google User',
          email,
          phone: null,
          passwordHash: null,
          role,
          authProvider: 'GOOGLE',
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
        include: { businessProfile: true }
      })
    }

    // Issue standard JWT session cookie
    const token = signToken(user.id, user.role)
    res.cookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return res.json({
      message: 'Logged in with Google successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isB2B: user.isB2B,
        businessName: user.businessName,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        businessProfile: user.businessProfile,
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Google Auth Error:', error)
    return res.status(400).json({ error: 'Google Sign-In verification failed. Please try again.' })
  }
})

apiRouter.all(['/auth/logout', '/auth/signout'], (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production'
  
  // 1. Clear with matching options
  res.clearCookie('token', {
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax'
  })

  // 2. Also clear default path
  res.clearCookie('token')

  // 3. Overwrite cookie with immediate epoch expiry to guarantee removal
  res.cookie('token', '', {
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    expires: new Date(0),
    maxAge: 0
  })

  // 4. Clear any other potential session cookies
  res.clearCookie('session', { path: '/' })
  res.cookie('session', '', { path: '/', expires: new Date(0), maxAge: 0 })

  return res.json({ success: true, message: 'Logged out successfully' })
})

apiRouter.get('/auth/me', authMiddleware, (req: Request, res: Response) => {
  return res.json({ user: req.user })
})

// ─── IN-MEMORY CATALOG CACHE FOR ULTRA-FAST READ PERFORMANCE ───────────────────
let cachedCategories: any = null
let cachedCategoriesTime = 0

let cachedProducts: any = null
let cachedProductsTime = 0

const CATALOG_CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes in-memory cache (auto-invalidated on admin mutations)

export function invalidateCatalogCache() {
  cachedCategories = null
  cachedCategoriesTime = 0
  cachedProducts = null
  cachedProductsTime = 0
}

apiRouter.get('/categories', async (req: Request, res: Response) => {
  try {
    const now = Date.now()
    if (cachedCategories && (now - cachedCategoriesTime < CATALOG_CACHE_TTL_MS)) {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
      return res.json(cachedCategories)
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })
    cachedCategories = categories
    cachedCategoriesTime = now

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return res.json(categories)
  } catch (error) {
    console.error('Fetch categories error:', error)
    return res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

apiRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const now = Date.now()
    if (cachedProducts && (now - cachedProductsTime < CATALOG_CACHE_TTL_MS)) {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
      return res.json(cachedProducts)
    }

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        variants: {
          where: { isActive: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })
    cachedProducts = products
    cachedProductsTime = now

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return res.json(products)
  } catch (error) {
    console.error('Fetch products error:', error)
    return res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// Admin endpoint to fetch ALL products (including inactive)
apiRouter.get('/admin/products', authMiddleware, requireRole(['ADMIN', 'STAFF']), async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true
      },
      orderBy: { updatedAt: 'desc' }
    })
    return res.json(products)
  } catch (error) {
    console.error('Fetch admin products error:', error)
    return res.status(500).json({ error: 'Failed to fetch catalog' })
  }
})

import fs from 'fs'
import path from 'path'

// Admin Image Upload Endpoint (Saves to /public/images/products/)
apiRouter.post('/admin/upload-image', authMiddleware, requireRole(['ADMIN', 'STAFF']), async (req: Request, res: Response) => {
  try {
    const { filename, base64Data } = req.body
    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data is required' })
    }

    // Clean filename
    const cleanName = (filename || `upload-${Date.now()}.jpg`).replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase()
    const targetDir = path.join(process.cwd(), 'public', 'images', 'products')
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    const targetPath = path.join(targetDir, cleanName)
    // Strip header if data URL format (e.g. data:image/png;base64,...)
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Clean, 'base64')
    fs.writeFileSync(targetPath, buffer)

    const publicUrl = `/images/products/${cleanName}`
    console.log(`[Upload] Image saved: ${publicUrl} (${buffer.length} bytes)`)

    return res.json({ url: publicUrl, filename: cleanName, size: buffer.length })
  } catch (err: any) {
    console.error('Image upload failed:', err)
    return res.status(500).json({ error: err.message || 'Image upload failed' })
  }
})

// Admin Import Remote or Google Drive Image URL (Downloads to /public/images/products/ or normalizes)
apiRouter.post('/admin/import-image-url', authMiddleware, requireRole(['ADMIN', 'STAFF']), async (req: Request, res: Response) => {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: 'URL is required' })

    // Check if Google Drive link
    let directUrl = url
    let isGDrive = false
    const gDriveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (gDriveMatch && gDriveMatch[1]) {
      const fileId = gDriveMatch[1]
      directUrl = `https://lh3.googleusercontent.com/d/${fileId}`
      isGDrive = true
    }

    // If it's already a local path, return as is
    if (url.startsWith('/images/')) {
      return res.json({ url })
    }

    // Try fetching and saving locally to avoid CORS, rate limits, or link expiration
    try {
      const fetchResponse = await fetch(directUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      if (fetchResponse.ok) {
        const contentType = fetchResponse.headers.get('content-type') || ''
        // Only save if it's an image
        if (contentType.startsWith('image/')) {
          const arrayBuffer = await fetchResponse.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
          const filename = isGDrive && gDriveMatch ? `gdrive-${gDriveMatch[1]}.${ext}` : `import-${Date.now()}.${ext}`
          const targetDir = path.join(process.cwd(), 'public', 'images', 'products')
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
          }
          const targetPath = path.join(targetDir, filename)
          fs.writeFileSync(targetPath, buffer)
          console.log(`[Import URL] Successfully saved remote image locally: /images/products/${filename}`)
          return res.json({ url: `/images/products/${filename}`, originalUrl: url })
        }
      }
    } catch (downloadErr) {
      console.warn('Could not download image locally, falling back to direct URL:', downloadErr)
    }

    return res.json({ url: directUrl, originalUrl: url })
  } catch (err: any) {
    console.error('Import image URL error:', err)
    return res.status(500).json({ error: err.message || 'Import failed' })
  }
})

// Admin Create Product
const createProductSchema = z.object({
  name: z.string().min(2, 'Product name required'),
  categoryId: z.string().min(1, 'Category required'),
  description: z.string().min(5, 'Summary description required'),
  brand: z.string().default('McCain'),
  isVeg: z.boolean().default(true),
  imageUrl: z.string().min(1, 'Image URL required'),
  galleryImages: z.array(z.string()).optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  singlePrice: z.number().min(1),
  singleB2bPrice: z.number().min(1),
  singleWeight: z.number().default(400),
  boxPrice: z.number().optional(),
  boxB2bPrice: z.number().optional(),
  cartonPrice: z.number().optional(),
  cartonB2bPrice: z.number().optional(),
})

apiRouter.post('/products', authMiddleware, requireRole(['ADMIN', 'STAFF']), async (req: Request, res: Response) => {
  console.log('>>> EXPRESS POST /api/products ROUTE HIT <<<')
  try {
    const data = createProductSchema.parse(req.body)
    
    // Generate clean slug
    let baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const existing = await prisma.product.findUnique({ where: { slug: baseSlug } })
    if (existing) {
      baseSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: baseSlug,
        categoryId: data.categoryId,
        description: data.description,
        brand: data.brand,
        isVeg: data.isVeg,
        imageUrl: data.imageUrl,
        galleryImages: data.galleryImages || (data.imageUrl ? [data.imageUrl] : []),
        isFeatured: data.isFeatured,
        isActive: data.isActive,
        variants: {
          create: [
            {
              packagingType: 'SINGLE',
              unitsInPack: 1,
              weightGrams: data.singleWeight,
              skuCode: `MCN-${baseSlug.substring(0, 4).toUpperCase()}-${data.singleWeight}`,
              retailPrice: data.singlePrice,
              b2bPrice: data.singleB2bPrice,
              stockCount: 100,
            },
            {
              packagingType: 'BOX',
              unitsInPack: 10,
              weightGrams: data.singleWeight * 10,
              skuCode: `MCN-${baseSlug.substring(0, 4).toUpperCase()}-BOX`,
              retailPrice: data.boxPrice || data.singlePrice * 9.2,
              b2bPrice: data.boxB2bPrice || data.singleB2bPrice * 9.0,
              stockCount: 50,
            },
            {
              packagingType: 'CARTON',
              unitsInPack: 50,
              weightGrams: data.singleWeight * 50,
              skuCode: `MCN-${baseSlug.substring(0, 4).toUpperCase()}-CAR`,
              retailPrice: data.cartonPrice || data.singlePrice * 44,
              b2bPrice: data.cartonB2bPrice || data.singleB2bPrice * 42,
              stockCount: 20,
            }
          ]
        }
      },
      include: {
        category: true,
        variants: true
      }
    })

    invalidateCatalogCache()
    return res.status(201).json(product)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Create product error:', error)
    return res.status(500).json({ error: 'Failed to create product' })
  }
})

// Admin Update Product
const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  categoryId: z.string().optional(),
  description: z.string().min(5).optional(),
  brand: z.string().optional(),
  isVeg: z.boolean().optional(),
  imageUrl: z.string().optional(),
  galleryImages: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  singlePrice: z.number().optional(),
  singleB2bPrice: z.number().optional(),
  boxPrice: z.number().optional(),
  boxB2bPrice: z.number().optional(),
  cartonPrice: z.number().optional(),
  cartonB2bPrice: z.number().optional(),
})

apiRouter.put('/products/:id', authMiddleware, requireRole(['ADMIN', 'STAFF']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const data = updateProductSchema.parse(req.body)

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true }
    })

    if (!existingProduct) return res.status(404).json({ error: 'Product not found' })

    // Update base product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existingProduct.name,
        categoryId: data.categoryId !== undefined ? data.categoryId : existingProduct.categoryId,
        description: data.description !== undefined ? data.description : existingProduct.description,
        brand: data.brand !== undefined ? data.brand : existingProduct.brand,
        isVeg: data.isVeg !== undefined ? data.isVeg : existingProduct.isVeg,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : existingProduct.imageUrl,
        galleryImages: data.galleryImages !== undefined ? data.galleryImages : existingProduct.galleryImages,
        isFeatured: data.isFeatured !== undefined ? data.isFeatured : existingProduct.isFeatured,
        isActive: data.isActive !== undefined ? data.isActive : existingProduct.isActive,
      },
      include: {
        category: true,
        variants: true
      }
    })

    // Update variant prices if provided
    if (data.singlePrice !== undefined || data.singleB2bPrice !== undefined) {
      const singleVar = existingProduct.variants.find(v => v.packagingType === 'SINGLE')
      if (singleVar) {
        await prisma.productVariant.update({
          where: { id: singleVar.id },
          data: {
            retailPrice: data.singlePrice !== undefined ? data.singlePrice : singleVar.retailPrice,
            b2bPrice: data.singleB2bPrice !== undefined ? data.singleB2bPrice : singleVar.b2bPrice,
          }
        })
      }
    }

    if (data.boxPrice !== undefined || data.boxB2bPrice !== undefined) {
      const boxVar = existingProduct.variants.find(v => v.packagingType === 'BOX')
      if (boxVar) {
        await prisma.productVariant.update({
          where: { id: boxVar.id },
          data: {
            retailPrice: data.boxPrice !== undefined ? data.boxPrice : boxVar.retailPrice,
            b2bPrice: data.boxB2bPrice !== undefined ? data.boxB2bPrice : boxVar.b2bPrice,
          }
        })
      }
    }

    if (data.cartonPrice !== undefined || data.cartonB2bPrice !== undefined) {
      const cartonVar = existingProduct.variants.find(v => v.packagingType === 'CARTON')
      if (cartonVar) {
        await prisma.productVariant.update({
          where: { id: cartonVar.id },
          data: {
            retailPrice: data.cartonPrice !== undefined ? data.cartonPrice : cartonVar.retailPrice,
            b2bPrice: data.cartonB2bPrice !== undefined ? data.cartonB2bPrice : cartonVar.b2bPrice,
          }
        })
      }
    }

    // Refetch final product state
    const finalProduct = await prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true }
    })

    invalidateCatalogCache()
    return res.json(finalProduct)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Update product error:', error)
    return res.status(500).json({ error: 'Failed to update product' })
  }
})

// Admin Delete Product
apiRouter.delete('/products/:id', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    // Check if product is in any orders
    const orderItemsCount = await prisma.orderItem.count({ where: { productId: id } })
    
    if (orderItemsCount > 0) {
      // Soft delete by deactivating
      await prisma.product.update({
        where: { id },
        data: { isActive: false }
      })
      invalidateCatalogCache()
      return res.json({ message: 'Product deactivated (associated with existing orders)' })
    } else {
      // Hard delete
      await prisma.product.delete({ where: { id } })
      invalidateCatalogCache()
      return res.json({ message: 'Product deleted permanently' })
    }
  } catch (error) {
    console.error('Delete product error:', error)
    return res.status(500).json({ error: 'Failed to delete product' })
  }
})

// ─── BULK PRODUCT IMPORT ───────────────────────────────────────────────────
// POST /admin/products/bulk-import
// Accepts an array of products. Each can have full variant definitions.
// Idempotent: uses upsert on slug — safe to run multiple times.
// Returns a summary: { created, updated, failed, errors }

const bulkVariantSchema = z.object({
  packagingType: z.enum(['SINGLE', 'BOX', 'CARTON']),
  skuCode: z.string().min(3),
  unitsInPack: z.number().int().min(1),
  weightGrams: z.number().int().min(1),
  retailPrice: z.number().positive(),
  b2bPrice: z.number().positive(),
  stockCount: z.number().int().min(0).default(0),
  minOrderQty: z.number().int().min(1).default(1),
})

const bulkProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers, hyphens only'),
  brand: z.string().default('McCain'),
  description: z.string().min(5),
  categorySlug: z.string().min(2),             // resolved to categoryId automatically
  imageUrl: z.string().url().optional(),
  isVeg: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(99),
  variants: z.array(bulkVariantSchema).min(1),
})

const bulkImportSchema = z.object({
  products: z.array(bulkProductSchema).min(1).max(200),
})

apiRouter.post('/admin/products/bulk-import', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { products } = bulkImportSchema.parse(req.body)

    // Pre-resolve all category slugs in one query
    const categorySlugs = [...new Set(products.map(p => p.categorySlug))]
    const categories = await prisma.category.findMany({
      where: { slug: { in: categorySlugs } },
    })
    const categoryMap = new Map(categories.map(c => [c.slug, c.id]))

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as Array<{ slug: string; error: string }>,
    }

    for (const prod of products) {
      try {
        const categoryId = categoryMap.get(prod.categorySlug)
        if (!categoryId) {
          results.failed++
          results.errors.push({ slug: prod.slug, error: `Category "${prod.categorySlug}" not found. Create it first.` })
          continue
        }

        // Check if this product already exists (for created vs updated count)
        const existing = await prisma.product.findUnique({ where: { slug: prod.slug } })

        const savedProduct = await prisma.product.upsert({
          where: { slug: prod.slug },
          update: {
            name: prod.name,
            brand: prod.brand,
            description: prod.description,
            categoryId,
            imageUrl: prod.imageUrl,
            isVeg: prod.isVeg,
            isFeatured: prod.isFeatured,
            isActive: prod.isActive,
            sortOrder: prod.sortOrder,
          },
          create: {
            name: prod.name,
            slug: prod.slug,
            brand: prod.brand,
            description: prod.description,
            categoryId,
            imageUrl: prod.imageUrl || `https://res.cloudinary.com/anmol-enterprises/image/upload/products/${prod.slug}.webp`,
            isVeg: prod.isVeg,
            isFeatured: prod.isFeatured,
            isActive: prod.isActive,
            sortOrder: prod.sortOrder,
          },
        })

        // Upsert variants
        for (const variant of prod.variants) {
          await prisma.productVariant.upsert({
            where: { skuCode: variant.skuCode },
            update: {
              retailPrice: variant.retailPrice,
              b2bPrice: variant.b2bPrice,
              stockCount: variant.stockCount,
              weightGrams: variant.weightGrams,
              unitsInPack: variant.unitsInPack,
            },
            create: {
              productId: savedProduct.id,
              packagingType: variant.packagingType,
              skuCode: variant.skuCode,
              unitsInPack: variant.unitsInPack,
              weightGrams: variant.weightGrams,
              retailPrice: variant.retailPrice,
              b2bPrice: variant.b2bPrice,
              stockCount: variant.stockCount,
              minOrderQty: variant.minOrderQty,
            },
          })
        }

        if (existing) results.updated++
        else results.created++

      } catch (productError: any) {
        results.failed++
        results.errors.push({ slug: prod.slug, error: productError?.message || 'Unknown error' })
      }
    }

    return res.status(200).json({
      message: `Bulk import complete: ${results.created} created, ${results.updated} updated, ${results.failed} failed.`,
      ...results,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: (error as any).errors.map((e: any) => ({ field: e.path.join('.'), message: e.message })),
      })
    }
    console.error('Bulk import error:', error)
    return res.status(500).json({ error: 'Bulk import failed' })
  }
})

// GET /admin/products/bulk-template — download the JSON template for bulk import
apiRouter.get('/admin/products/bulk-template', authMiddleware, requireRole(['ADMIN']), (_req: Request, res: Response) => {
  const template = {
    _instructions: 'Fill in this template and POST it to /api/admin/products/bulk-import. The categorySlug must match an existing category slug. SKU codes must be unique.',
    products: [
      {
        name: 'Product Name Here',
        slug: 'product-slug-lowercase-hyphens-only',
        brand: 'McCain',
        description: 'Product description (min 5 chars)',
        categorySlug: 'frozen-potato-snacks',
        imageUrl: 'https://example.com/image.webp',
        isVeg: true,
        isFeatured: false,
        isActive: true,
        sortOrder: 99,
        variants: [
          { packagingType: 'SINGLE', skuCode: 'MCN-XXX-420', unitsInPack: 1,  weightGrams: 420,   retailPrice: 199, b2bPrice: 169, stockCount: 50, minOrderQty: 1 },
          { packagingType: 'BOX',    skuCode: 'MCN-XXX-BOX', unitsInPack: 10, weightGrams: 4200,  retailPrice: 1890, b2bPrice: 1499, stockCount: 20, minOrderQty: 1 },
          { packagingType: 'CARTON', skuCode: 'MCN-XXX-CRT', unitsInPack: 50, weightGrams: 21000, retailPrice: 8999, b2bPrice: 6999, stockCount: 10, minOrderQty: 1 },
        ],
      },
    ],
  }
  return res.json(template)
})

apiRouter.get('/products/:slug', async (req: Request, res: Response) => {
  try {
    const rawParam = req.params.slug as string
    const slug = decodeURIComponent(rawParam).trim().toLowerCase()

    // 1. Try exact slug match
    let product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: {
          where: { isActive: true }
        }
      }
    })

    // 2. Try ID or partial/hyphenated slug match
    if (!product) {
      const cleanSearch = slug.replace(/[^a-z0-9]/g, '')
      const allProducts = await prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: true,
          variants: { where: { isActive: true } }
        }
      })

      product = allProducts.find(p => 
        p.slug.toLowerCase() === slug ||
        p.id.toLowerCase() === slug ||
        p.slug.replace(/[^a-z0-9]/g, '') === cleanSearch ||
        p.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanSearch) ||
        cleanSearch.includes(p.slug.replace(/[^a-z0-9]/g, ''))
      ) || null
    }

    // 3. Fallback: Return first available active product if slug lookup somehow yields no match
    if (!product) {
      product = await prisma.product.findFirst({
        where: { isActive: true },
        include: {
          category: true,
          variants: { where: { isActive: true } }
        }
      })
    }

    if (!product) return res.status(404).json({ error: 'Product not found' })
    return res.json(product)
  } catch (error) {
    console.error('Fetch product detail error:', error)
    return res.status(500).json({ error: 'Failed to fetch product details' })
  }
})

// ─── DRIVERS (Admin only) ─────────────────────────────────────────────────────

const driverSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  vehicleNumber: z.string().min(4),
  vehicleType: z.string().default('Van'),
})

apiRouter.get('/drivers', authMiddleware, requireRole(['ADMIN', 'STAFF']), async (req: Request, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return res.json(drivers)
  } catch (error) {
    console.error('Fetch drivers error:', error)
    return res.status(500).json({ error: 'Failed to fetch drivers' })
  }
})

apiRouter.post('/drivers', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const data = driverSchema.parse(req.body)
    const driver = await prisma.driver.create({ data })
    return res.status(201).json(driver)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Create driver error:', error)
    return res.status(500).json({ error: 'Failed to create driver' })
  }
})

const updateDriverSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  vehicleNumber: z.string().min(4).optional(),
  vehicleType: z.string().optional(),
  isActive: z.boolean().optional(),
})

apiRouter.put('/drivers/:id', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const data = updateDriverSchema.parse(req.body)
    const driver = await prisma.driver.update({
      where: { id },
      data,
    })
    return res.json(driver)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Update driver error:', error)
    return res.status(500).json({ error: 'Failed to update driver' })
  }
})

// ─── INVENTORY (Admin only) ───────────────────────────────────────────────────

apiRouter.put('/inventory/quick-edit', authMiddleware, requireRole(['ADMIN', 'STAFF']), async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      variantId: z.string(),
      stockCount: z.number().int().nonnegative('Stock count must be positive'),
    })
    const { variantId, stockCount } = schema.parse(req.body)

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stockCount },
      include: { product: true }
    })

    invalidateCatalogCache()
    if (ioInstance) {
      ioInstance.emit('stock_update', { variantId, stockCount })
    }

    return res.json({ message: 'Stock updated successfully', variant: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Stock edit error:', error)
    return res.status(500).json({ error: 'Failed to update stock' })
  }
})

apiRouter.put('/inventory/bulk-add', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      packagingType: z.enum(['SINGLE', 'BOX', 'CARTON']),
      addAmount: z.number().int().positive(),
    })
    const { packagingType, addAmount } = schema.parse(req.body)

    const result = await prisma.productVariant.updateMany({
      where: { packagingType },
      data: {
        stockCount: {
          increment: addAmount
        }
      }
    })

    invalidateCatalogCache()
    if (ioInstance) {
      ioInstance.emit('bulk_stock_update')
    }

    return res.json({ message: `Added ${addAmount} stock to all ${packagingType} variants`, count: result.count })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Bulk stock edit error:', error)
    return res.status(500).json({ error: 'Failed to apply bulk stock' })
  }
})

// ─── USER SAVED ADDRESSES ───────────────────────────────────────────────────

const addressSchema = z.object({
  label: z.string().default('Home'),
  flatNo: z.string().min(1, 'Flat/House/Shop number is required'),
  street: z.string().min(1, 'Street/Area is required'),
  landmark: z.string().optional(),
  city: z.string().default('Latur'),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
  isDefault: z.boolean().optional().default(false),
})

apiRouter.get('/addresses', authMiddleware, async (req: Request, res: Response) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    })
    return res.json(addresses)
  } catch (error) {
    console.error('Fetch addresses error:', error)
    return res.status(500).json({ error: 'Failed to fetch saved addresses' })
  }
})

apiRouter.post('/addresses', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = addressSchema.parse(req.body)
    const userId = req.user!.id

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      })
    }

    const address = await prisma.address.create({
      data: {
        userId,
        label: data.label || 'Home',
        flatNo: data.flatNo,
        street: data.street,
        landmark: data.landmark || null,
        city: data.city || 'Latur',
        pincode: data.pincode,
        isDefault: data.isDefault || false,
      }
    })

    return res.status(201).json(address)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Create address error:', error)
    return res.status(500).json({ error: 'Failed to save address' })
  }
})

apiRouter.delete('/addresses/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.user!.id

    const existing = await prisma.address.findFirst({
      where: { id, userId }
    })
    if (!existing) return res.status(404).json({ error: 'Address not found' })

    await prisma.address.delete({ where: { id } })
    return res.json({ message: 'Address deleted successfully' })
  } catch (error) {
    console.error('Delete address error:', error)
    return res.status(500).json({ error: 'Failed to delete address' })
  }
})

// ─── ORDERS ROUTES ───────────────────────────────────────────────────────────

const orderItemSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
  quantity: z.number().int().positive(),
})

const orderCreateSchema = z.object({
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  addressId: z.string().optional(),
  deliveryAddress: z.string(),
  deliveryCity: z.string(),
  deliveryPincode: z.string(),
  deliverySlot: z.string().optional().default('EXPRESS_10MIN'),
  deliveryDate: z.string().optional().transform(str => str ? new Date(str) : new Date()),
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'UPI', 'CARD', 'CREDIT_ACCOUNT']),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least 1 item'),
  notes: z.string().optional(),
})

apiRouter.post('/orders', async (req: Request, res: Response) => {
  try {
    // Authenticate user token
    let loggedInUser = null
    const token = req.cookies?.token
    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        loggedInUser = await prisma.user.findUnique({ where: { id: decoded.userId } })
      }
    }

    if (!loggedInUser) {
      return res.status(401).json({ error: 'Authentication required: Please login or register to complete your order.' })
    }

    const data = orderCreateSchema.parse(req.body)
    const orderNumber = generateOrderNumber()

    // Database transaction to validate stock and create order atomically
    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0

      // 1. Process items and validate stock
      const processedItems = []
      for (const item of data.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true }
        })

        if (!variant) {
          throw new Error(`Variant ${item.variantId} not found`)
        }

        if (variant.stockCount < item.quantity) {
          throw new Error(`Insufficient stock for ${variant.product.name} (${variant.packagingType}). Available: ${variant.stockCount}, Requested: ${item.quantity}`)
        }

        // Determine price (B2B vs Retail)
        const unitPrice = loggedInUser?.isB2B ? variant.b2bPrice : variant.retailPrice
        const lineTotal = unitPrice * item.quantity
        subtotal += lineTotal

        processedItems.push({
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          variantSku: variant.skuCode,
          packagingType: variant.packagingType,
          weightGrams: variant.weightGrams,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        })

        // Decrement stock
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            stockCount: {
              decrement: item.quantity
            }
          }
        })
      }

      // 2. Calculate fees
      // First order for a customer: FREE delivery (₹0).
      // Anti-abuse check: Verified via Phone OR Email, and no previous orders tied to User ID, phone, or email.
      const customerPhone = loggedInUser?.phone || (data.guestPhone ? data.guestPhone.replace(/\D/g, '') : null)
      const customerEmail = loggedInUser?.email || (req.body as any).guestEmail || null
      
      let deliveryFee = 49
      let previousOrderCount = 0

      if (loggedInUser) {
        previousOrderCount = await tx.order.count({
          where: {
            OR: [
              { userId: loggedInUser.id },
              customerPhone ? { guestPhone: customerPhone } : undefined,
              loggedInUser.phone ? { guestPhone: loggedInUser.phone } : undefined,
              customerEmail ? { user: { email: customerEmail } } : undefined,
            ].filter(Boolean) as any
          }
        })
      } else if (customerPhone || customerEmail) {
        previousOrderCount = await tx.order.count({
          where: {
            OR: [
              customerPhone ? { guestPhone: customerPhone } : undefined,
              customerPhone ? { user: { phone: customerPhone } } : undefined,
              customerEmail ? { user: { email: customerEmail } } : undefined,
            ].filter(Boolean) as any
          }
        })
      }

      // Verify phone or email verification proof token for first order free eligibility
      const phoneProofHeader = (req.headers['x-phone-otp-token'] || (req.body as any).phoneOtpToken) as string | undefined
      const emailProofHeader = (req.headers['x-email-otp-token'] || (req.body as any).emailOtpToken) as string | undefined

      let isPhoneVerifiedProofValid = false
      let isEmailVerifiedProofValid = false

      const jwtSecret = process.env.JWT_SECRET || env.JWT_SECRET || 'a_very_secret_default_jwt_secret_key_32_chars_long'

      if (phoneProofHeader) {
        try {
          const decoded = jwt.verify(phoneProofHeader, jwtSecret) as any
          const expectedPurpose = loggedInUser ? 'SIGNUP' : 'GUEST_CHECKOUT'
          if (
            decoded &&
            decoded.type === 'PHONE_VERIFICATION_PROOF' &&
            decoded.verified === true &&
            decoded.phone === customerPhone &&
            (decoded.purpose === expectedPurpose || decoded.purpose === 'GUEST_CHECKOUT' || decoded.purpose === 'SIGNUP')
          ) {
            isPhoneVerifiedProofValid = true
          }
        } catch (tokenErr) {
          isPhoneVerifiedProofValid = false
        }
      }

      if (emailProofHeader) {
        try {
          const decoded = jwt.verify(emailProofHeader, jwtSecret) as any
          const expectedPurpose = loggedInUser ? 'SIGNUP' : 'GUEST_CHECKOUT'
          if (
            decoded &&
            decoded.type === 'EMAIL_VERIFICATION_PROOF' &&
            decoded.verified === true &&
            (decoded.purpose === expectedPurpose || decoded.purpose === 'GUEST_CHECKOUT' || decoded.purpose === 'SIGNUP')
          ) {
            isEmailVerifiedProofValid = true
          }
        } catch (tokenErr) {
          isEmailVerifiedProofValid = false
        }
      }

      const isUserPhoneVerifiedInDb = Boolean(loggedInUser?.phoneVerified)
      const isUserEmailVerifiedInDb = Boolean(loggedInUser?.emailVerified)

      const isPhoneVerifiedForOrder = isPhoneVerifiedProofValid || isUserPhoneVerifiedInDb
      const isEmailVerifiedForOrder = isEmailVerifiedProofValid || isUserEmailVerifiedInDb

      const isVerifiedForOrder = isPhoneVerifiedForOrder || isEmailVerifiedForOrder

      if (previousOrderCount === 0 && isVerifiedForOrder) {
        deliveryFee = 0 // First order FREE (Granted via verified Phone OR verified Email)
      } else if (subtotal > 500) {
        deliveryFee = 0 // Free above ₹500 threshold
      } else {
        deliveryFee = 49
      }
      const convenienceFee = 2
      const totalAmount = subtotal + deliveryFee + convenienceFee

      // 3. Handle credit limit checks for B2B
      if (data.paymentMethod === 'CREDIT_ACCOUNT') {
        if (!loggedInUser || !loggedInUser.isB2B) {
          throw new Error('Only B2B accounts can order using credit')
        }
        const remainingCredit = loggedInUser.creditLimit - loggedInUser.creditUsed
        if (remainingCredit < totalAmount) {
          throw new Error(`Insufficient credit limit. Available: ₹${remainingCredit.toFixed(2)}, Order Total: ₹${totalAmount.toFixed(2)}`)
        }

        // Update credit used
        await tx.user.update({
          where: { id: loggedInUser.id },
          data: {
            creditUsed: {
              increment: totalAmount
            }
          }
        })
      }

      // Normalize contact phone
      let cleanContactPhone = (data.guestPhone || loggedInUser?.phone || '').replace(/\D/g, '')
      if (cleanContactPhone.length > 10 && cleanContactPhone.startsWith('91')) {
        cleanContactPhone = cleanContactPhone.substring(2)
      }

      // Sync phone to user profile if user registered with email and didn't have phone
      if (loggedInUser && !loggedInUser.phone && cleanContactPhone.length === 10) {
        try {
          await tx.user.update({
            where: { id: loggedInUser.id },
            data: { phone: cleanContactPhone }
          })
        } catch (e) {}
      }

      // 4. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: loggedInUser?.id || null,
          businessName: loggedInUser?.isB2B ? loggedInUser.businessName : null,
          guestName: data.guestName || loggedInUser?.name || null,
          guestPhone: cleanContactPhone || loggedInUser?.phone || null,
          addressId: data.addressId || null,
          deliveryAddress: data.deliveryAddress,
          deliveryCity: data.deliveryCity,
          deliveryPincode: data.deliveryPincode,
          deliverySlot: data.deliverySlot,
          deliveryDate: data.deliveryDate,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentMethod === 'CREDIT_ACCOUNT' ? 'CREDIT_PENDING' : 'PENDING',
          status: 'CONFIRMED',
          subtotal,
          deliveryFee,
          coldHandlingFee: convenienceFee,
          totalAmount,
          notes: data.notes,
          items: {
            create: processedItems
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: 'CONFIRMED',
              changedBy: (loggedInUser?.id || 'system') as string,
              note: 'Order placed & automatically confirmed'
            }
          }
        }
      })

      return newOrder
    }, { maxWait: 10000, timeout: 20000 })

    // Notify administrators via socket in real-time
    if (ioInstance) {
      ioInstance.to('admin').emit('new_order', order)
    }

    mockSendSMS(
      loggedInUser?.phone || data.guestPhone || '',
      `Order placed successfully! Order #${orderNumber} for ₹${order.totalAmount}. Thank you for choosing Anmol Frozen Express.`
    )
    mockSendPushNotification('Order Received!', `New order #${orderNumber} placed for ₹${order.totalAmount}`)

    return res.status(201).json(order)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Create order error:', error)
    return res.status(400).json({ error: error.message || 'Failed to place order' })
  }
})

// ─── RAZORPAY PAYMENT GATEWAY ENDPOINTS ──────────────────────────────────────

// GET /api/config/razorpay-key — public client key
apiRouter.get('/config/razorpay-key', (_req: Request, res: Response) => {
  return res.json({
    keyId: env.RAZORPAY_KEY_ID || '',
    isTestMode: !env.isProd,
    hasRealKeys: Boolean(
      env.RAZORPAY_KEY_ID &&
      env.RAZORPAY_KEY_SECRET &&
      !env.RAZORPAY_KEY_ID.includes('placeholder') &&
      !env.RAZORPAY_KEY_ID.includes('mock')
    )
  })
})

// POST /api/razorpay/create-order — generates order with Razorpay
apiRouter.post('/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'Order ID is required' })
    }

    // Fetch order from DB — NEVER trust client-submitted amount
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Order has already been paid' })
    }

    // Idempotency: Reuse existing active Razorpay order if already generated
    if (order.razorpayOrderId && !order.razorpayOrderId.startsWith('order_mock_')) {
      return res.json({
        orderId: order.id,
        razorpayOrderId: order.razorpayOrderId,
        amount: Math.round(order.totalAmount * 100),
        currency: 'INR',
        keyId: env.RAZORPAY_KEY_ID,
        isMock: false
      })
    }

    const amountInPaise = Math.round(order.totalAmount * 100)
    const hasLiveKeys = Boolean(
      env.RAZORPAY_KEY_ID &&
      env.RAZORPAY_KEY_SECRET &&
      !env.RAZORPAY_KEY_ID.includes('placeholder') &&
      !env.RAZORPAY_KEY_ID.includes('mock')
    )

    // Production gate: In production, real keys are strictly required
    if (env.isProd && !hasLiveKeys) {
      console.error('[Razorpay] FATAL: Production environment without configured RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
      return res.status(500).json({ error: 'Payment gateway not configured for production.' })
    }

    // Development fallback mode: strictly restricted to non-production
    if (!hasLiveKeys) {
      const mockRzpOrderId = `order_mock_${order.id.slice(-8)}_${Date.now()}`
      await prisma.order.update({
        where: { id: order.id },
        data: { razorpayOrderId: mockRzpOrderId }
      })
      console.log(`[Razorpay DEV Mock]: Generated mock order ${mockRzpOrderId} for ₹${order.totalAmount}`)
      return res.json({
        orderId: order.id,
        razorpayOrderId: mockRzpOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: 'rzp_test_mock_key',
        isMock: true
      })
    }

    // Real Razorpay API Order Creation
    const basicAuth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerCity: order.deliveryCity
        }
      })
    })

    const rzpData = await rzpRes.json()

    if (!rzpRes.ok) {
      console.error('[Razorpay API Error]:', rzpData)
      return res.status(502).json({ error: rzpData.error?.description || 'Failed to create payment order with Razorpay' })
    }

    // Persist Razorpay Order ID to database
    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: rzpData.id }
    })

    return res.json({
      orderId: order.id,
      razorpayOrderId: rzpData.id,
      amount: rzpData.amount,
      currency: rzpData.currency,
      keyId: env.RAZORPAY_KEY_ID,
      isMock: false
    })
  } catch (error: any) {
    console.error('Create Razorpay order error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error while initiating payment' })
  }
})

// Helper for constant-time cryptographic comparison (protects against timing attacks)
function timingSafeEqualStr(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

// POST /api/razorpay/verify — verifies payment signature (fast-path UX)
apiRouter.post('/razorpay/verify', async (req: Request, res: Response) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment verification parameters' })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Idempotent: If already marked PAID (e.g. webhook arrived first), return OK without duplicate writes
    if (order.paymentStatus === 'PAID') {
      return res.json({ success: true, message: 'Payment already verified', order })
    }

    const isMock = razorpay_order_id.startsWith('order_mock_')

    if (isMock) {
      // Hard gate: Never allow mock signature in production!
      if (env.isProd) {
        return res.status(403).json({ error: 'Mock payments are forbidden in production' })
      }
      // Strict mock signature check: rejects tampered signatures even in development
      if (razorpay_signature !== 'mock_signature') {
        return res.status(400).json({ error: 'Invalid payment signature. Payment verification failed.' })
      }
      console.log(`[Razorpay DEV Mock]: Verified mock payment for order ${order.orderNumber}`)
    } else {
      // Real HMAC SHA256 Signature Verification with timingSafeEqualStr
      const secret = env.RAZORPAY_KEY_SECRET
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex')

      if (!timingSafeEqualStr(expectedSignature, razorpay_signature)) {
        console.warn(`[Razorpay Verification Failure]: Signature mismatch for order ${order.orderNumber}`)
        return res.status(400).json({ error: 'Invalid payment signature. Payment verification failed.' })
      }
    }

    // Atomic conditional update: only update if not already marked PAID by a concurrent webhook
    const updateResult = await prisma.order.updateMany({
      where: {
        id: order.id,
        paymentStatus: { not: 'PAID' }
      },
      data: {
        paymentStatus: 'PAID',
        status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
        notes: order.notes 
          ? `${order.notes} | Paid via Razorpay: ${razorpay_payment_id}`
          : `Paid via Razorpay: ${razorpay_payment_id}`
      }
    })

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true }
    })

    // Only fire audit log and socket broadcast if THIS request performed the state transition
    if (updateResult.count > 0) {
      await prisma.orderStatusLog.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: updatedOrder!.status,
          changedBy: 'razorpay_gateway',
          note: `Payment verified successfully (ID: ${razorpay_payment_id})`
        }
      })

      if (ioInstance) {
        ioInstance.to('admin').emit('order_status_update', updatedOrder)
        ioInstance.to(`order-${order.id}`).emit('order_status_update', updatedOrder)
      }
    }

    return res.json({ success: true, message: 'Payment verified successfully', order: updatedOrder })
  } catch (error: any) {
    console.error('Verify Razorpay payment error:', error)
    return res.status(500).json({ error: error.message || 'Payment verification failed' })
  }
})

// POST /api/webhooks/razorpay — asynchronous reconciliation source of truth
apiRouter.post('/webhooks/razorpay', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string | undefined
    if (!signature) {
      return res.status(400).json({ error: 'Missing x-razorpay-signature header' })
    }

    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET
    if (!webhookSecret) {
      console.warn('[Razorpay Webhook]: No webhook secret configured')
      return res.status(500).json({ error: 'Webhook secret not configured' })
    }

    // Use rawBody buffer captured in express middleware
    const payload = (req as any).rawBody || Buffer.from(JSON.stringify(req.body))
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')

    if (!timingSafeEqualStr(expectedSignature, signature)) {
      console.warn('[Razorpay Webhook]: Invalid webhook signature')
      return res.status(400).json({ error: 'Invalid webhook signature' })
    }

    const event = req.body
    console.log(`[Razorpay Webhook]: Received event ${event.event}`)

    // Handle payment.captured or order.paid
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity
      const rzpOrderId = paymentEntity?.order_id || event.payload?.order?.entity?.id
      const paymentId = paymentEntity?.id || 'webhook_captured'
      const noteOrderId = paymentEntity?.notes?.orderId || event.payload?.order?.entity?.notes?.orderId

      let order = null
      if (rzpOrderId) {
        order = await prisma.order.findFirst({ where: { razorpayOrderId: rzpOrderId } })
      }
      if (!order && noteOrderId) {
        order = await prisma.order.findUnique({ where: { id: noteOrderId } })
      }

      if (order) {
        // Race condition guard: Check if customer switched to COD while payment was in transit
        const wasSwitchedToCod = order.paymentMethod === 'CASH_ON_DELIVERY'

        const updateResult = await prisma.order.updateMany({
          where: {
            id: order.id,
            paymentStatus: { not: 'PAID' }
          },
          data: {
            paymentStatus: 'PAID',
            // If order was switched to COD, convert back to ONLINE to prevent driver collecting cash
            ...(wasSwitchedToCod ? { paymentMethod: 'ONLINE_UPI' } : {}),
            status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
            notes: wasSwitchedToCod
              ? `[DISPATCH ALERT: PAID ONLINE - DO NOT COLLECT CASH] Online payment captured via Razorpay (${paymentId}). ${order.notes || ''}`.trim()
              : order.notes 
                ? `${order.notes} | Reconciled via Webhook: ${paymentId}`
                : `Reconciled via Webhook: ${paymentId}`
          }
        })

        if (updateResult.count > 0) {
          const updatedOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: { items: true }
          })

          await prisma.orderStatusLog.create({
            data: {
              orderId: order.id,
              fromStatus: order.status,
              toStatus: updatedOrder!.status,
              changedBy: 'razorpay_webhook',
              note: wasSwitchedToCod
                ? `CRITICAL DISPATCH RECONCILIATION: Payment captured via Webhook (ID: ${paymentId}) after order was marked COD. Switched to PAID ONLINE to prevent duplicate cash collection.`
                : `Payment captured & verified via Webhook (ID: ${paymentId})`
            }
          })

          if (ioInstance) {
            ioInstance.to('admin').emit('order_status_update', updatedOrder)
            ioInstance.to(`order-${order.id}`).emit('order_status_update', updatedOrder)
          }

          console.log(`[Razorpay Webhook]: Reconciled order ${order.orderNumber} to PAID (wasSwitchedToCod: ${wasSwitchedToCod})`)
        } else {
          console.log(`[Razorpay Webhook]: Order ${order.orderNumber} already marked PAID (idempotent skip)`)
        }
      }
    }

    return res.json({ status: 'ok' })
  } catch (error: any) {
    console.error('Razorpay Webhook Error:', error)
    return res.status(500).json({ error: error.message || 'Webhook processing failed' })
  }
})

// POST /api/orders/:id/switch-to-cod — fallback for abandoned or failed online payments
apiRouter.post('/orders/:id/switch-to-cod', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const order = await prisma.order.findUnique({ where: { id } })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Cannot switch a paid order to COD' })
    }

    // In-flight guard: If order has a live Razorpay order ID, verify with Razorpay API before allowing switch
    if (order.razorpayOrderId && !order.razorpayOrderId.startsWith('order_mock_') && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')
        const rzpOrderRes = await fetch(`https://api.razorpay.com/v1/orders/${order.razorpayOrderId}`, {
          headers: { Authorization: authHeader }
        })
        if (rzpOrderRes.ok) {
          const rzpOrderData = await rzpOrderRes.json()
          if (rzpOrderData.status === 'paid' || (rzpOrderData.amount_paid && rzpOrderData.amount_paid > 0)) {
            // Already paid on Razorpay! Reconcile immediately
            await prisma.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: 'PAID',
                status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
                notes: order.notes ? `${order.notes} | Paid via Razorpay` : 'Paid via Razorpay'
              }
            })
            return res.status(400).json({ 
              error: 'Payment has already been received on Razorpay. This order is paid and cannot be switched to COD.' 
            })
          }
        }
      } catch (rzpErr) {
        console.error('Error verifying Razorpay order status during switch-to-cod:', rzpErr)
      }
    }

    // Atomic update: only proceed if order is still NOT paid
    const updateResult = await prisma.order.updateMany({
      where: {
        id,
        paymentStatus: { not: 'PAID' }
      },
      data: {
        paymentMethod: 'CASH_ON_DELIVERY',
        status: order.status === 'PENDING' ? 'CONFIRMED' : order.status
      }
    })

    if (updateResult.count === 0) {
      return res.status(400).json({ error: 'Order was paid while switching to COD. Cannot switch to COD.' })
    }

    const updatedOrder = await prisma.order.findUnique({ where: { id } })

    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: updatedOrder!.status,
        changedBy: 'customer',
        note: 'Customer switched payment method to Cash on Delivery (COD)'
      }
    })

    if (ioInstance) {
      ioInstance.to('admin').emit('order_status_update', updatedOrder)
      ioInstance.to(`order-${order.id}`).emit('order_status_update', updatedOrder)
    }

    return res.json({ success: true, order: updatedOrder })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to switch to COD' })
  }
})

apiRouter.get('/orders', authMiddleware, async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return res.json(orders)
  } catch (error) {
    console.error('Fetch customer orders error:', error)
    return res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

apiRouter.get('/orders/all', authMiddleware, requireRole(['ADMIN', 'STAFF']), async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        driver: true,
        user: true
      },
      orderBy: [
        { deliveryDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    return res.json(orders)
  } catch (error) {
    console.error('Fetch admin orders error:', error)
    return res.status(500).json({ error: 'Failed to fetch all orders' })
  }
})

// GET /orders/:id — requires auth; only the order owner or STAFF/ADMIN can view
apiRouter.get('/orders/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        driver: true,
        user: true,
        statusHistory: { orderBy: { createdAt: 'desc' } }
      }
    })

    if (!order) return res.status(404).json({ error: 'Order not found' })

    // Authorization: only the order's owner or STAFF/ADMIN may view it
    const isOwner = order.userId === req.user!.id
    const isStaffOrAdmin = ['STAFF', 'ADMIN'].includes(req.user!.role)
    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this order.' })
    }

    return res.json(order)
  } catch (error) {
    console.error('Fetch order detail error:', error)
    return res.status(500).json({ error: 'Failed to fetch order details' })
  }
})

apiRouter.put('/orders/:id/status', authMiddleware, requireRole(['ADMIN', 'STAFF']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const schema = z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'PACKING', 'PACKED', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
      note: z.string().optional()
    })
    const { status, note } = schema.parse(req.body)

    const currentOrder = await prisma.order.findUnique({ where: { id } })
    if (!currentOrder) return res.status(404).json({ error: 'Order not found' })

    // ── All state-changing operations are in ONE transaction ──────────────────
    // If any step fails, the entire operation rolls back atomically.
    // This prevents stock/credit from diverging from order status on DB errors.
    const order = await prisma.$transaction(async (tx) => {
      const timestampData: any = { status }
      if (status === 'PACKED') timestampData.packedAt = new Date()
      else if (status === 'OUT_FOR_DELIVERY') timestampData.dispatchedAt = new Date()
      else if (status === 'DELIVERED') {
        timestampData.deliveredAt = new Date()
        timestampData.paymentStatus = 'PAID'
      } else if (status === 'CANCELLED') {
        // Return credit if paid via credit account — inside transaction
        if (currentOrder.paymentMethod === 'CREDIT_ACCOUNT' && currentOrder.userId) {
          await tx.user.update({
            where: { id: currentOrder.userId },
            data: { creditUsed: { decrement: currentOrder.totalAmount } },
          })
        }

        // Restock all items — inside transaction
        // If the order update below fails, these increments roll back too.
        const items = await tx.orderItem.findMany({ where: { orderId: id } })
        for (const item of items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockCount: { increment: item.quantity } },
          })
        }
      }

      return await tx.order.update({
        where: { id },
        data: {
          ...timestampData,
          statusHistory: {
            create: {
              fromStatus: currentOrder.status, // actual current status, not hardcoded
              toStatus: status,
              changedBy: req.user!.id as string,
              note: note || `Status updated to ${status}`,
            },
          },
        },
        include: { items: true, statusHistory: true },
      })
    })

    // Emit live socket updates
    if (ioInstance) {
      ioInstance.to(`order-${id}`).emit('order_status_update', order)
      ioInstance.emit('order_list_update', order)
    }

    // Trigger notification services
    const userPhone = currentOrder.guestPhone || (currentOrder.userId ? (await prisma.user.findUnique({ where: { id: currentOrder.userId } }))?.phone : null)
    if (userPhone) {
      mockSendSMS(userPhone, `Order #${currentOrder.orderNumber} status is now: ${status}.`)
    }
    mockSendPushNotification(`Order Update`, `Order #${currentOrder.orderNumber} is now ${status}`)

    return res.json(order)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Update status error:', error)
    return res.status(500).json({ error: 'Failed to update order status' })
  }
})

apiRouter.put('/orders/:id/assign', authMiddleware, requireRole(['ADMIN', 'STAFF']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const schema = z.object({
      driverId: z.string()
    })
    const { driverId } = schema.parse(req.body)

    const order = await prisma.order.update({
      where: { id },
      data: {
        driverId,
        status: 'ASSIGNED',
        statusHistory: {
          create: {
            fromStatus: 'PACKED',
            toStatus: 'ASSIGNED',
            changedBy: req.user!.id as string,
            note: 'Driver assigned'
          }
        }
      },
      include: { items: true, driver: true }
    })

    if (ioInstance) {
      ioInstance.to(`order-${id}`).emit('order_status_update', order)
      ioInstance.emit('order_list_update', order)
    }

    return res.json(order)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Assign driver error:', error)
    return res.status(500).json({ error: 'Failed to assign driver' })
  }
})

// ─── ADMIN B2B BUSINESS ACCOUNTS MANAGEMENT ─────────────────────────────────

// ─── ADMIN REGISTERED USERS MANAGEMENT (RETAIL & BUSINESS) ─────────────

apiRouter.get('/admin/users', authMiddleware, requireRole(['ADMIN', 'STAFF']), async (req: Request, res: Response) => {
  try {
    const typeFilter = ((req.query.type as string) || 'ALL').toUpperCase()
    const statusFilter = ((req.query.status as string) || 'ALL').toUpperCase()
    const search = ((req.query.search as string) || '').trim()

    const whereClause: any = {}

    // Filter by type: RETAIL vs B2B vs ALL
    if (typeFilter === 'RETAIL') {
      whereClause.isB2B = false
    } else if (typeFilter === 'B2B') {
      whereClause.isB2B = true
    }

    // Filter by account or verification status
    if (statusFilter === 'ACTIVE') {
      whereClause.isActive = true
    } else if (statusFilter === 'DISABLED') {
      whereClause.isActive = false
    } else if (statusFilter === 'PENDING') {
      whereClause.isB2B = true
      whereClause.businessProfile = { verificationStatus: 'PENDING' }
    } else if (statusFilter === 'VERIFIED') {
      whereClause.isB2B = true
      whereClause.businessProfile = { verificationStatus: 'VERIFIED' }
    }

    // Keyword search
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { businessProfile: { gstin: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [users, totalCount, retailCount, b2bCount, pendingB2bCount, creditAgg, ordersCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          authProvider: true,
          isB2B: true,
          businessName: true,
          isCreditEnabled: true,
          creditLimit: true,
          creditUsed: true,
          phoneVerified: true,
          emailVerified: true,
          isActive: true,
          createdAt: true,
          businessProfile: true,
          addresses: {
            take: 2,
            orderBy: { isDefault: 'desc' }
          },
          _count: { select: { orders: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count(),
      prisma.user.count({ where: { isB2B: false } }),
      prisma.user.count({ where: { isB2B: true } }),
      prisma.businessProfile.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.user.aggregate({
        _sum: { creditLimit: true }
      }),
      prisma.order.count()
    ])

    return res.json({
      users,
      stats: {
        total: totalCount,
        retailCount,
        b2bCount,
        pendingB2bCount,
        creditAllocated: creditAgg._sum.creditLimit || 0,
        totalOrders: ordersCount
      }
    })
  } catch (error) {
    console.error('Fetch admin users error:', error)
    return res.status(500).json({ error: 'Failed to fetch registered users' })
  }
})

// Toggle user active / disabled status
apiRouter.put('/admin/users/:id/toggle-active', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive }
    })

    return res.json({
      success: true,
      message: `User ${updated.name || updated.phone} is now ${updated.isActive ? 'ACTIVE' : 'DEACTIVATED'}`,
      user: updated
    })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update user status' })
  }
})

// Toggle / Upgrade between Retail and B2B
apiRouter.put('/admin/users/:id/toggle-b2b', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string
    const { isB2B, businessName, businessType, gstin } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { businessProfile: true }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isB2B,
        businessName: isB2B ? (businessName || user.businessName || `${user.name}'s Enterprise`) : user.businessName,
        businessProfile: isB2B ? {
          upsert: {
            create: {
              businessName: businessName || user.businessName || `${user.name}'s Enterprise`,
              businessType: businessType || 'OTHER',
              gstin: gstin || null,
              verificationStatus: 'VERIFIED',
              isCreditEnabled: false
            },
            update: {
              businessName: businessName || user.businessName || undefined,
              businessType: businessType || undefined,
              gstin: gstin || undefined
            }
          }
        } : undefined
      },
      include: { businessProfile: true }
    })

    return res.json({
      success: true,
      message: `User ${updated.name} updated to ${isB2B ? 'B2B Business Account' : 'Retail Customer'}`,
      user: updated
    })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update user type' })
  }
})

// ─── CREATE USER (Admin) ──────────────────────────────────────────────────────
apiRouter.post('/admin/users', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits').optional().or(z.literal('')),
      email: z.string().email('Invalid email').optional().or(z.literal('')),
      role: z.enum(['CUSTOMER', 'STAFF']).default('CUSTOMER'),
      isB2B: z.boolean().default(false),
    }).refine(data => (data.phone && data.phone.trim()) || (data.email && data.email.trim()), {
      message: 'Either a 10-digit mobile number or an email address is required',
      path: ['phone']
    })
    const { name, phone, email, role, isB2B } = schema.parse(req.body)

    const cleanPhone = phone && phone.trim() ? phone.trim() : null
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null

    // Check phone uniqueness if provided
    if (cleanPhone) {
      const existing = await prisma.user.findUnique({ where: { phone: cleanPhone } })
      if (existing) return res.status(409).json({ error: 'A user with this phone number already exists.' })
    }

    // Check email uniqueness if provided
    if (cleanEmail) {
      const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } })
      if (existingEmail) return res.status(409).json({ error: 'A user with this email already exists.' })
    }

    const user = await prisma.user.create({
      data: {
        name,
        phone: cleanPhone,
        email: cleanEmail,
        role,
        isB2B,
        phoneVerified: false,
        emailVerified: !!cleanEmail,
        isActive: true,
        authProvider: cleanEmail ? 'EMAIL' : 'PHONE',
        businessName: isB2B ? `${name}'s Business` : null,
      }
    })

    return res.status(201).json({ success: true, message: `User "${name}" created successfully.`, user })
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: getZodErrorMessage(error) })
    return res.status(500).json({ error: error.message || 'Failed to create user' })
  }
})

// ─── UPDATE USER BASIC INFO (Admin) ──────────────────────────────────────────
apiRouter.patch('/admin/users/:id', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string
    const schema = z.object({
      name: z.string().min(2).optional(),
      phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits').optional(),
      email: z.string().email('Invalid email').optional().or(z.literal('')),
    })
    const updates = schema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Check phone uniqueness if changing
    if (updates.phone && updates.phone !== user.phone) {
      const clash = await prisma.user.findUnique({ where: { phone: updates.phone } })
      if (clash) return res.status(409).json({ error: 'Another user already has this phone number.' })
    }

    // Check email uniqueness if changing
    if (updates.email && updates.email !== user.email) {
      const clash = await prisma.user.findUnique({ where: { email: updates.email } })
      if (clash) return res.status(409).json({ error: 'Another user already has this email.' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.email !== undefined && { email: updates.email || null }),
      }
    })

    return res.json({ success: true, message: 'User info updated successfully.', user: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: getZodErrorMessage(error) })
    return res.status(500).json({ error: error.message || 'Failed to update user' })
  }
})

// ─── DELETE USER (Admin) ──────────────────────────────────────────────────────
apiRouter.delete('/admin/users/:id', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Protect admin accounts from accidental deletion
    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Admin accounts cannot be deleted through this endpoint.' })
    }

    // Anonymize orders to preserve order history integrity (do not hard-delete orders)
    await prisma.order.updateMany({
      where: { userId },
      data: { userId: null, guestName: user.name || 'Deleted User', guestPhone: user.phone || '' }
    })

    // Delete user (cascades: addresses, otpVerification, businessProfile via Prisma relations)
    await prisma.user.delete({ where: { id: userId } })

    return res.json({ success: true, message: `User "${user.name || user.phone}" has been deleted.` })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete user' })
  }
})

// ─── GET USER ORDERS (Admin) ──────────────────────────────────────────────────
apiRouter.get('/admin/users/:id/orders', authMiddleware, requireRole(['ADMIN', 'STAFF']), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        isB2B: true,
        businessName: true,
      }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        driver: {
          select: { id: true, name: true, vehicleNumber: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalSpent = orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.totalAmount : 0), 0)

    return res.json({
      success: true,
      user,
      totalSpent,
      totalOrders: orders.length,
      orders
    })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch user orders' })
  }
})

apiRouter.get('/admin/business-accounts', authMiddleware, requireRole(['ADMIN', 'STAFF']), async (req: Request, res: Response) => {
  try {
    const statusFilter = req.query.status as string | undefined
    const typeFilter = req.query.type as string | undefined
    
    const whereClause: any = {}
    if (typeFilter === 'RETAIL') {
      whereClause.isB2B = false
    } else if (typeFilter === 'B2B') {
      whereClause.isB2B = true
    } else if (!typeFilter) {
      // If legacy call without type filter, keep isB2B: true
      whereClause.isB2B = true
    }

    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.businessProfile = { verificationStatus: statusFilter }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        authProvider: true,
        isB2B: true,
        isCreditEnabled: true,
        businessName: true,
        creditLimit: true,
        creditUsed: true,
        phoneVerified: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        businessProfile: true,
        addresses: {
          take: 2,
          orderBy: { isDefault: 'desc' }
        },
        _count: { select: { orders: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return res.json(users)
  } catch (error) {
    console.error('Fetch business accounts error:', error)
    return res.status(500).json({ error: 'Failed to fetch business accounts' })
  }
})

// Toggle Credit Facility for B2B Account
apiRouter.put('/admin/business-accounts/:id/toggle-credit', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string
    const schema = z.object({
      isCreditEnabled: z.boolean(),
      creditLimit: z.number().min(0).optional(),
    })
    const { isCreditEnabled, creditLimit } = schema.parse(req.body)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { businessProfile: true }
    })

    if (!user) return res.status(404).json({ error: 'Business user not found' })

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isCreditEnabled,
        creditLimit: creditLimit !== undefined ? creditLimit : user.creditLimit,
        businessProfile: user.businessProfile ? {
          update: {
            isCreditEnabled
          }
        } : undefined
      },
      include: { businessProfile: true }
    })

    // Record Audit Log Entry for Financial B2B Credit Change
    await prisma.creditAuditLog.create({
      data: {
        adminId: req.user!.id,
        adminName: req.user!.name || req.user!.phone,
        targetUserId: user.id,
        businessName: user.businessName || user.name,
        action: 'TOGGLE_CREDIT',
        oldCreditEnabled: user.isCreditEnabled,
        newCreditEnabled: isCreditEnabled,
        oldCreditLimit: user.creditLimit,
        newCreditLimit: updatedUser.creditLimit,
        reason: `Credit facility ${isCreditEnabled ? 'ENABLED' : 'DISABLED'} by admin ${req.user!.name || req.user!.phone}`
      }
    })

    return res.json({
      message: `Credit facility ${isCreditEnabled ? 'ENABLED' : 'DISABLED'} for ${user.businessName || user.name}`,
      user: updatedUser
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Toggle credit error:', error)
    return res.status(500).json({ error: 'Failed to update credit status' })
  }
})

apiRouter.put('/admin/business-accounts/:id/verify', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string
    const schema = z.object({
      verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
      creditLimit: z.number().min(0).optional(),
      creditTier: z.enum(['BRONZE', 'SILVER', 'GOLD']).optional(),
      notes: z.string().optional()
    })
    const data = schema.parse(req.body)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { businessProfile: true }
    })

    if (!user) return res.status(404).json({ error: 'Business user not found' })

    // Update credit limit on User
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        creditLimit: data.creditLimit !== undefined ? data.creditLimit : user.creditLimit,
        businessProfile: user.businessProfile ? {
          update: {
            verificationStatus: data.verificationStatus,
            creditTier: data.creditTier || user.businessProfile.creditTier,
            approvedBy: req.user!.id,
            approvedAt: data.verificationStatus === 'VERIFIED' ? new Date() : user.businessProfile.approvedAt,
          }
        } : {
          create: {
            businessName: user.businessName || 'Business Owner',
            businessType: 'OTHER',
            verificationStatus: data.verificationStatus,
            creditTier: data.creditTier || 'BRONZE',
            approvedBy: req.user!.id,
            approvedAt: data.verificationStatus === 'VERIFIED' ? new Date() : undefined,
          }
        }
      },
      include: { businessProfile: true }
    })

    // Record Audit Log Entry for Financial B2B Verification Change
    await prisma.creditAuditLog.create({
      data: {
        adminId: req.user!.id,
        adminName: req.user!.name || req.user!.phone,
        targetUserId: user.id,
        businessName: user.businessName || user.name,
        action: 'VERIFY_BUSINESS',
        oldCreditEnabled: user.isCreditEnabled,
        newCreditEnabled: updatedUser.isCreditEnabled,
        oldCreditLimit: user.creditLimit,
        newCreditLimit: updatedUser.creditLimit,
        reason: `Business verification status set to ${data.verificationStatus}`
      }
    })

    // Send SMS notification mock
    mockSendSMS(updatedUser.phone, `Anmol Enterprises B2B Status: Your business account is now ${data.verificationStatus}. Credit Limit: Rs ${updatedUser.creditLimit}`)

    return res.json({
      message: `Business account updated to ${data.verificationStatus}`,
      user: updatedUser
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: getZodErrorMessage(error) })
    }
    console.error('Verify business account error:', error)
    return res.status(500).json({ error: 'Failed to verify business account' })
  }
})

// GET /admin/credit-audit-logs — fetch financial audit history
apiRouter.get('/admin/credit-audit-logs', authMiddleware, requireRole(['ADMIN']), async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.creditAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    return res.json(logs)
  } catch (error) {
    console.error('Fetch audit logs error:', error)
    return res.status(500).json({ error: 'Failed to fetch credit audit logs' })
  }
})

