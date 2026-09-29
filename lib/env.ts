import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

/**
 * lib/env.ts - Boot-time environment variable validator.
 * In production: any missing REQUIRED var kills the process immediately.
 * In development: warns but continues.
 * Import validateEnv() at the very TOP of server.ts before everything else.
 */

const REQUIRED_CORE: string[] = [
  'DATABASE_URL',
  'JWT_SECRET',
]

const OPTIONAL_INTEGRATIONS: string[] = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'MSG91_AUTH_KEY',
  'MSG91_TEMPLATE_ID',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
]

export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === 'production'
  const missing: string[] = []

  for (const key of REQUIRED_CORE) {
    if (!process.env[key] || process.env[key]?.trim() === '') missing.push(key)
  }

  if (missing.length > 0) {
    console.error('\n==== FATAL: Missing required core environment variables ====')
    missing.forEach(k => console.error('  - ' + k))
    console.error('App refusing to boot without a configured JWT_SECRET and DATABASE_URL in .env')
    process.exit(1)
  }

  const secret = process.env.JWT_SECRET || ''
  if (secret.length < 32) {
    console.error('FATAL: JWT_SECRET is ' + secret.length + ' chars — needs at least 32 chars for security.')
    process.exit(1)
  }

  const mockWords = ['mock', 'replace', 'your-', 'xxxx', 'fallback', 'test_mock']
  const mocks: string[] = []
  for (const key of OPTIONAL_INTEGRATIONS) {
    const val = process.env[key] || ''
    if (!val || mockWords.some(w => val.toLowerCase().includes(w))) mocks.push(key)
  }
  if (mocks.length > 0) {
    console.log('[ENV] Mock integrations (not live - expected in dev):')
    mocks.forEach(k => console.log('  MOCK: ' + k))
  }

  if (isProd) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    if (!appUrl.startsWith('https://')) {
      console.warn('[ENV WARNING]: NEXT_PUBLIC_APP_URL in production should start with https:// for secure Razorpay checkouts & webhooks.')
    }
  }

  console.log('[ENV] Validated OK - mode: ' + (isProd ? 'PRODUCTION' : 'DEVELOPMENT') + '\n')
}

export const env = {
  DATABASE_URL:          process.env.DATABASE_URL!,
  JWT_SECRET:            process.env.JWT_SECRET!,
  JWT_EXPIRY:            process.env.JWT_EXPIRY            || '7d',
  NODE_ENV:              process.env.NODE_ENV              || 'development',
  PORT:                  parseInt(process.env.PORT         || '3000', 10),
  isProd:                process.env.NODE_ENV === 'production',
  APP_NAME:              process.env.NEXT_PUBLIC_APP_NAME  || 'Anmol Enterprises',
  APP_URL:               process.env.NEXT_PUBLIC_APP_URL   || 'http://localhost:3000',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY:    process.env.CLOUDINARY_API_KEY    || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  RAZORPAY_KEY_ID:       process.env.RAZORPAY_KEY_ID       || '',
  RAZORPAY_KEY_SECRET:   process.env.RAZORPAY_KEY_SECRET   || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '',
  MSG91_AUTH_KEY:        process.env.MSG91_AUTH_KEY         || '',
  MSG91_TEMPLATE_ID:     process.env.MSG91_TEMPLATE_ID     || '',
  MSG91_SENDER_ID:       process.env.MSG91_SENDER_ID        || 'ANMOL',
  FIREBASE_PROJECT_ID:   process.env.FIREBASE_PROJECT_ID   || '',
  FIREBASE_PRIVATE_KEY:  process.env.FIREBASE_PRIVATE_KEY  || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
} as const
