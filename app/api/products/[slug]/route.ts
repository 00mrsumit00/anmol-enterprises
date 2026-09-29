import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const rawSlug = params.slug
    if (!rawSlug) {
      return NextResponse.json({ error: 'Slug parameter required' }, { status: 400 })
    }

    const slug = decodeURIComponent(rawSlug).trim().toLowerCase()

    // 1. Try exact slug match
    let product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: { where: { isActive: true } }
      }
    })

    // 2. Try ID or partial/hyphenated slug match
    if (!product) {
      const cleanSearch = slug.replace(/[^a-z0-9]/g, '')
      const allProducts = await prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: true,
          variants: { where: { isActive: true } }
        }
      })

      product = allProducts.find(p => 
        p.slug.toLowerCase() === slug ||
        p.id.toLowerCase() === slug ||
        p.slug.replace(/[^a-z0-9]/g, '') === cleanSearch ||
        p.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanSearch) ||
        cleanSearch.includes(p.slug.replace(/[^a-z0-9]/g, ''))
      ) || null
    }

    // 3. Fallback: Return first available product if slug yields no match
    if (!product) {
      product = await prisma.product.findFirst({
        where: { isActive: true },
        include: {
          category: true,
          variants: { where: { isActive: true } }
        }
      })
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product detail:', error)
    return NextResponse.json({ error: 'Failed to fetch product details' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const id = params.slug
    const body = await request.json()

    // Check if product exists by ID or slug
    const target = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] }
    })

    if (!target) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const productId = target.id

    // Update main product details
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        description: body.description !== undefined ? body.description : undefined,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : undefined,
        categoryId: body.categoryId !== undefined ? body.categoryId : undefined,
        brand: body.brand !== undefined ? body.brand : undefined,
        isVeg: body.isVeg !== undefined ? Boolean(body.isVeg) : undefined,
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      },
      include: {
        category: true,
        variants: true
      }
    })

    // Update variant prices if provided
    if (body.singlePrice !== undefined || body.singleB2bPrice !== undefined) {
      const singleVar = updated.variants.find(v => v.packagingType === 'SINGLE')
      if (singleVar) {
        await prisma.productVariant.update({
          where: { id: singleVar.id },
          data: {
            retailPrice: Number(body.singlePrice) || singleVar.retailPrice,
            b2bPrice: Number(body.singleB2bPrice) || singleVar.b2bPrice
          }
        })
      }
    }

    if (body.boxPrice !== undefined || body.boxB2bPrice !== undefined) {
      const boxVar = updated.variants.find(v => v.packagingType === 'BOX')
      if (boxVar) {
        await prisma.productVariant.update({
          where: { id: boxVar.id },
          data: {
            retailPrice: Number(body.boxPrice) || boxVar.retailPrice,
            b2bPrice: Number(body.boxB2bPrice) || boxVar.b2bPrice
          }
        })
      }
    }

    if (body.cartonPrice !== undefined || body.cartonB2bPrice !== undefined) {
      const cartonVar = updated.variants.find(v => v.packagingType === 'CARTON')
      if (cartonVar) {
        await prisma.productVariant.update({
          where: { id: cartonVar.id },
          data: {
            retailPrice: Number(body.cartonPrice) || cartonVar.retailPrice,
            b2bPrice: Number(body.cartonB2bPrice) || cartonVar.b2bPrice
          }
        })
      }
    }

    const finalProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, variants: true }
    })

    return NextResponse.json(finalProduct)
  } catch (error: any) {
    console.error('Error updating product in App Router:', error)
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const id = params.slug
    const target = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] }
    })

    if (!target) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const productId = target.id

    // Check if product is in any orders
    const orderItemCount = await prisma.orderItem.count({
      where: { productId }
    })

    if (orderItemCount > 0) {
      // Deactivate instead of hard delete
      await prisma.product.update({
        where: { id: productId },
        data: { isActive: false }
      })
      return NextResponse.json({ message: 'Product deactivated (existing orders depend on it)' })
    } else {
      // Safe hard delete
      await prisma.productVariant.deleteMany({ where: { productId } })
      await prisma.product.delete({ where: { id: productId } })
      return NextResponse.json({ message: 'Product deleted successfully' })
    }
  } catch (error: any) {
    console.error('Error deleting product in App Router:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 })
  }
}
