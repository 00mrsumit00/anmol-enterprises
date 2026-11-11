import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function getAuthUser(req: Request) {
  const cookieStore = cookies()
  let token = cookieStore.get('token')?.value

  if (!token) {
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }
  }

  if (!token) return null
  return verifyToken(token)
}

// GET all store alerts (Admin & Staff)
export async function GET(req: Request) {
  try {
    const user = getAuthUser(req)
    if (!user || !['ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 })
    }

    const alerts = await prisma.storeAlert.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ alerts })
  } catch (error: any) {
    console.error('Error fetching store alerts:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch alerts' }, { status: 500 })
  }
}

// POST create new store alert (Admin & Staff)
export async function POST(req: Request) {
  try {
    const user = getAuthUser(req)
    if (!user || !['ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 })
    }

    const body = await req.json()
    const { title, message, badgeText, alertType, ctaText, ctaLink, isGlowing, isActive, expiresAt } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    // If new alert is marked active, optionally deactivate other alerts or allow latest to take priority
    const newAlert = await prisma.storeAlert.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        badgeText: badgeText ? badgeText.trim() : null,
        alertType: alertType || 'OFFER',
        ctaText: ctaText ? ctaText.trim() : null,
        ctaLink: ctaLink ? ctaLink.trim() : null,
        isGlowing: isGlowing !== undefined ? isGlowing : true,
        isActive: isActive !== undefined ? isActive : true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: user.userId || 'ADMIN'
      }
    })

    return NextResponse.json({ alert: newAlert, message: 'Store Alert created successfully!' })
  } catch (error: any) {
    console.error('Error creating store alert:', error)
    return NextResponse.json({ error: error.message || 'Failed to create alert' }, { status: 500 })
  }
}
