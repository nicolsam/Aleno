import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockVerifyToken,
  mockUpdateTeacher,
  mockUpdateSessions,
} = vi.hoisted(() => ({
  mockVerifyToken: vi.fn(),
  mockUpdateTeacher: vi.fn(),
  mockUpdateSessions: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  verifyToken: mockVerifyToken,
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    teacher: { update: mockUpdateTeacher },
    userSession: { updateMany: mockUpdateSessions },
  },
}))

import { POST } from '@/app/api/auth/heartbeat/route'

function createRequest(token?: string) {
  return new Request('http://localhost/api/auth/heartbeat', {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  })
}

describe('API: /api/auth/heartbeat POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockVerifyToken.mockReturnValue({ id: 'teacher-1', email: 'teacher@test.com' })
    mockUpdateTeacher.mockResolvedValue({})
    mockUpdateSessions.mockResolvedValue({ count: 1 })
  })

  it('returns 401 when token is missing', async () => {
    const response = await POST(createRequest())
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 401 when token is invalid', async () => {
    mockVerifyToken.mockReturnValue(null)

    const response = await POST(createRequest('bad-token'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid token')
  })

  it('updates teacher and session activity timestamps', async () => {
    const response = await POST(createRequest('valid-token'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(mockUpdateTeacher).toHaveBeenCalledWith({
      where: { id: 'teacher-1' },
      data: { lastActiveAt: expect.any(Date) },
    })
    expect(mockUpdateSessions).toHaveBeenCalledWith({
      where: { token: 'valid-token', teacherId: 'teacher-1' },
      data: { lastActiveAt: expect.any(Date) },
    })
  })

  it('returns 500 when updating activity fails', async () => {
    mockUpdateTeacher.mockRejectedValue(new Error('DB failed'))

    const response = await POST(createRequest('valid-token'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal error')
  })
})
