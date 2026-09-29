import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function getAuthUserId() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  const decoded = verifyToken(token)
  return decoded ? decoded.userId : null
}

export async function GET() {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(addresses)
  } catch (error) {
    console.error('Fetch addresses error:', error)
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { label, flatNo, street, landmark, city, pincode, isDefault } = body

    if (!flatNo || !street || !pincode) {
      return NextResponse.json({ error: 'Flat No, Street, and Pincode are required' }, { status: 400 })
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      })
    }

    const address = await prisma.address.create({
      data: {
        userId,
        label: label || 'Home',
        flatNo,
        street,
        landmark: landmark || null,
        city: city || 'Latur',
        pincode,
        isDefault: Boolean(isDefault)
      }
    })

    return NextResponse.json(address, { status: 201 })
  } catch (error) {
    console.error('Create address error:', error)
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 })
    }

    const existing = await prisma.address.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    await prisma.address.delete({ where: { id } })
    return NextResponse.json({ message: 'Address deleted' })
  } catch (error) {
    console.error('Delete address error:', error)
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
  }
}
