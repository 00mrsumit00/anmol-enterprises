import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const REVIEW_AVATAR_PALETTE = [
  'bg-emerald-600',
  'bg-amber-600',
  'bg-blue-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-indigo-600',
  'bg-teal-600',
  'bg-amber-700',
]

export async function GET() {
  try {
    const dbReviews = await prisma.orderReview.findMany({
      where: {
        rating: { gte: 4 },
      },
      include: {
        user: {
          select: {
            name: true,
            businessName: true,
            isB2B: true,
            businessProfile: {
              select: {
                businessName: true,
                businessType: true,
              },
            },
          },
        },
        order: {
          select: {
            guestName: true,
            businessName: true,
            deliveryCity: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const formatted = dbReviews.map((r, idx) => {
      const isB2B = r.user?.isB2B || !!r.order?.businessName || !!r.user?.businessName || !!r.user?.businessProfile
      const name = r.user?.name || r.order?.guestName || 'Verified Customer'
      const business =
        r.user?.businessProfile?.businessName ||
        r.user?.businessName ||
        r.order?.businessName ||
        (isB2B ? 'Hotel / Cafe Partner' : 'Retail Customer')
      const bType = r.user?.businessProfile?.businessType
      const role = isB2B ? (bType ? `${bType} Partner` : 'Commercial Buyer') : 'Verified Buyer'
      const tag = isB2B ? (bType ? `${bType} Client` : 'Commercial Partner') : 'Express Delivery'
      const location = r.order?.deliveryCity ? `${r.order.deliveryCity}, Maharashtra` : 'Latur'
      const defaultComment =
        r.rating >= 5
          ? 'McCain products arrived in rock-solid frozen condition. Very quick delivery and professional service!'
          : 'Great cold-chain express delivery in Latur.'
      const comment = r.comment && r.comment.trim() ? r.comment.trim() : defaultComment
      const avatarBg = REVIEW_AVATAR_PALETTE[idx % REVIEW_AVATAR_PALETTE.length]

      return {
        id: r.id,
        name,
        role,
        business,
        location,
        rating: r.rating,
        comment,
        tag,
        verified: true,
        avatarBg,
      }
    })

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Fetch reviews error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
