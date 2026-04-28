import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockVerifyToken,
  mockFindTeacher,
  mockFindTeacherSchools,
  mockCreateTeacherSchool,
  mockCreateSchool,
  mockLogAction,
} = vi.hoisted(() => ({
  mockVerifyToken: vi.fn(),
  mockFindTeacher: vi.fn(),
  mockFindTeacherSchools: vi.fn(),
  mockCreateTeacherSchool: vi.fn(),
  mockCreateSchool: vi.fn(),
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
    teacher: { findUnique: mockFindTeacher },
    teacherSchool: {
      findMany: mockFindTeacherSchools,
      create: mockCreateTeacherSchool,
    },
    school: { create: mockCreateSchool },
  },
}))

import { GET, POST } from '@/app/api/schools/route'

function createRequest(body?: unknown, token = 'valid-token') {
  return new Request('http://localhost/api/schools', {
    method: body ? 'POST' : 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('API: /api/schools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockVerifyToken.mockReturnValue({ id: 'teacher-1', email: 'teacher@test.com' })
    mockFindTeacher.mockResolvedValue({ id: 'teacher-1' })
    mockLogAction.mockResolvedValue(undefined)
  })

  it('GET returns schools assigned to the current teacher', async () => {
    const schools = [
      { id: 'school-1', name: 'School 1' },
      { id: 'school-2', name: 'School 2' },
    ]
    mockFindTeacherSchools.mockResolvedValue(schools.map((school) => ({ school })))

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.schools).toEqual(schools)
    expect(mockFindTeacherSchools).toHaveBeenCalledWith({
      where: { teacherId: 'teacher-1', school: { deletedAt: null } },
      include: { school: true },
    })
  })

  it('GET rejects missing tokens', async () => {
    const response = await GET(new Request('http://localhost/api/schools'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('POST creates a school and links it to the teacher', async () => {
    mockCreateSchool.mockResolvedValue({ id: 'school-1', name: 'New School', address: 'Main St' })
    mockCreateTeacherSchool.mockResolvedValue({})

    const response = await POST(createRequest({ name: 'New School', address: 'Main St' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.school.id).toBe('school-1')
    expect(mockCreateSchool).toHaveBeenCalledWith({
      data: { name: 'New School', address: 'Main St' },
    })
    expect(mockCreateTeacherSchool).toHaveBeenCalledWith({
      data: { teacherId: 'teacher-1', schoolId: 'school-1', role: 'admin' },
    })
    expect(mockLogAction).toHaveBeenCalledWith(
      'teacher-1',
      'CREATE_SCHOOL',
      { schoolId: 'school-1', name: 'New School' },
      '127.0.0.1'
    )
  })

  it('POST rejects missing school names', async () => {
    const response = await POST(createRequest({ address: 'Main St' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('School name required')
    expect(mockCreateSchool).not.toHaveBeenCalled()
  })

  it('POST returns 401 when the token teacher no longer exists', async () => {
    mockFindTeacher.mockResolvedValue(null)

    const response = await POST(createRequest({ name: 'New School' }))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('User not found')
  })
})
