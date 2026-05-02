import { vi } from 'vitest'

// Mock Prisma Client
export const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  school: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  userSchool: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  student: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  readingLevel: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  studentReadingHistory: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
}

// Mock the db module
vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

// Mock auth module
vi.mock('@/lib/auth', () => ({
  hashPassword: vi.fn().mockImplementation((password: string) => Promise.resolve(`hashed_${password}`)),
  verifyPassword: vi.fn().mockImplementation((password: string, hash: string) => Promise.resolve(password === 'test123' || hash.startsWith('hashed_'))),
  generateToken: vi.fn().mockImplementation(() => 'mock.jwt.token'),
  verifyToken: vi.fn().mockImplementation((token: string) => {
    if (token === 'mock.jwt.token') {
      return { id: 'teacher-1', email: 'test@test.com' }
    }
    if (token === 'valid-token') {
      return { id: 'teacher-1', email: 'test@test.com' }
    }
    return null
  }),
}))

export default mockPrisma
