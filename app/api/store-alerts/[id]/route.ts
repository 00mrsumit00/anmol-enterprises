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

// PUT update store alert (e.g. toggle active or edit fields)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getAuthUser(req)
    if (!user || !['ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 })
    }

    const { id } = params
    const body = await req.json()

    const existing = await prisma.storeAlert.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    const updated = await prisma.storeAlert.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.message !== undefined ? { message: body.message.trim() } : {}),
        ...(body.badgeText !== undefined ? { badgeText: body.badgeText ? body.badgeText.trim() : null } : {}),
        ...(body.alertType !== undefined ? { alertType: body.alertType } : {}),
        ...(body.ctaText !== undefined ? { ctaText: body.ctaText ? body.ctaText.trim() : null } : {}),
        ...(body.ctaLink !== undefined ? { ctaLink: body.ctaLink ? body.ctaLink.trim() : null } : {}),
        ...(body.isGlowing !== undefined ? { isGlowing: body.isGlowing } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.expiresAt !== undefined ? { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null } : {})
      }
    })

    return NextResponse.json({ alert: updated, message: 'Store Alert updated successfully' })
  } catch (error: any) {
    console.error('Error updating store alert:', error)
    return NextResponse.json({ error: error.message || 'Failed to update alert' }, { status: 500 })
  }
}

// DELETE store alert
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getAuthUser(req)
    if (!user || !['ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 })
    }

    const { id } = params
    await prisma.storeAlert.delete({ where: { id } })

    return NextResponse.json({ message: 'Store alert deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting store alert:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete alert' }, { status: 500 })
  }
}
