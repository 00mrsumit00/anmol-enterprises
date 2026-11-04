import { prisma } from './prisma'

export interface PricingItemInput {
  variantId: string
  quantity: number
}

export interface CalculatePricingOptions {
  items: PricingItemInput[]
  userId?: string | null
  isB2B?: boolean
  paymentMethod?: string | null // 'CASH_ON_DELIVERY' | 'UPI' | 'CARD' | 'CREDIT_ACCOUNT'
  couponCode?: string | null
  userPhone?: string | null
  userEmail?: string | null
  tx?: any // optional Prisma transaction client
}

export interface CalculatedItem {
  productId: string
  productName: string
  productSlug: string
  imageUrl: string
  variantId: string
  variantSku: string
  packagingType: string
  weightGrams: number
  unitsInPack: number
  quantity: number
  mrp: number
  regularUnitPrice: number // base price (retail or b2b)
  campaignDiscountPerUnit: number
  effectiveUnitPrice: number // regularUnitPrice - campaignDiscountPerUnit
  lineTotal: number // effectiveUnitPrice * quantity
  lineSavings: number // (regularUnitPrice - effectiveUnitPrice) * quantity
  mrpSavings: number // (mrp - effectiveUnitPrice) * quantity
  campaignId: string | null
}

export interface CouponEvaluation {
  code: string
  description: string | null
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  maxDiscountAmount: number | null
  minOrderAmount: number
  paymentConstraint: 'ALL' | 'COD_ONLY' | 'ONLINE_ONLY'
  status: 'UNLOCKED' | 'LOCKED' | 'DISALLOWED_STACKING' | 'INVALID'
  shortfall: number // amount needed to unlock
  progressPercent: number // 0 to 100
  potentialDiscount: number // discount if applied now
  lockReason?: string
}

export interface PricingResult {
  items: CalculatedItem[]
  activeCampaign: {
    id: string
    name: string
    bannerText: string
    badgeText: string
    discountType: 'PERCENTAGE' | 'FIXED'
    discountValue: number
    allowCouponStacking: boolean
  } | null
  subtotal: number // sum of effective line totals
  originalSubtotal: number // sum of regular unit prices * quantity
  mrpTotal: number // sum of MRP * quantity
  campaignSavings: number
  mrpSavings: number
  availableCoupons: CouponEvaluation[]
  appliedCoupon: {
    code: string
    discount: number
    description: string | null
  } | null
  couponError?: string | null
  delivery: {
    fee: number
    isFree: boolean
    freeDeliveryThreshold: number
    shortfallToFree: number
    progressPercent: number
    reason: string
  }
  convenienceFee: number
  grandTotal: number
  totalSavings: number // campaignSavings + couponDiscount + (free delivery saving if applicable) + mrpSavings
  minOrderRequired: number
  isBelowMinOrder: boolean
  minOrderShortfall: number
}

/**
 * Centralized Server-Side Pricing Engine
 * Calculates base prices, campaign discounts, coupons, delivery thresholds, and total savings.
 * Used across Storefront, CartDrawer, Checkout, and Order Placement.
 */
