// Official high-resolution McCain India product packaging, food visuals, nutrition facts, and gallery slides

export interface GallerySlide {
  id: number
  type: 'image' | 'infographic' | 'cooking' | 'nutrition'
  url: string
  title: string
  label: string
  badge?: string
  alt?: string
}

export interface ProductMediaData {
  slug: string
  packetImage: string
  packetTitle: string
  packetSubtitle: string
  packetTag: string
  foodImage: string
  tableImage: string
  gallerySlides: GallerySlide[]
  ingredients: string
  nutrition: {
    calories: number // kcal per 100g
    protein: number // g
    carbs: number // g
    sugar: number // g
    fat: number // g
    transFat: number // g
    sodium: number // mg
  }
  cooking: {
    deepFry: string
    airFry: string
    bake: string
  }
}

export const OFFICIAL_PACKET_IMAGES: Record<string, string> = {
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
  'mccain-onion-rings': '/images/products/mccain-onion-rings.jpg',
  'mccain-cheese-pizza-mini-samosa': '/images/products/mccain-cheese-pizza-style-filling-mini-samosa.jpg',
  'mccain-mini-samosa': '/images/products/mccain-cheese-corn-filling-mini-samosa.jpg',
  'mccain-crinkle-cut-fries': '/images/products/mccain-french-fries-pepper-crunch.jpg',
  'mccain-corn-peas-patty': '/images/products/mexican-hot-tangy.jpg',
  'mccain-herb-chilli-burger-patty': '/images/products/american-herb-garlic.jpg',
  'mccain-cheesy-pizza-fingers': '/images/products/mccain-cheesy-pizza-fingers.jpg',
  'mccain-popcorn-fries': '/images/products/mccain-popcorn-fries.jpg',
  'mccain-v-crispers': '/images/products/emotibites_korean-325-g-3d-front-1.jpg',
  'mccain-korean-emotibites': '/images/products/emotibites_korean-325-g-3d-front-1.jpg',
  'mccain-variety-pack': '/images/products/mccain-variety-pack.jpg',
  'mccain-veg-seekh-kebab': '/images/products/mccain-veggie-fingers.jpg',
  'mccain-corn-tikka': '/images/products/mexican-hot-tangy.jpg',
  // Seafood & Fish Catalog
  'silver-pomfret': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1793013417/anmol-enterprises/products/bf300c2f8435a7001f742e74014a3aea-1793013415709.png',
  'mahi-mahi-fish': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1793013769/anmol-enterprises/products/frozen-mahi-mahi-fish-fillet-500x500-1793013768728.webp',
  'basa-fish-fillet-1-kg': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1792683797/anmol-enterprises/products/BASA_FISH_FILLET_1_kg-1792683795776.webp',
  'breaded-fish': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1793013159/anmol-enterprises/products/40270238_1-ifb-fresh-catch-breaded-fish-fillets-cr-1793013157747.webp',
  'fish-finger': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1793096568/anmol-enterprises/products/gadrebrdfshfin1kg-jpg-1793096567856.webp',
  'king-fish-surmai': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1793078485/anmol-enterprises/products/images__4_-1793078484370.jpg',
  'tilapia': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1793013902/anmol-enterprises/products/48190179c0edf5695d880b14140e43e5-1793013900973.png',
  'prawns-8-12': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1792909359/anmol-enterprises/products/61cuiDytvtL-1792909358663.jpg',
  'prawns-21-25': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1792691481/anmol-enterprises/products/product-jpeg-500x500__1_-1792691480579.webp',
  'prawns-21-25-990': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1792910153/anmol-enterprises/products/61fzuZWShFL__AC_UF894_1000_QL80_-1792910152387.jpg',
  // Chicken & Poultry Catalog
  'venkey-s-brest-boneless': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1793014055/anmol-enterprises/products/Chicken-boneless-online-delivery-in-meerut-1793014054575.webp',
  'leg-boneless': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1793014299/anmol-enterprises/products/Chicken-Leg-Boneless-1-1793014298007.webp',
  'venkys-chicken-wings': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1792683714/anmol-enterprises/products/Venky-s-Spicy-And-Crispy-Chicken-Wings-Combo-1792683713344.jpg',
  'chicken-drumstick': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1793014807/anmol-enterprises/products/images__3_-1793014805999.jpg',
  'crispy-chicken-burger-patt': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1793096756/anmol-enterprises/products/40351042_1-venkys-crispy-chicken-burger-patty-1793096756022.webp',
  'chicken-nugget': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1793097086/anmol-enterprises/products/images__6_-1793097084866.jpg',
  'breakfast-sausages': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1793097733/anmol-enterprises/products/51lkEUuJCkL__AC_UF894_1000_QL80_-1793097732132.jpg',
  // Veg & Dairy Catalog
  'green-pease': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1792692540/anmol-enterprises/products/images-1792692539914.jpg',
  'sweetcorn': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1792908250/anmol-enterprises/products/images__2_-1792908249038.jpg',
  'paneer-patty': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1793100438/anmol-enterprises/products/21f066870fcbced03cd032476cb2c947-1793100436646.png',
  'spiced-paneer-patty': 'https://res.cloudinary.com/mxqmbzkh/image/upload/v1793099603/anmol-enterprises/products/1677d5e1ed334837c0d0166c12b5b4a6-1793099602309.png',
}

