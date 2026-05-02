import { vi } from 'vitest'
import { NextResponse } from 'next/server'

// Mock Prisma Client - functions only (not the actual Prisma)
export const mockTeacher = {
  findUnique: vi.fn(),
  create: vi.fn(),
}

export const mockSchool = {
  findMany: vi.fn(),
  create: vi.fn(),
}

export const mockUserSchool = {
  findMany: vi.fn(),
  create: vi.fn(),
}

export const mockStudent = {
  findMany: vi.fn(),
  create: vi.fn(),
}

export const mockReadingLevel = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
}

export const mockStudentReadingHistory = {
  create: vi.fn(),
  findMany: vi.fn(),
}

export const mockPrisma = {
  teacher: mockTeacher,
  school: mockSchool,
  userSchool: mockUserSchool,
  student: mockStudent,
  readingLevel: mockReadingLevel,
  studentReadingHistory: mockStudentReadingHistory,
}

// Reset all mocks
export function resetMocks() {
  const mocks = [mockTeacher, mockSchool, mockUserSchool, mockStudent, mockReadingLevel, mockStudentReadingHistory]
  mocks.forEach(model => {
    Object.keys(model).forEach((key: string) => {
      const fn = (model as any)[key]
      if (typeof fn.mockReset === 'function') {
        fn.mockReset()
        fn.mockResolvedValue(undefined)
      }
    })
  })
}

// Helper to create NextResponse for comparisons
export { NextResponse }

// Re-export commonly used vitest functions
export { expect, describe, it, beforeEach, vi } from 'vitest'