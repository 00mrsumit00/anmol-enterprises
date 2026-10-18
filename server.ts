import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { validateEnv, env } from './lib/env'

// ── Boot-time validation: fails loudly if required env vars are missing ────
// This must run BEFORE any other import that touches process.env in production.
validateEnv()

// Prevent unhandled promise rejections (such as idle DB connection timeouts) from crashing the server
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled Promise Rejection (intercepted to keep server alive):', reason)
})

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception (intercepted to keep server alive):', err)
})

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import express from 'express'
import compression from 'compression'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { Server as SocketIOServer } from 'socket.io'
import { apiRouter, setSocketIO } from './lib/backend'
import { prisma } from './lib/prisma'
import { verifyToken } from './lib/auth'

const port = env.PORT
const dev = !env.isProd
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Helper to validate allowed origins across production, staging, and local development
  const isOriginAllowed = (origin: string | undefined): boolean => {
    if (!origin || !env.isProd) return true
    try {
      const parsed = new URL(origin)
      const host = parsed.hostname.toLowerCase()
      if (host === 'localhost' || host === '127.0.0.1') return true
      if (host === 'anmolenterprisess.in' || host.endsWith('.anmolenterprisess.in')) return true
      if (host === 'anmolenterprises.in' || host.endsWith('.anmolenterprises.in')) return true
      if (host.endsWith('.onrender.com')) return true
      if (env.APP_URL) {
        const appUrlHost = new URL(env.APP_URL).hostname.toLowerCase()
        if (host === appUrlHost) return true
      }
    } catch {}
    return false
  }

  const expressApp = express()
  const httpServer = createServer(expressApp)
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true)
        } else {
          callback(new Error('Blocked by CORS policy'))
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  })

  setSocketIO(io)

  // ─── Socket.io Handshake Middleware ───────────────────────────────────────
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token

      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';')
        for (const cookie of cookies) {
          const [key, val] = cookie.trim().split('=')
          if (key === 'token') {
            token = val
            break
          }
        }
      }

      if (token) {
        const decoded = verifyToken(token)
        if (decoded) {
          socket.data.user = decoded
        }
      }
      next()
    } catch (err) {
      next()
    }
  })

  // ─── Socket.io Connection & Room Scope Authorization ──────────────────────
  io.on('connection', (socket) => {
    const user = socket.data?.user
    console.log(`[Socket] New connection: ${socket.id} (User: ${user ? `${user.userId} [${user.role}]` : 'Anonymous'})`)

    // Admin room: restricted strictly to SUPER_ADMIN, ADMIN or STAFF roles
    socket.on('join_admin', () => {
      const isAuthorized = user && ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user.role)
      if (!isAuthorized) {
        console.warn(`[Socket] Unauthorized join_admin attempt by ${socket.id} (User: ${user?.role || 'Anonymous'})`)
        return socket.emit('error', { message: 'Forbidden: Admin or Staff role required' })
      }
      socket.join('admin')
      console.log(`[Socket] Authorized: Socket ${socket.id} (${user.role}) joined admin room`)
    })

    // Order tracking room: restricted to order owner or SUPER_ADMIN/ADMIN/STAFF
    socket.on('join_order', async (orderId: string) => {
      try {
        if (!orderId || typeof orderId !== 'string') return

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { id: true, userId: true }
        })

        if (!order) {
          return socket.emit('error', { message: 'Order not found' })
        }

        const isStaffOrAdmin = user && ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user.role)
        const isOwner = user && order.userId === user.userId
        const isGuestOrder = order.userId === null

        if (isStaffOrAdmin || isOwner || isGuestOrder) {
          socket.join(`order-${orderId}`)
          console.log(`[Socket] Authorized: Socket ${socket.id} joined order-${orderId}`)
        } else {
          console.warn(`[Socket] Unauthorized join_order attempt for ${orderId} by socket ${socket.id}`)
          socket.emit('error', { message: 'Forbidden: You do not have permission to view this order' })
        }
      } catch (err) {
        console.error(`[Socket] join_order error for ${orderId}:`, err)
      }
    })

    socket.on('disconnect', () => {
      console.log(`[Socket] Connection disconnected: ${socket.id}`)
    })
  })

  // ─── HTTP Security Headers ────────────────────────────────────────────────
  expressApp.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    if (env.isProd) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }
    next()
  })

  // Middleware
  expressApp.use(compression())
  expressApp.use(
    cors({
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true)
        } else {
          callback(new Error('Blocked by CORS policy'))
        }
      },
      credentials: true,
    })
  )
  expressApp.use(cookieParser())

  // Content-Type enforcement middleware for state-changing endpoints (Anti-CSRF defense)
  // Forces all state-mutating requests (POST, PUT, PATCH, DELETE) to send application/json.
  // This ensures browsers execute a CORS preflight (OPTIONS) check for cross-origin calls.
  expressApp.use('/api', (req, res, next) => {
    // Exempt logout endpoints from strict content-type requirement
    if (req.path === '/auth/logout' || req.path === '/auth/signout') {
      return next()
    }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const contentType = req.headers['content-type'] || ''
      const contentLength = req.headers['content-length']
      // Permit DELETE without body or requests with empty content
      if (req.method === 'DELETE' && (!contentLength || contentLength === '0')) {
        return next()
      }
      if (!contentType.includes('application/json')) {
        return res.status(415).json({
          error: 'Unsupported Media Type: State-changing requests must specify Content-Type: application/json'
        })
      }
    }
    next()
  })

  // Dedicated 50MB payload limit for admin image upload
  expressApp.use(
    '/api/admin/upload-image',
    express.json({ limit: '50mb' }),
    express.urlencoded({ limit: '50mb', extended: true })
  )

  // Standard 2MB payload limit for all other API endpoints (DoS protection)
  expressApp.use(
    '/api',
    express.json({
      limit: '2mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf
      }
    }),
    express.urlencoded({ limit: '2mb', extended: true }),
    apiRouter
  )

  // Fast static file serving with aggressive browser caching for images
  expressApp.use('/images', express.static('public/images', {
    maxAge: '30d',
    immutable: true,
  }))

  // Global Express Error Handler: ensures API endpoints always return clean JSON, never raw HTML
  expressApp.use((err: any, req: any, res: any, next: any) => {
    console.error('[API Error]:', err.message || err)
    if (res.headersSent) return next(err)
    return res.status(err.status || (err.message?.includes('CORS') ? 403 : 500)).json({
      error: err.message || 'Internal Server Error'
    })
  })

  // Default Next.js handler
  expressApp.all('/{*splat}', (req, res) => {
    const parsedUrl = parse(req.url!, true)
    return handle(req, res, parsedUrl)
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
