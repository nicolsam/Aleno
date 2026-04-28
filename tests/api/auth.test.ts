import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockFindTeacher,
  mockCreateTeacher,
  mockCreateSession,
  mockHashPassword,
  mockVerifyPassword,
  mockGenerateToken,
  mockLogAction,
} = vi.hoisted(() => ({
  mockFindTeacher: vi.fn(),
  mockCreateTeacher: vi.fn(),
  mockCreateSession: vi.fn(),
  mockHashPassword: vi.fn(),
  mockVerifyPassword: vi.fn(),
  mockGenerateToken: vi.fn(),
  mockLogAction: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    teacher: {
      findUnique: mockFindTeacher,
      create: mockCreateTeacher,
    },
    userSession: {
      create: mockCreateSession,
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  hashPassword: mockHashPassword,
  verifyPassword: mockVerifyPassword,
  generateToken: mockGenerateToken,
}))

vi.mock('@/lib/audit', () => ({
  logAction: mockLogAction,
}))

import { POST } from '@/app/api/auth/route'

function createRequest(body: unknown) {
  return new Request('http://localhost/api/auth', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'vitest',
    },
    body: JSON.stringify(body),
  })
}

describe('API: /api/auth POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockHashPassword.mockResolvedValue('hashed-password')
    mockVerifyPassword.mockResolvedValue(true)
    mockGenerateToken.mockReturnValue('jwt-token')
    mockCreateSession.mockResolvedValue({})
    mockLogAction.mockResolvedValue(undefined)
  })

  it('registers a new teacher and creates a session', async () => {
    mockFindTeacher.mockResolvedValue(null)
    mockCreateTeacher.mockResolvedValue({
      id: 'teacher-1',
      name: 'Teacher',
      email: 'teacher@test.com',
      isGlobalAdmin: false,
    })

    const response = await POST(createRequest({
      action: 'register',
      name: 'Teacher',
      email: 'teacher@test.com',
      password: 'secret',
    }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.token).toBe('jwt-token')
    expect(data.teacher).toEqual({
      id: 'teacher-1',
      name: 'Teacher',
      email: 'teacher@test.com',
      isGlobalAdmin: false,
    })
    expect(mockHashPassword).toHaveBeenCalledWith('secret')
    expect(mockCreateSession).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        teacherId: 'teacher-1',
        token: 'jwt-token',
        ipAddress: '127.0.0.1',
        userAgent: 'vitest',
        expiresAt: expect.any(Date),
      }),
    }))
    expect(mockLogAction).toHaveBeenCalledWith('teacher-1', 'REGISTER', { email: 'teacher@test.com' }, '127.0.0.1')
  })

  it('rejects duplicate registration email', async () => {
    mockFindTeacher.mockResolvedValue({ id: 'existing-teacher' })

    const response = await POST(createRequest({
      action: 'register',
      name: 'Teacher',
      email: 'teacher@test.com',
      password: 'secret',
    }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email already exists')
    expect(mockCreateTeacher).not.toHaveBeenCalled()
  })

  it('logs in a teacher with valid credentials', async () => {
    mockFindTeacher.mockResolvedValue({
      id: 'teacher-1',
      name: 'Teacher',
      email: 'teacher@test.com',
      password: 'hashed-password',
      isGlobalAdmin: true,
    })

    const response = await POST(createRequest({
      action: 'login',
      email: 'teacher@test.com',
      password: 'secret',
    }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.token).toBe('jwt-token')
    expect(data.teacher.isGlobalAdmin).toBe(true)
    expect(mockVerifyPassword).toHaveBeenCalledWith('secret', 'hashed-password')
    expect(mockLogAction).toHaveBeenCalledWith('teacher-1', 'LOGIN', { email: 'teacher@test.com' }, '127.0.0.1')
  })

  it('rejects invalid login credentials', async () => {
    mockFindTeacher.mockResolvedValue({
      id: 'teacher-1',
      email: 'teacher@test.com',
      password: 'hashed-password',
    })
    mockVerifyPassword.mockResolvedValue(false)

    const response = await POST(createRequest({
      action: 'login',
      email: 'teacher@test.com',
      password: 'wrong',
    }))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid credentials')
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('rejects invalid actions', async () => {
    const response = await POST(createRequest({ action: 'logout' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid action')
  })
})
