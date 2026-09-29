import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ── Seed Admin & Staff Users ─────────────────────────────
  const adminPhone = process.env.SEED_ADMIN_PHONE || '9422070000'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'anmoladmin2026'
  const staffPhone = process.env.SEED_STAFF_PHONE || '9422070001'
  const staffPassword = process.env.SEED_STAFF_PASSWORD || 'anmolstaff2026'

  const adminHash = await bcrypt.hash(adminPassword, 10)
  const staffHash = await bcrypt.hash(staffPassword, 10)

  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: { role: 'ADMIN', isActive: true, passwordHash: adminHash },
    create: {
      name: 'Anmol Admin',
      phone: adminPhone,
      passwordHash: adminHash,
      role: 'ADMIN',
      isActive: true,
      businessName: 'Anmol Enterprises Latur',
      isB2B: false,
    },
  })

  await prisma.user.upsert({
    where: { phone: staffPhone },
    update: { role: 'STAFF', isActive: true, passwordHash: staffHash },
    create: {
      name: 'Dispatch Manager',
      phone: staffPhone,
      passwordHash: staffHash,
      role: 'STAFF',
      isActive: true,
      businessName: 'Anmol Enterprises Latur',
      isB2B: false,
    },
  })

  // ── Categories ────────────────────────────────────────────
  const cat1 = await prisma.category.upsert({
    where: { slug: 'frozen-potato-snacks' },
    update: {},
    create: { name: 'Frozen Potato Snacks', slug: 'frozen-potato-snacks', emoji: '🍟', sortOrder: 1 },
  })
  const cat2 = await prisma.category.upsert({
    where: { slug: 'cheese-veggie-bites' },
    update: {},
    create: { name: 'Cheese & Veggie Bites', slug: 'cheese-veggie-bites', emoji: '🧀', sortOrder: 2 },
  })

  // ── Product seed helper ───────────────────────────────────
  const createProduct = async (data: {
    name: string; slug: string; desc: string; categoryId: string;
    isFeatured?: boolean; sortOrder: number;
    variants: Array<{ type: 'SINGLE' | 'BOX' | 'CARTON'; units: number; weight: number; sku: string; retail: number; b2b: number; stock: number }>
  }) => {
    const p = await prisma.product.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        name: data.name, slug: data.slug, brand: 'McCain',
        categoryId: data.categoryId, description: data.desc,
        isVeg: true, isFeatured: data.isFeatured ?? false,
        imageUrl: `https://res.cloudinary.com/anmol-enterprises/image/upload/products/${data.slug}.webp`,
        sortOrder: data.sortOrder,
      },
    })
    for (const v of data.variants) {
      await prisma.productVariant.upsert({
        where: { skuCode: v.sku },
        update: { stockCount: v.stock, retailPrice: v.retail, b2bPrice: v.b2b },
        create: {
          productId: p.id, packagingType: v.type,
          unitsInPack: v.units, weightGrams: v.weight,
          skuCode: v.sku, retailPrice: v.retail, b2bPrice: v.b2b,
          stockCount: v.stock, minOrderQty: 1,
        },
      })
    }
    return p
  }

  // ── CATEGORY 1: Frozen Potato Snacks ──────────────────────

  await createProduct({
    name: 'McCain French Fries', slug: 'mccain-french-fries',
    desc: 'Golden, crispy McCain French Fries. Classic straight-cut fries seasoned to perfection. Ready in 10 minutes from frozen. Air fryer or oven friendly.',
    categoryId: cat1.id, isFeatured: true, sortOrder: 1,
    variants: [
      { type: 'SINGLE', units: 1, weight: 420,  sku: 'MCN-FF-420',  retail: 199, b2b: 169, stock: 80 },
      { type: 'BOX',    units: 10, weight: 4200, sku: 'MCN-FF-BOX',  retail: 1790, b2b: 1499, stock: 20 },
      { type: 'CARTON', units: 50, weight: 21000, sku: 'MCN-FF-CRT', retail: 8500, b2b: 6999, stock: 8 },
    ],
  })

  await createProduct({
    name: 'McCain Aloo Tikki', slug: 'mccain-aloo-tikki',
    desc: 'Crispy on the outside, soft inside. Classic spiced potato patties perfect for chaat, burgers, or as a snack. Pack of 8 pieces.',
    categoryId: cat1.id, isFeatured: true, sortOrder: 2,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 400,  sku: 'MCN-AT-400',  retail: 179, b2b: 149, stock: 120 },
      { type: 'BOX',    units: 10, weight: 4000, sku: 'MCN-AT-BOX',  retail: 1690, b2b: 1349, stock: 30 },
      { type: 'CARTON', units: 50, weight: 20000, sku: 'MCN-AT-CRT', retail: 8000, b2b: 6299, stock: 10 },
    ],
  })

  await createProduct({
    name: 'McCain Veggie Nuggets', slug: 'mccain-veggie-nuggets',
    desc: 'Crunchy golden nuggets made with real vegetables. A healthier snacking choice. Kids love them! Ready in 8 minutes.',
    categoryId: cat1.id, sortOrder: 3,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 400,  sku: 'MCN-VN-400',  retail: 209, b2b: 179, stock: 60 },
      { type: 'BOX',    units: 10, weight: 4000, sku: 'MCN-VN-BOX',  retail: 1990, b2b: 1590, stock: 15 },
      { type: 'CARTON', units: 50, weight: 20000, sku: 'MCN-VN-CRT', retail: 9500, b2b: 7499, stock: 5 },
    ],
  })

  await createProduct({
    name: 'McCain Smiles', slug: 'mccain-smiles',
    desc: 'Smiley face shaped potato snacks that kids absolutely love. Fun to eat, delicious to taste. Made from real potatoes.',
    categoryId: cat1.id, sortOrder: 4,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 415,  sku: 'MCN-SM-415',  retail: 189, b2b: 159, stock: 90 },
      { type: 'BOX',    units: 10, weight: 4150, sku: 'MCN-SM-BOX',  retail: 1790, b2b: 1449, stock: 25 },
      { type: 'CARTON', units: 50, weight: 20750, sku: 'MCN-SM-CRT', retail: 8500, b2b: 6799, stock: 6 },
    ],
  })

  await createProduct({
    name: 'McCain Chilli Garlic Potato Bites', slug: 'mccain-chilli-garlic-bites',
    desc: 'Bite-sized potato pieces seasoned with bold chilli and garlic flavour. Perfect party snack and cafe menu item. Air fryer ready.',
    categoryId: cat1.id, sortOrder: 5,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 400,  sku: 'MCN-CGB-400',  retail: 219, b2b: 184, stock: 70 },
      { type: 'BOX',    units: 10, weight: 4000, sku: 'MCN-CGB-BOX',  retail: 2090, b2b: 1649, stock: 18 },
      { type: 'CARTON', units: 50, weight: 20000, sku: 'MCN-CGB-CRT', retail: 9900, b2b: 7699, stock: 4 },
    ],
  })

  await createProduct({
    name: 'McCain Super Wedges', slug: 'mccain-super-wedges',
    desc: 'Thick-cut seasoned wedges with a crispy outer and fluffy inside. A cafe and hotel breakfast staple. Oven or air fryer.',
    categoryId: cat1.id, sortOrder: 6,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 520,  sku: 'MCN-SW-520',  retail: 239, b2b: 199, stock: 55 },
      { type: 'BOX',    units: 10, weight: 5200, sku: 'MCN-SW-BOX',  retail: 2290, b2b: 1799, stock: 14 },
      { type: 'CARTON', units: 50, weight: 26000, sku: 'MCN-SW-CRT', retail: 10900, b2b: 8499, stock: 3 },
    ],
  })

  await createProduct({
    name: 'McCain Masala Fries', slug: 'mccain-masala-fries',
    desc: 'Classic fries with a desi twist — seasoned with aromatic Indian spices, chaat masala, and a hint of chilli. A local favourite.',
    categoryId: cat1.id, isFeatured: true, sortOrder: 7,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 420,  sku: 'MCN-MF-420',  retail: 209, b2b: 175, stock: 100 },
      { type: 'BOX',    units: 10, weight: 4200, sku: 'MCN-MF-BOX',  retail: 1990, b2b: 1579, stock: 22 },
      { type: 'CARTON', units: 50, weight: 21000, sku: 'MCN-MF-CRT', retail: 9500, b2b: 7299, stock: 7 },
    ],
  })

  await createProduct({
    name: 'McCain Veggie Burger Patty', slug: 'mccain-veggie-burger-patty',
    desc: 'Ready-to-cook burger patties packed with mixed vegetables and wholesome seasoning. Perfect for cafes, fast-food counters, and home burgers. Pack of 4.',
    categoryId: cat1.id, sortOrder: 8,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 300,  sku: 'MCN-VBP-300',  retail: 199, b2b: 169, stock: 45 },
      { type: 'BOX',    units: 10, weight: 3000, sku: 'MCN-VBP-BOX',  retail: 1890, b2b: 1499, stock: 12 },
      { type: 'CARTON', units: 50, weight: 15000, sku: 'MCN-VBP-CRT', retail: 8999, b2b: 6999, stock: 3 },
    ],
  })

  // ── CATEGORY 2: Cheese & Veggie Bites ────────────────────

  await createProduct({
    name: 'McCain Potato Cheese Shotz', slug: 'mccain-potato-cheese-shotz',
    desc: 'Small round shots filled with molten cheese and potato filling. Absolutely irresistible when served hot. A bestseller for cafes and parties.',
    categoryId: cat2.id, isFeatured: true, sortOrder: 1,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 400,  sku: 'MCN-PCS-400',  retail: 269, b2b: 229, stock: 75 },
      { type: 'BOX',    units: 10, weight: 4000, sku: 'MCN-PCS-BOX',  retail: 2590, b2b: 2049, stock: 18 },
      { type: 'CARTON', units: 50, weight: 20000, sku: 'MCN-PCS-CRT', retail: 12499, b2b: 9799, stock: 4 },
    ],
  })

  await createProduct({
    name: 'McCain Chilli Cheesy Nuggets', slug: 'mccain-chilli-cheesy-nuggets',
    desc: 'Golden-fried nuggets with a spicy cheese filling. The heat of chilli meets the richness of melted cheese in every bite. No preservatives.',
    categoryId: cat2.id, isFeatured: true, sortOrder: 2,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 420,  sku: 'MCN-CCN-420',  retail: 249, b2b: 211, stock: 85 },
      { type: 'BOX',    units: 10, weight: 4200, sku: 'MCN-CCN-BOX',  retail: 2390, b2b: 1899, stock: 20 },
      { type: 'CARTON', units: 50, weight: 21000, sku: 'MCN-CCN-CRT', retail: 11499, b2b: 8999, stock: 5 },
    ],
  })

  await createProduct({
    name: 'McCain Veggie Fingers', slug: 'mccain-veggie-fingers',
    desc: 'Elongated crispy fingers made from a blend of corn, peas, carrots, and potatoes. A healthier choice that does not compromise on taste.',
    categoryId: cat2.id, sortOrder: 3,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 400,  sku: 'MCN-VF-400',  retail: 229, b2b: 195, stock: 50 },
      { type: 'BOX',    units: 10, weight: 4000, sku: 'MCN-VF-BOX',  retail: 2190, b2b: 1749, stock: 14 },
      { type: 'CARTON', units: 50, weight: 20000, sku: 'MCN-VF-CRT', retail: 10500, b2b: 8199, stock: 4 },
    ],
  })

  await createProduct({
    name: 'McCain Cheese Pizza Mini Samosa', slug: 'mccain-cheese-pizza-mini-samosa',
    desc: 'A unique fusion of Indian samosa and Italian pizza flavours. Crispy triangular pastry filled with cheese, tomato, herbs. A crowd favourite.',
    categoryId: cat2.id, isFeatured: true, sortOrder: 4,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 300,  sku: 'MCN-CPS-300',  retail: 259, b2b: 219, stock: 65 },
      { type: 'BOX',    units: 10, weight: 3000, sku: 'MCN-CPS-BOX',  retail: 2490, b2b: 1979, stock: 16 },
      { type: 'CARTON', units: 50, weight: 15000, sku: 'MCN-CPS-CRT', retail: 11999, b2b: 9399, stock: 4 },
    ],
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // NEW CATEGORIES & PRODUCTS — Full McCain India catalog
  // Source: mccain.com/in + BigBasket + Zepto verified product listings
  // ─────────────────────────────────────────────────────────────────────────────

  const cat3 = await prisma.category.upsert({
    where: { slug: 'wraps-and-rolls' },
    update: {},
    create: { name: 'Wraps & Rolls', slug: 'wraps-and-rolls', emoji: '🌯', sortOrder: 3 },
  })

  const cat4 = await prisma.category.upsert({
    where: { slug: 'onion-corn-specialties' },
    update: {},
    create: { name: 'Onion & Corn Specialties', slug: 'onion-corn-specialties', emoji: '🌽', sortOrder: 4 },
  })

  const cat5 = await prisma.category.upsert({
    where: { slug: 'premium-fries-cuts' },
    update: {},
    create: { name: 'Premium Fries & Cuts', slug: 'premium-fries-cuts', emoji: '✨', sortOrder: 5 },
  })

  // ── Cat 3: Wraps & Rolls ───────────────────────────────────

  await createProduct({
    name: 'McCain Veg Seekh Kebab', slug: 'mccain-veg-seekh-kebab',
    desc: 'Tender, smoky seekh kebabs made from a blend of vegetables and spices. Perfect for wraps, starters, or party platters. Each pack contains 8 pieces.',
    categoryId: cat3.id, isFeatured: true, sortOrder: 1,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 280,   sku: 'MCN-VSK-280',  retail: 229,   b2b: 195,  stock: 60 },
      { type: 'BOX',    units: 10, weight: 2800,  sku: 'MCN-VSK-BOX',  retail: 2190,  b2b: 1749, stock: 15 },
      { type: 'CARTON', units: 50, weight: 14000, sku: 'MCN-VSK-CRT',  retail: 10499, b2b: 8199, stock: 4  },
    ],
  })

  await createProduct({
    name: 'McCain Corn & Peas Patty', slug: 'mccain-corn-peas-patty',
    desc: 'Wholesome burger patties made from sweet corn and peas, lightly seasoned. Great for veggie burgers at home, cafes, and QSRs. Pack of 4.',
    categoryId: cat3.id, sortOrder: 2,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 300,   sku: 'MCN-CPP-300',  retail: 209,  b2b: 178,  stock: 45 },
      { type: 'BOX',    units: 10, weight: 3000,  sku: 'MCN-CPP-BOX',  retail: 1990, b2b: 1590, stock: 12 },
      { type: 'CARTON', units: 50, weight: 15000, sku: 'MCN-CPP-CRT',  retail: 9500, b2b: 7499, stock: 3  },
    ],
  })

  // ── Cat 4: Onion & Corn Specialties ──────────────────────

  await createProduct({
    name: 'McCain Crispy Onion Rings', slug: 'mccain-crispy-onion-rings',
    desc: 'Thick-cut onion rings coated in a light, crispy golden batter. Great for dipping. A crowd-pleasing side dish for restaurants, pubs, and home kitchens.',
    categoryId: cat4.id, isFeatured: true, sortOrder: 1,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 250,   sku: 'MCN-COR-250',  retail: 199,  b2b: 169,  stock: 70 },
      { type: 'BOX',    units: 10, weight: 2500,  sku: 'MCN-COR-BOX',  retail: 1890, b2b: 1499, stock: 18 },
      { type: 'CARTON', units: 50, weight: 12500, sku: 'MCN-COR-CRT',  retail: 8999, b2b: 7099, stock: 5  },
    ],
  })

  await createProduct({
    name: 'McCain Corn Tikka', slug: 'mccain-corn-tikka',
    desc: 'Bite-sized corn pieces marinated in tandoori spices, grilled to perfection. A unique street-food inspired snack that works as a starter or side dish.',
    categoryId: cat4.id, sortOrder: 2,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 325,   sku: 'MCN-CT-325',  retail: 219,  b2b: 185,  stock: 55 },
      { type: 'BOX',    units: 10, weight: 3250,  sku: 'MCN-CT-BOX',  retail: 2090, b2b: 1659, stock: 14 },
      { type: 'CARTON', units: 50, weight: 16250, sku: 'MCN-CT-CRT',  retail: 9999, b2b: 7799, stock: 3  },
    ],
  })

  // ── Cat 5: Premium Fries & Cuts ──────────────────────────

  await createProduct({
    name: 'McCain Crinkle Cut Fries', slug: 'mccain-crinkle-cut-fries',
    desc: 'Wavy ridged crinkle-cut fries with extra surface area for maximum crispiness. Great for dipping. Air fryer ready. A QSR favourite across India.',
    categoryId: cat5.id, isFeatured: true, sortOrder: 1,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 420,   sku: 'MCN-CCF-420',  retail: 219,  b2b: 185,  stock: 90 },
      { type: 'BOX',    units: 10, weight: 4200,  sku: 'MCN-CCF-BOX',  retail: 2090, b2b: 1659, stock: 22 },
      { type: 'CARTON', units: 50, weight: 21000, sku: 'MCN-CCF-CRT',  retail: 9999, b2b: 7799, stock: 6  },
    ],
  })

  await createProduct({
    name: 'McCain V-Crispers', slug: 'mccain-v-crispers',
    desc: 'Uniquely shaped V-cut potato fries with a lattice design that holds sauces and dips better than regular fries. Crispy, light, and irresistible.',
    categoryId: cat5.id, isFeatured: true, sortOrder: 2,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 400,   sku: 'MCN-VCR-400',  retail: 229,   b2b: 195,  stock: 65 },
      { type: 'BOX',    units: 10, weight: 4000,  sku: 'MCN-VCR-BOX',  retail: 2190,  b2b: 1749, stock: 16 },
      { type: 'CARTON', units: 50, weight: 20000, sku: 'MCN-VCR-CRT',  retail: 10499, b2b: 8199, stock: 4  },
    ],
  })

  await createProduct({
    name: 'McCain Herb & Chilli Burger Patty', slug: 'mccain-herb-chilli-burger-patty',
    desc: 'Premium burger patties seasoned with fresh herbs and a kick of chilli. Juicy inside, crispy outside. Popular in cafes and quick-service restaurants.',
    categoryId: cat5.id, sortOrder: 3,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 300,   sku: 'MCN-HCP-300',  retail: 219,  b2b: 185,  stock: 40 },
      { type: 'BOX',    units: 10, weight: 3000,  sku: 'MCN-HCP-BOX',  retail: 2090, b2b: 1659, stock: 10 },
      { type: 'CARTON', units: 50, weight: 15000, sku: 'MCN-HCP-CRT',  retail: 9999, b2b: 7799, stock: 3  },
    ],
  })

  await createProduct({
    name: 'McCain Mini Samosa', slug: 'mccain-mini-samosa',
    desc: 'Crispy bite-sized mini samosas filled with spiced potato and peas. Perfect chai-time snack and party appetizer. 20 pieces per pack.',
    categoryId: cat5.id, sortOrder: 4,
    variants: [
      { type: 'SINGLE', units: 1,  weight: 400,   sku: 'MCN-MS-400',  retail: 249,   b2b: 211,  stock: 80 },
      { type: 'BOX',    units: 10, weight: 4000,  sku: 'MCN-MS-BOX',  retail: 2390,  b2b: 1899, stock: 20 },
      { type: 'CARTON', units: 50, weight: 20000, sku: 'MCN-MS-CRT',  retail: 11499, b2b: 8999, stock: 5  },
    ],
  })

  console.log('✅ Seed complete — 20 products, 60 variants across 5 categories')
}

main().catch(console.error).finally(() => prisma.$disconnect())