export const PRODUCT_MEDIA: Record<string, ProductMediaData> = {
  'mccain-smiles': {
    slug: 'mccain-smiles',
    packetImage: '/images/products/mccain-smiles.jpg',
    packetTitle: 'McCain',
    packetSubtitle: 'CRISPY SMILES',
    packetTag: 'FUN MASHED POTATO HAPPY FACES',
    foodImage: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800&auto=format&fit=crop',
    tableImage: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?q=80&w=800&auto=format&fit=crop',
    gallerySlides: [
      { id: 0, type: 'image', url: '/images/products/mccain-smiles.jpg', title: 'Official Packet Front', label: 'Pack' },
      { id: 1, type: 'image', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?q=80&w=800&auto=format&fit=crop', title: 'Happy Kids Meal Time', label: 'Family' },
      { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800&auto=format&fit=crop', title: 'Golden Crispy Smiles on Plate', label: 'Serving' },
      { id: 3, type: 'image', url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=800&auto=format&fit=crop', title: 'Crispy Snack Platter', label: 'Platter' },
      { id: 4, type: 'image', url: '/images/products/mccain-variety-pack.jpg', title: 'McCain Party Pack Combo', label: 'Party' },
      { id: 5, type: 'image', url: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=800&auto=format&fit=crop', title: 'Ready in 3 Mins Air Fryer', label: 'Air Fryer' },
    ],
    ingredients: 'Potato Flakes (70%), Refined Vegetable Oil, Potato Starch, Rice Flour, Iodised Salt.',
    nutrition: { calories: 182, protein: 3.1, carbs: 27.5, sugar: 0.8, fat: 6.8, transFat: 0, sodium: 220 },
    cooking: {
      deepFry: 'Preheat oil to 175°C. Deep fry smiles directly from freezer for 3 minutes until golden.',
      airFry: 'Preheat air fryer to 200°C. Cook for 8-10 minutes until hot and crunchy.',
      bake: 'Bake in preheated oven at 220°C for 12-14 minutes.'
    }
  },
  'mccain-french-fries': {
    slug: 'mccain-french-fries',
    packetImage: '/images/products/mccain-french-fries-420g.jpg',
    packetTitle: 'McCain',
    packetSubtitle: 'FRENCH FRIES',
    packetTag: 'STRAIGHT CUT CRISPY FRIES',
    foodImage: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800&auto=format&fit=crop',
    tableImage: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?q=80&w=800&auto=format&fit=crop',
    gallerySlides: [
      { id: 0, type: 'image', url: '/images/products/mccain-french-fries-420g.jpg', title: 'Official Packet Front', label: 'Pack' },
      { id: 1, type: 'image', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800&auto=format&fit=crop', title: 'Golden Straight-Cut French Fries', label: 'Dish' },
      { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?q=80&w=800&auto=format&fit=crop', title: 'Fries in Wire Basket with Dip', label: 'Serving' },
      { id: 3, type: 'image', url: '/images/products/mccain-french-fries-pepper-crunch.jpg', title: 'Pepper Crunch Variant', label: 'Pepper' },
    ],
    ingredients: 'Potatoes (92%), Refined Palmolein Oil, Salt, Dextrose.',
    nutrition: { calories: 154, protein: 2.6, carbs: 24.8, sugar: 0.5, fat: 5.0, transFat: 0, sodium: 180 },
    cooking: {
      deepFry: 'Heat edible oil to 175°C. Deep fry frozen French Fries for 3 minutes until crispy and golden.',
      airFry: 'Preheat air fryer to 200°C. Air fry for 10-12 minutes, shaking basket at 6 minutes.',
      bake: 'Preheat oven to 220°C. Spread evenly on a baking tray and bake for 12-15 minutes.'
    }
  },
  'mccain-potato-cheese-shotz': {
    slug: 'mccain-potato-cheese-shotz',
    packetImage: '/images/products/mccain-potato-cheese-shotz.jpg',
    packetTitle: 'McCain',
    packetSubtitle: 'POTATO CHEESE SHOTZ',
    packetTag: 'MOLTEN CHEESE CENTER BITES',
    foodImage: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=800&auto=format&fit=crop',
    tableImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
    gallerySlides: [
      { id: 0, type: 'image', url: '/images/products/mccain-potato-cheese-shotz.jpg', title: 'Official Packet Front', label: 'Pack' },
      { id: 1, type: 'image', url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=800&auto=format&fit=crop', title: 'Molten Cheese Center Shotz', label: 'Cheese' },
      { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop', title: 'Party Appetizer Platter', label: 'Party' },
    ],
    ingredients: 'Potatoes (54%), Processed Cheese (22%), Breadcrumbs, Batter, Spices & Condiments, Salt.',
    nutrition: { calories: 235, protein: 6.4, carbs: 26.2, sugar: 1.2, fat: 11.5, transFat: 0, sodium: 340 },
    cooking: {
      deepFry: 'Deep fry in hot oil at 175°C for 3 minutes until golden brown. Serve hot with dip.',
      airFry: 'Air fry at 190°C for 8-10 minutes until cheese starts melting inside.',
      bake: 'Bake at 200°C for 10-12 minutes on parchment paper.'
    }
  },
  'mccain-aloo-tikki': {
    slug: 'mccain-aloo-tikki',
    packetImage: '/images/products/mccain-aloo-tikki.jpg',
    packetTitle: 'McCain',
    packetSubtitle: 'ALOO TIKKI',
    packetTag: 'TRADITIONAL SPICED POTATO PATTIES',
    foodImage: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800&auto=format&fit=crop',
    tableImage: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop',
    gallerySlides: [
      { id: 0, type: 'image', url: '/images/products/mccain-aloo-tikki.jpg', title: 'Official Packet Front', label: 'Pack' },
      { id: 1, type: 'image', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800&auto=format&fit=crop', title: 'Spiced Aloo Tikki on Tawa', label: 'Chaat' },
      { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop', title: 'Chaat Platter Serving', label: 'Serving' },
    ],
    ingredients: 'Potatoes (78%), Vegetable Oil, Dehydrated Potato, Green Chilli, Ginger, Coriander, Spices.',
    nutrition: { calories: 172, protein: 3.2, carbs: 25.4, sugar: 0.6, fat: 6.5, transFat: 0, sodium: 290 },
    cooking: {
      deepFry: 'Deep fry or shallow fry on tawa with oil for 3 minutes on each side until crisp.',
      airFry: 'Brush with oil and air fry at 200°C for 10 minutes.',
      bake: 'Bake at 220°C for 15 minutes turning once.'
    }
  },
  'mccain-veggie-burger-patty': {
    slug: 'mccain-veggie-burger-patty',
    packetImage: '/images/products/mccain-veggie-burger-patty.jpg',
    packetTitle: 'McCain',
    packetSubtitle: 'VEGGIE BURGER PATTY',
    packetTag: 'CRISPY VEG PATTY WITH HERBS',
    foodImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
    tableImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop',
    gallerySlides: [
      { id: 0, type: 'image', url: '/images/products/mccain-veggie-burger-patty.jpg', title: 'Official Packet Front', label: 'Pack' },
      { id: 1, type: 'image', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop', title: 'Delicious Veggie Burger in Hand', label: 'Burger' },
      { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop', title: 'Crispy Veggie Patties Plate', label: 'Patties' },
      { id: 3, type: 'image', url: '/images/products/american-herb-garlic.jpg', title: 'American Herb & Garlic', label: 'Herb' },
    ],
    ingredients: 'Vegetables (60% - Green Peas, Carrots, Sweet Corn), Potatoes, Breadcrumbs, Spices.',
    nutrition: { calories: 198, protein: 4.5, carbs: 27.0, sugar: 2.1, fat: 8.0, transFat: 0, sodium: 300 },
    cooking: {
      deepFry: 'Deep fry or shallow fry on pan for 3 minutes until crisp and golden.',
      airFry: 'Air fry at 190°C for 10-12 minutes.',
      bake: 'Bake at 210°C for 12-15 minutes.'
    }
  }
}

export function normalizeImageUrl(url: string): string {
  if (!url) return '/images/products/mccain-french-fries-420g.jpg'
  
  // Extract Google Drive ID if present and convert to direct image thumbnail
  const gDriveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (gDriveMatch && gDriveMatch[1]) {
    const fileId = gDriveMatch[1]
    return `https://lh3.googleusercontent.com/d/${fileId}`
  }

  return url
}

export function getProductPacketImage(slug: string, rawImageUrl?: string): string {
  if (rawImageUrl && rawImageUrl.trim().length > 0) {
    const isFriesFallback = rawImageUrl.includes('mccain-french-fries-420g.jpg')
    const isActuallyFries = slug && (slug.includes('fries') || slug.includes('french-fries'))
    if (!isFriesFallback || isActuallyFries) {
      return normalizeImageUrl(rawImageUrl)
    }
  }
  if (slug && OFFICIAL_PACKET_IMAGES[slug]) {
    return OFFICIAL_PACKET_IMAGES[slug]
  }
  return '/images/products/mccain-french-fries-420g.jpg'
}

export function getProductGallerySlides(product: any): GallerySlide[] {
  // If product has custom galleryImages uploaded in DB
  if (product.galleryImages && Array.isArray(product.galleryImages) && product.galleryImages.length > 0) {
    return product.galleryImages.map((rawUrl: string, idx: number) => {
      const url = normalizeImageUrl(rawUrl)
      return {
        id: idx,
        type: 'image',
        url,
        title: `${product.name} - Image ${idx + 1}`,
        label: idx === 0 ? 'Pack' : `Photo ${idx + 1}`
      }
    })
  }

  // If defined in PRODUCT_MEDIA suite
  const media = PRODUCT_MEDIA[product.slug]
  if (media && media.gallerySlides && media.gallerySlides.length > 0) {
    return media.gallerySlides.map((slide) => ({
      ...slide,
      url: normalizeImageUrl(slide.url)
    }))
  }

  // Default fallback slide suite
  const packetImg = getProductPacketImage(product.slug, product.imageUrl)
  return [
    { id: 0, type: 'image', url: packetImg, title: 'Official Packaging Front', label: 'Pack' },
    { id: 1, type: 'image', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800&auto=format&fit=crop', title: 'Golden Cooked Serving', label: 'Dish' },
    { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?q=80&w=800&auto=format&fit=crop', title: 'Party Dining Presentation', label: 'Serving' },
  ]
}

export function getProductMedia(slug: string, rawImageUrl?: string): ProductMediaData {
  const media = PRODUCT_MEDIA[slug]
  if (media) return media

  const packetImg = getProductPacketImage(slug, rawImageUrl)
  return {
    slug,
    packetImage: packetImg,
    packetTitle: 'McCain',
    packetSubtitle: 'FROZEN FOOD',
    packetTag: 'READY IN 3 MINUTES',
    foodImage: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800&auto=format&fit=crop',
    tableImage: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?q=80&w=800&auto=format&fit=crop',
    gallerySlides: [
      { id: 0, type: 'image', url: packetImg, title: 'Official Packaging Front', label: 'Pack' },
      { id: 1, type: 'image', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800&auto=format&fit=crop', title: 'Golden Cooked Serving', label: 'Dish' },
      { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?q=80&w=800&auto=format&fit=crop', title: 'Party Dining Presentation', label: 'Serving' },
    ],
    ingredients: 'Potatoes (90%), Refined Vegetable Oil, Salt, Seasoning.',
    nutrition: { calories: 160, protein: 2.8, carbs: 25.0, sugar: 0.8, fat: 5.5, transFat: 0, sodium: 220 },
    cooking: {
      deepFry: 'Deep fry frozen item for 3 minutes in oil at 175°C until golden.',
      airFry: 'Air fry at 200°C for 10-12 minutes.',
      bake: 'Bake in preheated oven at 220°C for 14 minutes.'
    }
  }
}