export async function calculatePricing(options: CalculatePricingOptions): Promise<PricingResult> {
  const {
    items: inputItems,
    userId,
    isB2B = false,
    paymentMethod,
    couponCode,
    userPhone,
    userEmail,
    tx = prisma,
  } = options

  const now = new Date()

  // 1. Fetch active campaign if any
  const campaignAudienceFilter = isB2B
    ? { in: ['ALL', 'B2B_ONLY'] as any[] }
    : { in: ['ALL', 'B2C_ONLY'] as any[] }

  const activeCampaign = await tx.campaign.findFirst({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      audience: campaignAudienceFilter,
    },
    orderBy: { createdAt: 'desc' },
  })

  // 2. Fetch variants and compute line items
  const calculatedItems: CalculatedItem[] = []
  let originalSubtotal = 0
  let subtotal = 0
  let mrpTotal = 0
  let totalCampaignSavings = 0

  if (inputItems && inputItems.length > 0) {
    const variantIds = inputItems.map((i) => i.variantId)
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          include: { category: true },
        },
      },
    })

    const variantMap = new Map<string, any>()
    variants.forEach((v: any) => variantMap.set(v.id, v))

    for (const input of inputItems) {
      const variant = variantMap.get(input.variantId)
      if (!variant) continue

      const qty = Math.max(1, input.quantity)
      const baseUnitPrice = isB2B ? variant.b2bPrice : variant.retailPrice
      const mrp = Math.round(baseUnitPrice * 1.15) // Standard 15% estimated MRP if not explicitly provided

      // Check if item qualifies for active campaign
      let qualifiesForCampaign = false
      if (activeCampaign) {
        qualifiesForCampaign = true

        // Check exclusions
        if (activeCampaign.excludedProductIds?.includes(variant.productId)) {
          qualifiesForCampaign = false
        } else if (activeCampaign.scope === 'CATEGORY') {
          if (!activeCampaign.categoryIds?.includes(variant.product.categoryId)) {
            qualifiesForCampaign = false
          }
        } else if (activeCampaign.scope === 'PRODUCT') {
          if (!activeCampaign.productIds?.includes(variant.productId)) {
            qualifiesForCampaign = false
          }
        }
      }

      // Calculate campaign discount per unit
      let campaignDiscountPerUnit = 0
      if (qualifiesForCampaign && activeCampaign) {
        if (activeCampaign.discountType === 'PERCENTAGE') {
          campaignDiscountPerUnit = (baseUnitPrice * activeCampaign.discountValue) / 100
        } else {
          campaignDiscountPerUnit = activeCampaign.discountValue
        }

        if (activeCampaign.maxDiscountPerItem && campaignDiscountPerUnit > activeCampaign.maxDiscountPerItem) {
          campaignDiscountPerUnit = activeCampaign.maxDiscountPerItem
        }
        campaignDiscountPerUnit = Math.min(campaignDiscountPerUnit, baseUnitPrice)
        campaignDiscountPerUnit = Math.round(campaignDiscountPerUnit * 100) / 100
      }

      const effectiveUnitPrice = Math.max(0, Math.round((baseUnitPrice - campaignDiscountPerUnit) * 100) / 100)
      const lineTotal = Math.round(effectiveUnitPrice * qty * 100) / 100
      const lineSavings = Math.round((baseUnitPrice - effectiveUnitPrice) * qty * 100) / 100
      const mrpSavings = Math.round((mrp - effectiveUnitPrice) * qty * 100) / 100

      originalSubtotal += baseUnitPrice * qty
      subtotal += lineTotal
      mrpTotal += mrp * qty
      totalCampaignSavings += lineSavings

      calculatedItems.push({
        productId: variant.productId,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        imageUrl: variant.product.imageUrl || (variant.product.galleryImages?.[0] ?? ''),
        variantId: variant.id,
        variantSku: variant.skuCode,
        packagingType: variant.packagingType,
        weightGrams: variant.weightGrams,
        unitsInPack: variant.unitsInPack || 1,
        quantity: qty,
        mrp,
        regularUnitPrice: baseUnitPrice,
        campaignDiscountPerUnit,
        effectiveUnitPrice,
        lineTotal,
        lineSavings,
        mrpSavings,
        campaignId: qualifiesForCampaign && activeCampaign ? activeCampaign.id : null,
      })
    }
  }

  originalSubtotal = Math.round(originalSubtotal * 100) / 100
  subtotal = Math.round(subtotal * 100) / 100
  mrpTotal = Math.round(mrpTotal * 100) / 100
  totalCampaignSavings = Math.round(totalCampaignSavings * 100) / 100

  // 3. Evaluate Available Coupons (Unlocked vs Locked)
  const allCoupons = await tx.coupon.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: now } },
      ],
      startsAt: { lte: now },
      audience: campaignAudienceFilter,
    },
    orderBy: { minOrderAmount: 'asc' },
  })

  const availableCoupons: CouponEvaluation[] = []
  let appliedCoupon: PricingResult['appliedCoupon'] = null
  let couponError: string | null = null

  const isStackingAllowed = !activeCampaign || activeCampaign.allowCouponStacking

  for (const c of allCoupons) {
    const isUnlocked = subtotal >= c.minOrderAmount
    const shortfall = Math.max(0, Math.round((c.minOrderAmount - subtotal) * 100) / 100)
    const progressPercent = c.minOrderAmount > 0 ? Math.min(100, Math.round((subtotal / c.minOrderAmount) * 100)) : 100

    let potentialDiscount = 0
    if (c.discountType === 'FIXED') {
      potentialDiscount = Math.min(c.discountValue, subtotal)
    } else {
      potentialDiscount = (subtotal * c.discountValue) / 100
      if (c.maxDiscountAmount && potentialDiscount > c.maxDiscountAmount) {
        potentialDiscount = c.maxDiscountAmount
      }
    }
    potentialDiscount = Math.round(potentialDiscount * 100) / 100

    let status: CouponEvaluation['status'] = isUnlocked ? 'UNLOCKED' : 'LOCKED'
    let lockReason: string | undefined

    if (activeCampaign && !activeCampaign.allowCouponStacking && !c.allowStacking) {
      status = 'DISALLOWED_STACKING'
      lockReason = `Cannot combine with active ${activeCampaign.name}`
    } else if (!isUnlocked) {
      lockReason = `Add items worth ₹${shortfall} to unlock`
    }

    availableCoupons.push({
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxDiscountAmount: c.maxDiscountAmount,
      minOrderAmount: c.minOrderAmount,
      paymentConstraint: c.paymentConstraint,
      status,
      shortfall,
      progressPercent,
      potentialDiscount,
      lockReason,
    })
  }

  // 4. Validate and apply specific coupon if requested
  let appliedCouponDiscount = 0
  if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
    const cleanCode = couponCode.trim().toUpperCase()
    const foundCoupon = allCoupons.find((c: any) => c.code === cleanCode)

    if (!foundCoupon) {
      couponError = `Coupon code "${cleanCode}" is invalid or expired`
    } else if (activeCampaign && !activeCampaign.allowCouponStacking && !foundCoupon.allowStacking) {
      couponError = `Coupon "${cleanCode}" cannot be combined with the active ${activeCampaign.name} sale.`
    } else if (foundCoupon.usageLimit && foundCoupon.timesUsed >= foundCoupon.usageLimit) {
      couponError = `Coupon "${cleanCode}" usage limit has been reached.`
    } else if (subtotal < foundCoupon.minOrderAmount) {
      const needed = Math.round(foundCoupon.minOrderAmount - subtotal)
      couponError = `Add items worth ₹${needed} more to apply coupon "${cleanCode}".`
    } else if (foundCoupon.paymentConstraint === 'COD_ONLY' && paymentMethod && paymentMethod !== 'CASH_ON_DELIVERY') {
      couponError = `Coupon "${cleanCode}" is valid exclusively on Cash on Delivery orders.`
    } else if (foundCoupon.paymentConstraint === 'ONLINE_ONLY' && paymentMethod === 'CASH_ON_DELIVERY') {
      couponError = `Coupon "${cleanCode}" is valid exclusively on Online Prepaid orders.`
    } else {
      // Calculate discount
      if (foundCoupon.discountType === 'FIXED') {
        appliedCouponDiscount = Math.min(foundCoupon.discountValue, subtotal)
      } else {
        appliedCouponDiscount = (subtotal * foundCoupon.discountValue) / 100
        if (foundCoupon.maxDiscountAmount && appliedCouponDiscount > foundCoupon.maxDiscountAmount) {
          appliedCouponDiscount = foundCoupon.maxDiscountAmount
        }
      }
      appliedCouponDiscount = Math.min(appliedCouponDiscount, subtotal)
      appliedCouponDiscount = Math.round(appliedCouponDiscount * 100) / 100

      appliedCoupon = {
        code: foundCoupon.code,
        discount: appliedCouponDiscount,
        description: foundCoupon.description,
      }
    }
  }

  // 5. Evaluate Delivery Fee & Threshold Nudge
  const FREE_DELIVERY_THRESHOLD = 500
  let isFirstOrderFree = false

  // Check if first order free applies (verified user with 0 previous orders)
  if (userId || userPhone || userEmail) {
    const prevOrderCount = await tx.order.count({
      where: {
        OR: [
          userId ? { userId } : undefined,
          userPhone ? { guestPhone: userPhone } : undefined,
          userEmail ? { user: { email: userEmail } } : undefined,
        ].filter(Boolean),
      },
    })
    if (prevOrderCount === 0) {
      isFirstOrderFree = true
    }
  }

  let deliveryFee = 49
  let isFreeDelivery = false
  let deliveryReason = 'Standard cold-chain delivery'

  if (isFirstOrderFree) {
    deliveryFee = 0
    isFreeDelivery = true
    deliveryReason = 'First order free delivery!'
  } else if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    deliveryFee = 0
    isFreeDelivery = true
    deliveryReason = `Free delivery unlocked on orders above ₹${FREE_DELIVERY_THRESHOLD}`
  }

  const shortfallToFree = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal)
  const deliveryProgressPercent = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100))

  const convenienceFee = 2
  const discountedSubtotal = Math.max(0, subtotal - appliedCouponDiscount)
  const grandTotal = subtotal > 0 ? Math.round((discountedSubtotal + deliveryFee + convenienceFee) * 100) / 100 : 0

  // Minimum Order Check (199 for retail, 1500 for B2B)
  const minOrderRequired = isB2B ? 1500 : 199
  const isBelowMinOrder = subtotal < minOrderRequired
  const minOrderShortfall = Math.max(0, minOrderRequired - subtotal)

  // Overall Total Savings
  const savedDeliveryFee = isFreeDelivery ? 49 : 0
  const rawMrpSavings = Math.max(0, mrpTotal - originalSubtotal)
  const totalSavings = Math.round((totalCampaignSavings + appliedCouponDiscount + savedDeliveryFee + rawMrpSavings) * 100) / 100

  return {
    items: calculatedItems,
    activeCampaign: activeCampaign
      ? {
          id: activeCampaign.id,
          name: activeCampaign.name,
          bannerText: activeCampaign.bannerText,
          badgeText: activeCampaign.badgeText || 'DIWALI SALE',
          discountType: activeCampaign.discountType,
          discountValue: activeCampaign.discountValue,
          allowCouponStacking: activeCampaign.allowCouponStacking,
        }
      : null,
    subtotal,
    originalSubtotal,
    mrpTotal,
    campaignSavings: totalCampaignSavings,
    mrpSavings: rawMrpSavings,
    availableCoupons,
    appliedCoupon,
    couponError,
    delivery: {
      fee: deliveryFee,
      isFree: isFreeDelivery,
      freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
      shortfallToFree,
      progressPercent: deliveryProgressPercent,
      reason: deliveryReason,
    },
    convenienceFee,
    grandTotal,
    totalSavings,
    minOrderRequired,
    isBelowMinOrder,
    minOrderShortfall,
  }
}
