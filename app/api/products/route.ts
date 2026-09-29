import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        variants: { where: { isActive: true } }
      },
      orderBy: { sortOrder: 'asc' }
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name || !body.description || !body.imageUrl || !body.categoryId) {
      return NextResponse.json({ error: 'Missing required product fields' }, { status: 400 })
    }

    const singleWeight = Number(body.singleWeight) || 400
    const singlePrice = Number(body.singlePrice) || 199
    const singleB2bPrice = Number(body.singleB2bPrice) || 169
    const boxPrice = Number(body.boxPrice) || Math.round(singlePrice * 9.2)
    const boxB2bPrice = Number(body.boxB2bPrice) || Math.round(singleB2bPrice * 9.0)
    const cartonPrice = Number(body.cartonPrice) || Math.round(singlePrice * 44)
    const cartonB2bPrice = Number(body.cartonB2bPrice) || Math.round(singleB2bPrice * 42)

    // Clean slug generation
    let baseSlug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const existing = await prisma.product.findUnique({ where: { slug: baseSlug } })
    if (existing) {
      baseSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`
    }

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: baseSlug,
        categoryId: body.categoryId,
        description: body.description,
        brand: body.brand || 'McCain',
        isVeg: body.isVeg !== undefined ? Boolean(body.isVeg) : true,
        imageUrl: body.imageUrl,
        isFeatured: Boolean(body.isFeatured),
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        variants: {
          create: [
            {
              packagingType: 'SINGLE',
              unitsInPack: 1,
              weightGrams: singleWeight,
              skuCode: `MCN-${baseSlug.substring(0, 4).toUpperCase()}-${singleWeight}`,
              retailPrice: singlePrice,
              b2bPrice: singleB2bPrice,
              stockCount: 100,
            },
            {
              packagingType: 'BOX',
              unitsInPack: 10,
              weightGrams: singleWeight * 10,
              skuCode: `MCN-${baseSlug.substring(0, 4).toUpperCase()}-BOX`,
              retailPrice: boxPrice,
              b2bPrice: boxB2bPrice,
              stockCount: 50,
            },
            {
              packagingType: 'CARTON',
              unitsInPack: 50,
              weightGrams: singleWeight * 50,
              skuCode: `MCN-${baseSlug.substring(0, 4).toUpperCase()}-CAR`,
              retailPrice: cartonPrice,
              b2bPrice: cartonB2bPrice,
              stockCount: 20,
            }
          ]
        }
      },
      include: {
        category: true,
        variants: true
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Error creating product in App Router:', error)
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 })
  }
}
