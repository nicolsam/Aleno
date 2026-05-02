import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockFindTeacher,
  mockCreateSession,
  mockVerifyPassword,
  mockGenerateToken,
  mockLogAction,
} = vi.hoisted(() => ({
  mockFindTeacher: vi.fn(),
  mockCreateSession: vi.fn(),
  mockVerifyPassword: vi.fn(),
  mockGenerateToken: vi.fn(),
  mockLogAction: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: mockFindTeacher,
    },
    userSession: {
      create: mockCreateSession,
    },
  },
}))

vi.mock('@/lib/auth', () => ({
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
    mockVerifyPassword.mockResolvedValue(true)
    mockGenerateToken.mockReturnValue('jwt-token')
    mockCreateSession.mockResolvedValue({})
    mockLogAction.mockResolvedValue(undefined)
  })

  it('rejects public registration because accounts are invite-only', async () => {
    const response = await POST(createRequest({
      action: 'register',
      name: 'Teacher',
      email: 'teacher@test.com',
      password: 'secret',
    }))
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Registration is invite-only')
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('does not check duplicate emails through public registration', async () => {
    mockFindTeacher.mockResolvedValue({ id: 'existing-teacher' })

    const response = await POST(createRequest({
      action: 'register',
      name: 'Teacher',
      email: 'teacher@test.com',
      password: 'secret',
    }))
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Registration is invite-only')
    expect(mockFindTeacher).not.toHaveBeenCalled()
  })

  it('logs in a teacher with valid credentials', async () => {
    mockFindTeacher.mockResolvedValue({
      id: 'teacher-1',
      name: 'Teacher',
      email: 'teacher@test.com',
      password: 'hashed-password',
      gender: 'FEMALE',
      isGlobalAdmin: false,
      schools: [{ schoolId: 'school-1', role: 'TEACHER', school: { name: 'School 1' } }],
    })

    const response = await POST(createRequest({
      action: 'login',
      email: 'teacher@test.com',
      password: 'secret',
    }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.token).toBe('jwt-token')
    expect(data.teacher.isGlobalAdmin).toBe(false)
    expect(data.user.gender).toBe('FEMALE')
    expect(data.user.schools).toEqual([{ schoolId: 'school-1', schoolName: 'School 1', role: 'TEACHER' }])
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
