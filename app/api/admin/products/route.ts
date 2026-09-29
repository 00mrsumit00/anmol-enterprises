import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !['ADMIN', 'STAFF'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin or Staff role required' }, { status: 403 })
    }

    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true
      },
      orderBy: { updatedAt: 'desc' }
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching admin products:', error)
    return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 })
  }
}
