/**
 * Twilio Verify API Integration
 * Docs: https://www.twilio.com/docs/verify/api
 *
 * Uses Twilio Verify Service (VA...) which handles OTP generation,
 * delivery, and verification entirely on Twilio's side.
 * No need to purchase a separate phone number.
 *
 * Trial accounts can only send to Verified Caller IDs.
 * Add recipient numbers at: Twilio Console → Phone Numbers → Verified Caller IDs
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface TwilioConfig {
  accountSid: string
  authToken: string
  verifyServiceSid: string
}

export interface TwilioVerifyResult {
  success: boolean
  status?: string   // 'pending' | 'approved' | 'canceled' | 'failed' | 'expired'
  sid?: string
  error?: string
  errorCode?: number
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

/**
 * Returns Twilio config from environment variables.
 * All three values are required for live operation.
 */
export function getTwilioConfig(): TwilioConfig {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || '',
  }
}

/**
 * Returns true when all Twilio Verify credentials are properly configured.
 */
export function isTwilioLive(): boolean {
  const { accountSid, authToken, verifyServiceSid } = getTwilioConfig()
  return (
    Boolean(accountSid) &&
    accountSid.startsWith('AC') &&
    Boolean(authToken) &&
    Boolean(verifyServiceSid) &&
    verifyServiceSid.startsWith('VA')
  )
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Creates a Basic Auth header value from accountSid + authToken.
 * Twilio API uses HTTP Basic Auth: username=AccountSID, password=AuthToken.
 */
function buildBasicAuth(accountSid: string, authToken: string): string {
  const credentials = `${accountSid}:${authToken}`
  return 'Basic ' + Buffer.from(credentials).toString('base64')
}

/**
 * Normalizes an Indian phone number to E.164 format (+91XXXXXXXXXX).
 * Accepts formats: 10 digits, 91XXXXXXXXXX, +91XXXXXXXXXX
 */
export function toE164India(phone: string): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  if (digits.length === 13 && phone.startsWith('+91')) return phone
  return `+91${digits.slice(-10)}`
}

// ─── SEND OTP ────────────────────────────────────────────────────────────────

/**
 * Sends an OTP to the given phone number via Twilio Verify Service.
 * Twilio generates the code and sends the SMS automatically.
 *
 * @param phone - Indian mobile number (10-digit, or with +91/91 prefix)
 * @returns TwilioVerifyResult with success flag and status
 */
export async function sendTwilioVerifyOtp(phone: string): Promise<TwilioVerifyResult> {
  const config = getTwilioConfig()

  if (!isTwilioLive()) {
    console.warn('[Twilio Verify]: Not configured — skipping live OTP delivery.')
    return { success: false, error: 'Twilio not configured' }
  }

  const e164Phone = toE164India(phone)
  const url = `https://verify.twilio.com/v2/Services/${config.verifyServiceSid}/Verifications`

  try {
    const body = new URLSearchParams({
      To: e164Phone,
      Channel: 'sms',
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': buildBasicAuth(config.accountSid, config.authToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await res.json() as Record<string, unknown>

    if (!res.ok) {
      const errMsg = (data.message as string) || `HTTP ${res.status}`
      const errCode = data.code as number | undefined
      console.error(`[Twilio Verify Send]: Failed for ${e164Phone} — Code ${errCode}: ${errMsg}`)
      return {
        success: false,
        status: 'failed',
        error: errMsg,
        errorCode: errCode,
      }
    }

    const status = data.status as string
    console.log(`[Twilio Verify Send]: OTP dispatched to ${e164Phone}, status=${status}`)
    return {
      success: status === 'pending',
      status,
      sid: data.sid as string,
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`[Twilio Verify Send]: Network error for ${e164Phone}: ${errMsg}`)
    return { success: false, error: errMsg }
  }
}

// ─── CHECK OTP ───────────────────────────────────────────────────────────────

/**
 * Verifies the OTP code entered by the user against Twilio Verify Service.
 * Twilio validates the code and returns 'approved' on success.
 *
 * @param phone - Same phone number used when sending the OTP
 * @param code  - The 6-digit code entered by the user
 * @returns TwilioVerifyResult with success=true if code is correct
 */
export async function checkTwilioVerifyOtp(phone: string, code: string): Promise<TwilioVerifyResult> {
  const config = getTwilioConfig()

  if (!isTwilioLive()) {
    return { success: false, error: 'Twilio not configured' }
  }

  const e164Phone = toE164India(phone)
  const url = `https://verify.twilio.com/v2/Services/${config.verifyServiceSid}/VerificationChecks`

  try {
    const body = new URLSearchParams({
      To: e164Phone,
      Code: code,
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': buildBasicAuth(config.accountSid, config.authToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await res.json() as Record<string, unknown>

    if (!res.ok) {
      const errMsg = (data.message as string) || `HTTP ${res.status}`
      const errCode = data.code as number | undefined

      // Error code 20404 = verification not found (expired or already used)
      if (errCode === 20404) {
        return { success: false, status: 'expired', error: 'OTP expired or already used. Please request a new OTP.' }
      }

      console.error(`[Twilio Verify Check]: Failed for ${e164Phone} — Code ${errCode}: ${errMsg}`)
      return { success: false, status: 'failed', error: errMsg, errorCode: errCode }
    }

    const status = data.status as string
    const isApproved = status === 'approved'

    if (!isApproved) {
      console.warn(`[Twilio Verify Check]: Incorrect OTP for ${e164Phone}, status=${status}`)
    } else {
      console.log(`[Twilio Verify Check]: OTP approved for ${e164Phone}`)
    }

    return {
      success: isApproved,
      status,
      sid: data.sid as string,
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`[Twilio Verify Check]: Network error for ${e164Phone}: ${errMsg}`)
    return { success: false, error: errMsg }
  }
}
