import { describe, expect, it, vi, beforeEach } from 'vitest'

const {
  mockVerifyToken,
  mockFindAuthUser,
  mockFindUsers,
  mockFindInvites,
  mockFindSchool,
  mockFindExistingInvite,
  mockCreateInvite,
  mockUpdateUser,
  mockLogAction,
} = vi.hoisted(() => ({
  mockVerifyToken: vi.fn(),
  mockFindAuthUser: vi.fn(),
  mockFindUsers: vi.fn(),
  mockFindInvites: vi.fn(),
  mockFindSchool: vi.fn(),
  mockFindExistingInvite: vi.fn(),
  mockCreateInvite: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockLogAction: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  verifyToken: mockVerifyToken,
}))

vi.mock('@/lib/audit', () => ({
  logAction: mockLogAction,
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: mockFindAuthUser,
      findMany: mockFindUsers,
      update: mockUpdateUser,
    },
    userInvite: {
      findMany: mockFindInvites,
      findFirst: mockFindExistingInvite,
      create: mockCreateInvite,
    },
    school: {
      findFirst: mockFindSchool,
    },
  },
}))

import { GET, POST } from '@/app/api/users/route'
import { PATCH } from '@/app/api/users/[id]/route'

function createRequest(path = '/api/users', body?: unknown) {
  return new Request(`https://aleno.test${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      authorization: 'Bearer valid-token',
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function mockCoordinatorAuth() {
  mockVerifyToken.mockReturnValue({ id: 'coordinator-1', email: 'coordinator@test.com' })
  mockFindAuthUser.mockResolvedValueOnce({
    id: 'coordinator-1',
    email: 'coordinator@test.com',
    name: 'Coordinator',
    isGlobalAdmin: false,
    schools: [{ schoolId: 'school-1', role: 'COORDINATOR' }],
  })
}

describe('API: /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockLogAction.mockResolvedValue(undefined)
  })

  it('returns pending invitation links when the stored token is available', async () => {
    mockCoordinatorAuth()
    mockFindUsers.mockResolvedValue([])
    mockFindInvites.mockResolvedValue([
      {
        id: 'invite-1',
        name: 'Teacher',
        email: 'teacher@test.com',
        role: 'TEACHER',
        schoolId: 'school-1',
        school: { id: 'school-1', name: 'School 1' },
        token: 'invite-token',
        expiresAt: new Date('2026-05-08T00:00:00.000Z'),
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
      },
    ])

    const response = await GET(createRequest('/api/users?schoolId=school-1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.invites[0].inviteLink).toBe('https://aleno.test/invite/invite-token')
  })

  it('stores the invite token so pending invitations can show their links later', async () => {
    mockCoordinatorAuth()
    mockFindSchool.mockResolvedValue({ id: 'school-1', name: 'School 1' })
    mockFindAuthUser.mockResolvedValueOnce(null)
    mockFindExistingInvite.mockResolvedValue(null)
    mockCreateInvite.mockImplementation(async ({ data }) => ({
      id: 'invite-1',
      name: data.name,
      email: data.email,
      role: data.role,
      schoolId: data.schoolId,
      school: { id: 'school-1', name: 'School 1' },
      expiresAt: data.expiresAt,
    }))

    const response = await POST(createRequest('/api/users', {
      name: 'Teacher',
      email: 'teacher@test.com',
      role: 'TEACHER',
      schoolId: 'school-1',
    }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.invite.inviteLink).toBe(data.inviteLink)
    expect(mockCreateInvite).toHaveBeenCalledWith({
      data: expect.objectContaining({
        token: expect.any(String),
        tokenHash: expect.any(String),
      }),
      include: { school: true },
    })
  })

  it('allows coordinators to update teacher name and email in their school', async () => {
    mockCoordinatorAuth()
    mockFindAuthUser.mockResolvedValueOnce({
      id: 'teacher-1',
      name: 'Old Teacher',
      email: 'old.teacher@test.com',
      isGlobalAdmin: false,
      schools: [{ schoolId: 'school-1', role: 'TEACHER' }],
    })
    mockUpdateUser.mockResolvedValue({
      id: 'teacher-1',
      name: 'Updated Teacher',
      email: 'updated.teacher@test.com',
      isGlobalAdmin: false,
      schools: [{
        schoolId: 'school-1',
        role: 'TEACHER',
        school: { id: 'school-1', name: 'School 1' },
      }],
    })

    const response = await PATCH(createRequest('/api/users/teacher-1', {
      name: 'Updated Teacher',
      email: 'updated.teacher@test.com',
    }), { params: Promise.resolve({ id: 'teacher-1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.name).toBe('Updated Teacher')
    expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'teacher-1' },
      data: { name: 'Updated Teacher', email: 'updated.teacher@test.com' },
    }))
    expect(mockLogAction).toHaveBeenCalledWith(
      'coordinator-1',
      'UPDATE_USER',
      { userId: 'teacher-1', email: 'updated.teacher@test.com' },
      '127.0.0.1'
    )
  })

  it('rejects teacher updates that reuse another account email', async () => {
    mockCoordinatorAuth()
    mockFindAuthUser
      .mockResolvedValueOnce({
        id: 'teacher-1',
        name: 'Old Teacher',
        email: 'old.teacher@test.com',
        isGlobalAdmin: false,
        schools: [{ schoolId: 'school-1', role: 'TEACHER' }],
      })
      .mockResolvedValueOnce({ id: 'teacher-2', email: 'used@test.com' })

    const response = await PATCH(createRequest('/api/users/teacher-1', {
      name: 'Updated Teacher',
      email: 'used@test.com',
    }), { params: Promise.resolve({ id: 'teacher-1' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email already exists')
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })
})
