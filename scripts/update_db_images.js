const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const IMAGE_MAPPING = {
  'mccain-french-fries': '/images/products/mccain-french-fries-420g.jpg',
  'mccain-smiles': '/images/products/mccain-smiles.jpg',
  'mccain-potato-cheese-shotz': '/images/products/mccain-potato-cheese-shotz.jpg',
  'mccain-aloo-tikki': '/images/products/mccain-aloo-tikki.jpg',
  'mccain-chilli-cheesy-nuggets': '/images/products/mccain-chilli-cheesy-nuggets.jpg',
  'mccain-chilli-garlic-bites': '/images/products/mccain-chilli-garlic-potato-bites.jpg',
  'mccain-chilli-garlic-potato-bites': '/images/products/mccain-chilli-garlic-potato-bites.jpg',
  'mccain-super-wedges': '/images/products/mccain-super-wedges.jpg',
  'mccain-masala-fries': '/images/products/mccain-masala-fries.jpg',
  'mccain-veggie-burger-patty': '/images/products/mccain-veggie-burger-patty.jpg',
  'mccain-veggie-fingers': '/images/products/mccain-veggie-fingers.jpg',
  'mccain-veggie-nuggets': '/images/products/mccain-veggie-nuggets.jpg',
  'mccain-crispy-onion-rings': '/images/products/mccain-onion-rings.jpg',
  'mccain-cheese-pizza-mini-samosa': '/images/products/mccain-cheese-pizza-style-filling-mini-samosa.jpg',
  'mccain-mini-samosa': '/images/products/mccain-cheese-corn-filling-mini-samosa.jpg',
  'mccain-crinkle-cut-fries': '/images/products/mccain-french-fries-pepper-crunch.jpg',
  'mccain-corn-peas-patty': '/images/products/mexican-hot-tangy.jpg',
  'mccain-herb-chilli-burger-patty': '/images/products/american-herb-garlic.jpg',
  'mccain-v-crispers': '/images/products/emotibites_korean-325-g-3d-front-1.jpg',
  'mccain-corn-tikka': '/images/products/mexican-hot-tangy.jpg',
  'mccain-veg-seekh-kebab': '/images/products/mccain-veggie-fingers.jpg',
}

async function main() {
  console.log('Connecting to Neon PostgreSQL database...')
  const products = await prisma.product.findMany()
  console.log(`Found ${products.length} products. Updating image URLs...`)

  let updated = 0
  for (const p of products) {
    if (IMAGE_MAPPING[p.slug]) {
      const newImg = IMAGE_MAPPING[p.slug]
      await prisma.product.update({
        where: { id: p.id },
        data: { imageUrl: newImg }
      })
      console.log(`✓ Updated '${p.name}' (${p.slug}) -> ${newImg}`)
      updated++
    }
  }

  console.log(`\n🎉 Successfully updated ${updated} products in Neon database!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
