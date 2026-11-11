import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date()

    // 1. Fetch latest active StoreAlert
    const storeAlert = await prisma.storeAlert.findFirst({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    if (storeAlert) {
      return NextResponse.json({ alert: storeAlert })
    }

    // 2. Seamless fallback: Check active festive Campaign if no manual StoreAlert is active
    const activeCampaign = await prisma.campaign.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (activeCampaign) {
      return NextResponse.json({
        alert: {
          id: `campaign-${activeCampaign.id}`,
          title: activeCampaign.name,
          message: activeCampaign.bannerText,
          badgeText: activeCampaign.discountType === 'PERCENTAGE'
            ? `${activeCampaign.discountValue}% OFF AT CHECKOUT`
            : `₹${activeCampaign.discountValue} OFF AT CHECKOUT`,
          alertType: 'OFFER',
          ctaText: 'View Offers',
          ctaLink: '',
          isGlowing: true,
          isActive: true,
          createdAt: activeCampaign.createdAt
        }
      })
    }

    return NextResponse.json({ alert: null })
  } catch (error: any) {
    console.error('Error fetching active store alert:', error)
    return NextResponse.json({ alert: null, error: error.message }, { status: 500 })
  }
}
