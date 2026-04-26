import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFindUnique, mockVerifyToken } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockVerifyToken: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    teacher: { findUnique: mockFindUnique },
  },
}))

vi.mock('@/lib/auth', () => ({
  verifyToken: mockVerifyToken,
}))

import { verifyAdmin } from '../src/lib/admin'
import { NextResponse } from 'next/server'

describe('Admin Library: verifyAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return error if no token is provided', async () => {
    const request = new Request('http://localhost')
    const result = await verifyAdmin(request)
    
    expect(result.error).toBeDefined()
    expect(result.error).toBeInstanceOf(NextResponse)
    expect(result.error?.status).toBe(401)
  })

  it('should return error if token is invalid', async () => {
    mockVerifyToken.mockReturnValue(null)

    const request = new Request('http://localhost', {
      headers: { authorization: 'Bearer bad-token' }
    })
    const result = await verifyAdmin(request)
    
    expect(result.error).toBeDefined()
    expect(result.error?.status).toBe(401)
  })

  it('should return 403 Forbidden if teacher is not found', async () => {
    mockVerifyToken.mockReturnValue({ id: 'teacher-1' })
    mockFindUnique.mockResolvedValue(null)

    const request = new Request('http://localhost', {
      headers: { authorization: 'Bearer valid-token' }
    })
    const result = await verifyAdmin(request)
    
    expect(result.error).toBeDefined()
    expect(result.error?.status).toBe(403)
  })

  it('should return 403 Forbidden if teacher is not a global admin', async () => {
    mockVerifyToken.mockReturnValue({ id: 'teacher-1' })
    mockFindUnique.mockResolvedValue({ id: 'teacher-1', isGlobalAdmin: false })

    const request = new Request('http://localhost', {
      headers: { authorization: 'Bearer valid-token' }
    })
    const result = await verifyAdmin(request)
    
    expect(result.error).toBeDefined()
    expect(result.error?.status).toBe(403)
  })

  it('should return payload and teacher if token is valid and teacher is admin', async () => {
    const mockPayload = { id: 'teacher-1', email: 'admin@test.com' }
    const mockTeacher = { id: 'teacher-1', isGlobalAdmin: true }
    
    mockVerifyToken.mockReturnValue(mockPayload)
    mockFindUnique.mockResolvedValue(mockTeacher)

    const request = new Request('http://localhost', {
      headers: { authorization: 'Bearer valid-token' }
    })
    const result = await verifyAdmin(request)
    
    expect(result.error).toBeUndefined()
    expect(result.payload).toEqual(mockPayload)
    expect(result.teacher).toEqual(mockTeacher)
  })
})
