const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Creating business_profiles table if missing...')
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS business_profiles (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      businessName TEXT NOT NULL,
      businessType TEXT NOT NULL,
      gstin TEXT,
      fssaiNumber TEXT,
      monthlyVolumeEst TEXT,
      businessAddress TEXT,
      verificationStatus TEXT NOT NULL DEFAULT 'PENDING',
      creditTier TEXT NOT NULL DEFAULT 'BRONZE',
      approvedBy TEXT,
      approvedAt DATETIME,
      documentUrl TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `)
  console.log('✅ Table business_profiles successfully created!')
}

main()
  .catch((e) => {
    console.error('Error creating table:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
