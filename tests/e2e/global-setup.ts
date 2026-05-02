import { prisma } from '../../src/lib/db'
import bcrypt from 'bcryptjs'

async function globalSetup() {
  const hashedPassword = await bcrypt.hash('playwright123', 10)

  // Seed Regular User
  await prisma.user.upsert({
    where: { email: 'test-regular@example.com' },
    update: {
      password: hashedPassword,
      isGlobalAdmin: false
    },
    create: {
      name: 'E2E Regular Teacher',
      email: 'test-regular@example.com',
      password: hashedPassword,
      isGlobalAdmin: false
    }
  })

  // Seed Admin User
  await prisma.user.upsert({
    where: { email: 'test-admin@example.com' },
    update: {
      password: hashedPassword,
      isGlobalAdmin: true
    },
    create: {
      name: 'E2E Admin Teacher',
      email: 'test-admin@example.com',
      password: hashedPassword,
      isGlobalAdmin: true
    }
  })

  console.log('✅ Global Setup: Seeded test users')
}

export default globalSetup
