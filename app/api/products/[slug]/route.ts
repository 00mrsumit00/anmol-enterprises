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

    // Update single variant prices, weight and stock if provided
    if (body.singlePrice !== undefined || body.singleB2bPrice !== undefined || body.singleWeight !== undefined || body.singleStock !== undefined) {
      const singleVar = updated.variants.find(v => v.packagingType === 'SINGLE')
      if (singleVar) {
        await prisma.productVariant.update({
          where: { id: singleVar.id },
          data: {
            retailPrice: body.singlePrice !== undefined ? Number(body.singlePrice) : singleVar.retailPrice,
            b2bPrice: body.singleB2bPrice !== undefined ? Number(body.singleB2bPrice) : singleVar.b2bPrice,
            weightGrams: body.singleWeight !== undefined ? Number(body.singleWeight) : singleVar.weightGrams,
            stockCount: body.singleStock !== undefined ? Number(body.singleStock) : singleVar.stockCount,
          }
        })
      }
    }

    // Support secondary retail pack (e.g. 2 kg pack for Green Peas)
    if (body.hasSecondaryPack && Number(body.secondaryWeight) > 0) {
      const secVar = updated.variants.find(v => v.packagingType === 'PACK_2')
      const secWeight = Number(body.secondaryWeight)
      const secPrice = Number(body.secondaryPrice) || (secVar ? secVar.retailPrice : 190)
      const secB2bPrice = Number(body.secondaryB2bPrice) || (secVar ? secVar.b2bPrice : 165)
      const secStock = body.secondaryStock !== undefined ? Number(body.secondaryStock) : (secVar ? secVar.stockCount : 50)

      if (secVar) {
        await prisma.productVariant.update({
          where: { id: secVar.id },
          data: {
            weightGrams: secWeight,
            retailPrice: secPrice,
            b2bPrice: secB2bPrice,
            stockCount: secStock,
            isActive: true,
          }
        })
      } else {
        await prisma.productVariant.create({
          data: {
            productId,
            packagingType: 'PACK_2',
            unitsInPack: 1,
            weightGrams: secWeight,
            skuCode: `MCN-${(updated.slug || 'PRD').substring(0, 4).toUpperCase()}-${secWeight}-${Date.now().toString().slice(-4)}`,
            retailPrice: secPrice,
            b2bPrice: secB2bPrice,
            stockCount: secStock,
            reorderLevel: 5,
            isActive: true,
          }
        })
      }
    } else if (body.hasSecondaryPack === false) {
      const secVar = updated.variants.find(v => v.packagingType === 'PACK_2')
      if (secVar) {
        await prisma.productVariant.update({
          where: { id: secVar.id },
          data: { isActive: false }
        })
      }
    }

    if (body.boxPrice !== undefined || body.boxB2bPrice !== undefined || body.boxStock !== undefined) {
      const boxVar = updated.variants.find(v => v.packagingType === 'BOX')
      if (boxVar) {
        await prisma.productVariant.update({
          where: { id: boxVar.id },
          data: {
            retailPrice: body.boxPrice !== undefined ? Number(body.boxPrice) : boxVar.retailPrice,
            b2bPrice: body.boxB2bPrice !== undefined ? Number(body.boxB2bPrice) : boxVar.b2bPrice,
            stockCount: body.boxStock !== undefined ? Number(body.boxStock) : boxVar.stockCount,
          }
        })
      }
    }

    if (body.cartonPrice !== undefined || body.cartonB2bPrice !== undefined || body.cartonStock !== undefined) {
      const cartonVar = updated.variants.find(v => v.packagingType === 'CARTON')
      if (cartonVar) {
        await prisma.productVariant.update({
          where: { id: cartonVar.id },
          data: {
            retailPrice: body.cartonPrice !== undefined ? Number(body.cartonPrice) : cartonVar.retailPrice,
            b2bPrice: body.cartonB2bPrice !== undefined ? Number(body.cartonB2bPrice) : cartonVar.b2bPrice,
            stockCount: body.cartonStock !== undefined ? Number(body.cartonStock) : cartonVar.stockCount,
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

    // Atomic transaction to permanently purge product and all dependent records from the database
    await prisma.$transaction(async (tx) => {
      // 1. Fetch all product variant IDs
      const variants = await tx.productVariant.findMany({
        where: { productId },
        select: { id: true }
      })
      const variantIds = variants.map((v) => v.id)

      // 2. Delete inventory movements and batches
      if (variantIds.length > 0) {
        await tx.stockMovement.deleteMany({ where: { variantId: { in: variantIds } } })
        await tx.inventoryBatch.deleteMany({ where: { variantId: { in: variantIds } } })
      }

      // 3. Delete order items referencing this product or its variants
      await tx.orderItem.deleteMany({ where: { productId } })
      if (variantIds.length > 0) {
        await tx.orderItem.deleteMany({ where: { variantId: { in: variantIds } } })
      }

      // 4. Delete product variants
      await tx.productVariant.deleteMany({ where: { productId } })

      // 5. Permanently delete the product
      await tx.product.delete({ where: { id: productId } })
    })

    return NextResponse.json({ message: 'Product permanently deleted from database' })
  } catch (error: any) {
    console.error('Error permanently deleting product in App Router:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 })
  }
}
