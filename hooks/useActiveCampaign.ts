'use client'

import { useQuery } from '@tanstack/react-query'
import { useCart } from './useCart'

export interface ActiveCampaign {
  id: string
  name: string
  bannerText: string
  badgeText: string | null
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  scope: 'ALL' | 'CATEGORY' | 'PRODUCT'
  categoryIds?: string[]
  productIds?: string[]
  excludedProductIds?: string[]
  audience: 'ALL' | 'B2C_ONLY' | 'B2B_ONLY'
  minOrderAmount: number
  maxDiscountPerItem: number | null
  maxTotalDiscount: number | null
  allowCouponStacking: boolean
  isActive: boolean
  startDate: string
  endDate: string
}

export interface ProductOfferCalculation {
  hasOffer: boolean
  discountPercent: number
  discountAmount: number
  originalPrice: number
  finalPrice: number
  badgeText: string | null
  savingsLabel: string | null
  campaignName: string | null
}

export function useActiveCampaign() {
  const { isB2BMode } = useCart()

  const { data, isLoading } = useQuery({
    queryKey: ['active-festive-campaign', isB2BMode ? 'B2B' : 'B2C'],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/active?isB2B=${isB2BMode}`)
      if (!res.ok) return { campaign: null }
      return res.json() as Promise<{ campaign: ActiveCampaign | null }>
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })

  const campaign = data?.campaign || null

  const calculateProductOffer = (params: {
    productId: string
    categoryId?: string
    basePrice: number
  }): ProductOfferCalculation => {
    const { productId, categoryId, basePrice } = params

    // If no campaign is configured or active, return clean base price with zero fake discounts
    if (!campaign || !campaign.isActive) {
      return {
        hasOffer: false,
        discountPercent: 0,
        discountAmount: 0,
        originalPrice: basePrice,
        finalPrice: basePrice,
        badgeText: null,
        savingsLabel: null,
        campaignName: null,
      }
    }

    // Check audience rules
    if (campaign.audience === 'B2C_ONLY' && isB2BMode) {
      return {
        hasOffer: false,
        discountPercent: 0,
        discountAmount: 0,
        originalPrice: basePrice,
        finalPrice: basePrice,
        badgeText: null,
        savingsLabel: null,
        campaignName: null,
      }
    }
    if (campaign.audience === 'B2B_ONLY' && !isB2BMode) {
      return {
        hasOffer: false,
        discountPercent: 0,
        discountAmount: 0,
        originalPrice: basePrice,
        finalPrice: basePrice,
        badgeText: null,
        savingsLabel: null,
        campaignName: null,
      }
    }

    // Check excluded products
    if (campaign.excludedProductIds && campaign.excludedProductIds.includes(productId)) {
      return {
        hasOffer: false,
        discountPercent: 0,
        discountAmount: 0,
        originalPrice: basePrice,
        finalPrice: basePrice,
        badgeText: null,
        savingsLabel: null,
        campaignName: null,
      }
    }

    // Check scope targeting (PRODUCT or CATEGORY)
    if (campaign.scope === 'PRODUCT' && (!campaign.productIds || !campaign.productIds.includes(productId))) {
      return {
        hasOffer: false,
        discountPercent: 0,
        discountAmount: 0,
        originalPrice: basePrice,
        finalPrice: basePrice,
        badgeText: null,
        savingsLabel: null,
        campaignName: null,
      }
    }
    if (
      campaign.scope === 'CATEGORY' &&
      (!categoryId || !campaign.categoryIds || !campaign.categoryIds.includes(categoryId))
    ) {
      return {
        hasOffer: false,
        discountPercent: 0,
        discountAmount: 0,
        originalPrice: basePrice,
        finalPrice: basePrice,
        badgeText: null,
        savingsLabel: null,
        campaignName: null,
      }
    }

    // Calculate real dynamic discount
    let discountAmount = 0
    let discountPercent = 0

    if (campaign.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((basePrice * campaign.discountValue) / 100)
      if (campaign.maxDiscountPerItem && campaign.maxDiscountPerItem > 0) {
        discountAmount = Math.min(discountAmount, campaign.maxDiscountPerItem)
      }
      discountPercent = campaign.discountValue
    } else {
      discountAmount = Math.min(basePrice, campaign.discountValue)
      discountPercent = basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0
    }

    if (discountAmount <= 0) {
      return {
        hasOffer: false,
        discountPercent: 0,
        discountAmount: 0,
        originalPrice: basePrice,
        finalPrice: basePrice,
        badgeText: null,
        savingsLabel: null,
        campaignName: null,
      }
    }

    const finalPrice = Math.max(0, basePrice - discountAmount)
    const badgeText = campaign.badgeText || `${discountPercent}% OFF`
    const savingsLabel = `Save ₹${discountAmount} • ${campaign.name}`

    return {
      hasOffer: true,
      discountPercent,
      discountAmount,
      originalPrice: basePrice,
      finalPrice,
      badgeText,
      savingsLabel,
      campaignName: campaign.name,
    }
  }

  return {
    campaign,
    isLoading,
    calculateProductOffer,
  }
}
