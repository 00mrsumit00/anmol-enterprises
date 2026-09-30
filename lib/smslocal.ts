/**
 * SmsLocal (India DLT SMS Gateway) Integration
 * Docs: https://app.smslocal.in/developer/httpapi
 * Endpoint: https://app.smslocal.in/api/smsapi?key=...&route=...&sender=...&number=...&sms=...&templateid=...
 */

export interface SmsLocalConfig {
  apiKey: string
  senderId: string
  otpRoute: number
  transactionalRoute: number
  otpTemplateId: string
  otpMessageFormat: string
  orderTemplateId?: string
  orderMessageFormat?: string
}

export const SMSLOCAL_ERROR_CODES: Record<string, string> = {
  '101': 'Invalid User / API Key (Check SMSLOCAL_API_KEY)',
  '102': 'Invalid Sender ID (Sender ID not approved or mismatched in DLT)',
  '103': 'Invalid Contact number(s) (Must be valid 10-digit Indian mobile numbers)',
  '104': 'Invalid Route (e.g. Route 2 for OTP, Route 1 for Transactional)',
  '105': 'Invalid Message (Message text does not match DLT approved template)',
  '106': 'Spam Blocked',
  '107': 'Promotional Block',
  '108': 'Low Credits (Recharge your SmsLocal wallet balance)',
  '109': 'Promotional Route Restricted (Working hours 9:00 AM to 8:45 PM only)',
  '110': 'Invalid DLT Template ID (Template ID not registered or mismatched)',
  '111': 'No SMSC (Gateway server error, retry later)',
}

/**
 * Normalizes phone numbers to standard 10-digit Indian mobile numbers without +91 or 0 prefix
 */
export function normalizeIndianPhone(phone: string): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length > 10) {
    return digits.slice(-10)
  }
  return digits
}

/**
 * Reads configuration from environment variables
 */
export function getSmsLocalConfig(): SmsLocalConfig {
  return {
    apiKey: process.env.SMSLOCAL_API_KEY || '',
    senderId: process.env.SMSLOCAL_SENDER_ID || '',
    otpRoute: parseInt(process.env.SMSLOCAL_OTP_ROUTE || '2', 10), // Route 2 = OTP
    transactionalRoute: parseInt(process.env.SMSLOCAL_TRANSACTIONAL_ROUTE || '1', 10), // Route 1 = Transactional
    otpTemplateId: process.env.SMSLOCAL_OTP_TEMPLATE_ID || '',
    otpMessageFormat: process.env.SMSLOCAL_OTP_MESSAGE_FORMAT || 'Your OTP for login to Anmol Enterprises is {#var#}. Valid for 10 minutes. - Anmol Enterprises',
    orderTemplateId: process.env.SMSLOCAL_ORDER_TEMPLATE_ID || '',
    orderMessageFormat: process.env.SMSLOCAL_ORDER_MESSAGE_FORMAT || 'Order #{#var#} confirmed! Amount: Rs.{#var#}. Anmol Enterprises.'
  }
}

/**
 * Checks if live SmsLocal credentials are configured
 */
export function isSmsLocalLive(): boolean {
  const config = getSmsLocalConfig()
  if (!config.apiKey || !config.senderId || !config.otpTemplateId) return false
  const lower = config.apiKey.toLowerCase()
  return !lower.includes('mock') && !lower.includes('placeholder') && !lower.includes('account_key')
}

/**
 * Dispatches an SMS via the SmsLocal HTTP GET API
 */
