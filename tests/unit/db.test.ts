import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockAdapterConstructor,
  mockAdapterInstance,
  MockPrismaPg,
  MockPool,
  MockPrismaClient,
  mockPoolConstructor,
  mockPoolInstance,
  mockPrismaClientConstructor,
  mockPrismaClientInstance,
} = vi.hoisted(() => {
  const mockAdapterConstructor = vi.fn()
  const mockAdapterInstance = { adapter: 'prisma-pg-adapter' }
  const mockPoolConstructor = vi.fn()
  const mockPoolInstance = { pool: 'postgres-pool' }
  const mockPrismaClientConstructor = vi.fn()
  const mockPrismaClientInstance = { client: 'prisma-client' }

  class MockPool {
    constructor(options: unknown) {
      mockPoolConstructor(options)
      return mockPoolInstance
    }
  }

  class MockPrismaPg {
    constructor(pool: unknown) {
      mockAdapterConstructor(pool)
      return mockAdapterInstance
    }
  }

  class MockPrismaClient {
    constructor(options: unknown) {
      mockPrismaClientConstructor(options)
      return mockPrismaClientInstance
    }
  }

  return {
    mockAdapterConstructor,
    mockAdapterInstance,
    MockPrismaPg,
    MockPool,
    MockPrismaClient,
    mockPoolConstructor,
    mockPoolInstance,
    mockPrismaClientConstructor,
    mockPrismaClientInstance,
  }
})

vi.mock('pg', () => ({
  Pool: MockPool,
}))

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: MockPrismaPg,
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: MockPrismaClient,
}))

describe('database client wrapper', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    delete process.env.DATABASE_URL
    delete (globalThis as unknown as { prisma?: unknown }).prisma
  })

  it('creates Prisma Client with the PostgreSQL adapter and fallback connection string', async () => {
    const { prisma } = await import('@/lib/db')

    expect(mockPoolConstructor).toHaveBeenCalledWith({
      connectionString: 'postgresql://postgres:postgres@localhost:5432/aleno?schema=public',
    })
    expect(mockAdapterConstructor).toHaveBeenCalledWith(mockPoolInstance)
    expect(mockPrismaClientConstructor).toHaveBeenCalledWith({ adapter: mockAdapterInstance })
    expect(prisma).toBe(mockPrismaClientInstance)
    expect((globalThis as unknown as { prisma?: unknown }).prisma).toBe(mockPrismaClientInstance)
  })

  it('uses DATABASE_URL when it is configured', async () => {
    process.env.DATABASE_URL = 'postgresql://app:secret@localhost:5432/aleno_test?schema=public'

    await import('@/lib/db')

    expect(mockPoolConstructor).toHaveBeenCalledWith({
      connectionString: 'postgresql://app:secret@localhost:5432/aleno_test?schema=public',
    })
  })

  it('reuses the global Prisma Client instance in non-production environments', async () => {
    const existingClient = { client: 'existing-prisma-client' }
    ;(globalThis as unknown as { prisma?: unknown }).prisma = existingClient

    const { prisma } = await import('@/lib/db')

    expect(prisma).toBe(existingClient)
    expect(mockPrismaClientConstructor).not.toHaveBeenCalled()
  })
})
