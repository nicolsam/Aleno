import { prisma } from '../../src/lib/db'

async function globalTeardown() {
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['test-regular@example.com', 'test-admin@example.com']
      }
    }
  })

  console.log('🧹 Global Teardown: Cleaned up test users')
}

export default globalTeardown