export async function sendSmsViaSmsLocal(params: {
  phone: string
  route: number
  message: string
  templateId: string
}): Promise<{ success: boolean; messageId?: string; error?: string; rawResponse?: string }> {
  const config = getSmsLocalConfig()
  const cleanPhone = normalizeIndianPhone(params.phone)

  if (!cleanPhone || cleanPhone.length !== 10) {
    return { success: false, error: `Invalid Indian phone number: ${params.phone}` }
  }

  // If live credentials are not configured, simulate delivery for development
  if (!isSmsLocalLive()) {
    console.log(`[SmsLocal Mock Stub]: Route=${params.route} | To=${cleanPhone} | Template=${params.templateId}`)
    console.log(`[SmsLocal Mock Content]: ${params.message}`)
    return { success: true, messageId: `mock_${Date.now()}` }
  }

  try {
    const url = new URL('https://app.smslocal.in/api/smsapi')
    url.searchParams.set('key', config.apiKey.trim())
    url.searchParams.set('route', params.route.toString())
    url.searchParams.set('sender', config.senderId.trim())
    url.searchParams.set('number', cleanPhone)
    url.searchParams.set('sms', params.message)
    url.searchParams.set('templateid', params.templateId.trim())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/plain, application/json, */*'
      }
    })

    const rawText = (await response.text()).trim()
    console.log(`[SmsLocal Response] Phone: ${cleanPhone} | Result: ${rawText}`)

    // Check if the response matches a known error code
    if (SMSLOCAL_ERROR_CODES[rawText]) {
      const errorMsg = `SmsLocal Error ${rawText}: ${SMSLOCAL_ERROR_CODES[rawText]}`
      console.error(`[SmsLocal Gateway Failure]: ${errorMsg}`)
      return { success: false, error: errorMsg, rawResponse: rawText }
    }

    // SmsLocal returns a numeric message ID upon successful queuing (e.g. 987650)
    // or sometimes a JSON payload with status
    if (/^\d+$/.test(rawText)) {
      return { success: true, messageId: rawText, rawResponse: rawText }
    }

    // Try parsing as JSON in case of structured response
    try {
      const json = JSON.parse(rawText)
      if (json.status === 'success' || json.message_id || json.messageid) {
        return { success: true, messageId: json.message_id || json.messageid, rawResponse: rawText }
      }
      if (json.error || json.status === 'error') {
        return { success: false, error: json.error || json.message || rawText, rawResponse: rawText }
      }
    } catch {}

    // Fallback: If not recognized error code and response is ok, treat as success
    if (response.ok && !rawText.toLowerCase().includes('error')) {
      return { success: true, messageId: rawText, rawResponse: rawText }
    }

    return { success: false, error: `Unexpected gateway response: ${rawText}`, rawResponse: rawText }

  } catch (err: any) {
    console.error('[SmsLocal Network Exception]:', err)
    return { success: false, error: err.message || 'Network error connecting to SmsLocal' }
  }
}

/**
 * Sends an OTP SMS using DLT Template
 * Automatically substitutes {#var#} or {{otp}} with the generated 6-digit OTP code.
 */
export async function sendSmsLocalOtp(phone: string, otpCode: string): Promise<boolean> {
  const config = getSmsLocalConfig()

  // Format message text matching DLT template
  let messageText = config.otpMessageFormat
  if (messageText.includes('{#var#}')) {
    messageText = messageText.replace('{#var#}', otpCode)
  } else if (messageText.includes('{{otp}}')) {
    messageText = messageText.replace('{{otp}}', otpCode)
  } else if (messageText.includes('{otp}')) {
    messageText = messageText.replace('{otp}', otpCode)
  } else {
    // If user's template string doesn't have a placeholder, append OTP or use standard format
    messageText = `${messageText} ${otpCode}`
  }

  const result = await sendSmsViaSmsLocal({
    phone,
    route: config.otpRoute, // Route 2 for OTP
    message: messageText,
    templateId: config.otpTemplateId
  })

  return result.success
}

/**
 * Sends a Transactional SMS (Order Confirmation / Status Update / B2B Alert)
 */
export async function sendSmsLocalTransactional(phone: string, message: string, templateId?: string): Promise<boolean> {
  const config = getSmsLocalConfig()
  const targetTemplateId = templateId || config.orderTemplateId

  // If no transactional DLT template ID is set yet, log informative stub
  if (!targetTemplateId) {
    console.log(`[SmsLocal Transactional Notice]: Message skipped (SMSLOCAL_ORDER_TEMPLATE_ID not configured). Content: "${message}" to ${phone}`)
    return true
  }

  const result = await sendSmsViaSmsLocal({
    phone,
    route: config.transactionalRoute, // Route 1 for Transactional
    message,
    templateId: targetTemplateId
  })

  return result.success
}

/**
 * Query available SMS credits on SmsLocal
 * Docs: https://app.smslocal.in/api/creditapi?key=...&route=...
 */
export async function checkSmsLocalCredits(route = 2): Promise<{ credits?: number; error?: string }> {
  const config = getSmsLocalConfig()
  if (!config.apiKey || !isSmsLocalLive()) {
    return { credits: 9999 } // Mock credits for dev
  }

  try {
    const url = `https://app.smslocal.in/api/creditapi?key=${encodeURIComponent(config.apiKey)}&route=${route}`
    const res = await fetch(url)
    const text = (await res.text()).trim()

    const credits = parseFloat(text)
    if (!isNaN(credits)) {
      return { credits }
    }
    return { error: text }
  } catch (err: any) {
    return { error: err.message || 'Failed to fetch credits' }
  }
}
