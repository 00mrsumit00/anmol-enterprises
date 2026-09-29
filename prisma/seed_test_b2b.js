const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding sample B2B Accounts...')

  const testPassword = process.env.SEED_TEST_PASSWORD || 'L@tur123'
  const passwordHash = await bcrypt.hash(testPassword, 10)

  // 1. Requested B2B Account: 8485879557
  const user1 = await prisma.user.upsert({
    where: { phone: '8485879557' },
    update: {
      name: 'Sumit Shinde (AME Caffee)',
      isB2B: true,
      businessName: 'AME Caffee & Bakery',
      creditLimit: 75000,
      creditUsed: 12500,
      passwordHash,
      role: 'CUSTOMER'
    },
    create: {
      name: 'Sumit Shinde (AME Caffee)',
      phone: '8485879557',
      passwordHash,
      role: 'CUSTOMER',
      isB2B: true,
      businessName: 'AME Caffee & Bakery',
      creditLimit: 75000,
      creditUsed: 12500,
    }
  })

  await prisma.businessProfile.upsert({
    where: { userId: user1.id },
    update: {
      businessName: 'AME Caffee & Bakery',
      businessType: 'CAFE',
      gstin: '27AAAAA8888A1Z5',
      fssaiNumber: '11521034000189',
      monthlyVolumeEst: '200-500kg',
      businessAddress: 'Bhagya Nagar, Nanded / Latur Road',
      verificationStatus: 'VERIFIED',
      creditTier: 'GOLD',
      approvedAt: new Date()
    },
    create: {
      userId: user1.id,
      businessName: 'AME Caffee & Bakery',
      businessType: 'CAFE',
      gstin: '27AAAAA8888A1Z5',
      fssaiNumber: '11521034000189',
      monthlyVolumeEst: '200-500kg',
      businessAddress: 'Bhagya Nagar, Nanded / Latur Road',
      verificationStatus: 'VERIFIED',
      creditTier: 'GOLD',
      approvedAt: new Date()
    }
  })

  // 2. Sample Hotel Account: 9876543210 (Also Admin if first user or regular admin)
  const user2 = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {
      name: 'Anmol Admin & Grand Hotel',
      isB2B: true,
      businessName: 'Grand Hotel & Resort Latur',
      creditLimit: 150000,
      creditUsed: 35000,
      passwordHash,
      role: 'ADMIN'
    },
    create: {
      name: 'Anmol Admin & Grand Hotel',
      phone: '9876543210',
      passwordHash,
      role: 'ADMIN',
      isB2B: true,
      businessName: 'Grand Hotel & Resort Latur',
      creditLimit: 150000,
      creditUsed: 35000,
    }
  })

  await prisma.businessProfile.upsert({
    where: { userId: user2.id },
    update: {
      businessName: 'Grand Hotel & Resort Latur',
      businessType: 'HOTEL',
      gstin: '27GHIJK1234F1Z8',
      fssaiNumber: '11521034000999',
      monthlyVolumeEst: '500kg+',
      businessAddress: 'Main Ring Road, Near Bus Stand, Latur',
      verificationStatus: 'VERIFIED',
      creditTier: 'GOLD',
      approvedAt: new Date()
    },
    create: {
      userId: user2.id,
      businessName: 'Grand Hotel & Resort Latur',
      businessType: 'HOTEL',
      gstin: '27GHIJK1234F1Z8',
      fssaiNumber: '11521034000999',
      monthlyVolumeEst: '500kg+',
      businessAddress: 'Main Ring Road, Near Bus Stand, Latur',
      verificationStatus: 'VERIFIED',
      creditTier: 'GOLD',
      approvedAt: new Date()
    }
  })

  // 3. Sample Pending B2B Account: 9988776655
  const user3 = await prisma.user.upsert({
    where: { phone: '9988776655' },
    update: {
      name: 'Rahul Deshmukh (Shivaji Caterers)',
      isB2B: true,
      businessName: 'Shivaji Events & Caterers',
      creditLimit: 5000,
      creditUsed: 0,
      passwordHash,
      role: 'CUSTOMER'
    },
    create: {
      name: 'Rahul Deshmukh (Shivaji Caterers)',
      phone: '9988776655',
      passwordHash,
      role: 'CUSTOMER',
      isB2B: true,
      businessName: 'Shivaji Events & Caterers',
      creditLimit: 5000,
      creditUsed: 0,
    }
  })

  await prisma.businessProfile.upsert({
    where: { userId: user3.id },
    update: {
      businessName: 'Shivaji Events & Caterers',
      businessType: 'CATERER',
      gstin: '27BBBBB9999B1Z2',
      fssaiNumber: '11522034000555',
      monthlyVolumeEst: '50-200kg',
      businessAddress: 'Ganj Golai Market, Latur',
      verificationStatus: 'PENDING',
      creditTier: 'BRONZE',
    },
    create: {
      userId: user3.id,
      businessName: 'Shivaji Events & Caterers',
      businessType: 'CATERER',
      gstin: '27BBBBB9999B1Z2',
      fssaiNumber: '11522034000555',
      monthlyVolumeEst: '50-200kg',
      businessAddress: 'Ganj Golai Market, Latur',
      verificationStatus: 'PENDING',
      creditTier: 'BRONZE',
    }
  })

  console.log('✅ B2B Accounts seeded successfully!')
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect())
