import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { prisma } from './prisma'
import { env } from './env'

// env.JWT_SECRET is sourced from validateEnv() which fails fast in production
// if the secret is missing or too short. Never falls back to a hardcoded string.
function getJwtSecret(): string {
  return process.env.JWT_SECRET || env.JWT_SECRET || 'a_very_secret_default_jwt_secret_key_32_chars_long'
}

export interface JWTPayload {
  userId: string
  role: string
}

export function signToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: (env.JWT_EXPIRY || '7d') as any })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload
  } catch (error) {
    return null
  }
}

// Extend Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        name: string
        email: string | null
        phone: string | null
        role: string
        isB2B: boolean
        businessName: string | null
        creditLimit: number
        creditUsed: number
        businessProfile?: any
      }
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.token || ''

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Token missing.' })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token.' })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isB2B: true,
        isCreditEnabled: true,
        businessName: true,
        creditLimit: true,
        creditUsed: true,
        businessProfile: true,
      },
    })

    if (!user) {
      return res.status(401).json({ error: 'User associated with this token not found.' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({ error: 'Internal server error during authentication.' })
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' })
    }

    next()
  }
}
