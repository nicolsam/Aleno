import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockVerifyToken,
  mockFindUser,
  mockFindUserSchool,
  mockFindClass,
  mockUpdateClass,
  mockFindStudent,
  mockUpdateStudent,
  mockUpdateSchool,
  mockLogAction,
} = vi.hoisted(() => ({
  mockVerifyToken: vi.fn(),
  mockFindUser: vi.fn(),
  mockFindUserSchool: vi.fn(),
  mockFindClass: vi.fn(),
  mockUpdateClass: vi.fn(),
  mockFindStudent: vi.fn(),
  mockUpdateStudent: vi.fn(),
  mockUpdateSchool: vi.fn(),
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
    user: { findUnique: mockFindUser },
    userSchool: { findUnique: mockFindUserSchool },
    class: {
      findUnique: mockFindClass,
      update: mockUpdateClass,
    },
    student: {
      findUnique: mockFindStudent,
      update: mockUpdateStudent,
    },
    school: {
      update: mockUpdateSchool,
    },
  },
}))

import { PATCH as restoreClass } from '@/app/api/classes/[id]/restore/route'
import { PATCH as restoreSchool } from '@/app/api/schools/[id]/restore/route'
import { PATCH as restoreStudent } from '@/app/api/students/[id]/restore/route'

function createRequest(token = 'valid-token') {
  return new Request('http://localhost/api/restore', {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': '127.0.0.1',
    },
  })
}

function context(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('Restore APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockVerifyToken.mockReturnValue({ id: 'teacher-1', email: 'teacher@test.com' })
    mockFindUser.mockResolvedValue({
      id: 'teacher-1',
      email: 'teacher@test.com',
      isGlobalAdmin: false,
      schools: [{ schoolId: 'school-1', role: 'COORDINATOR' }],
    })
    mockFindUserSchool.mockResolvedValue({ userId: 'teacher-1', schoolId: 'school-1' })
    mockLogAction.mockResolvedValue(undefined)
  })

  it('restores a class when the teacher has school access', async () => {
    mockFindClass.mockResolvedValue({ id: 'class-1', schoolId: 'school-1' })
    mockUpdateClass.mockResolvedValue({ id: 'class-1', deletedAt: null })

    const response = await restoreClass(createRequest(), context('class-1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.class.id).toBe('class-1')
    expect(mockUpdateClass).toHaveBeenCalledWith({
      where: { id: 'class-1' },
      data: { deletedAt: null },
      include: { school: true },
    })
    expect(mockLogAction).toHaveBeenCalledWith('teacher-1', 'RESTORE_CLASS', { classId: 'class-1' }, '127.0.0.1')
  })

  it('rejects class restore when the class does not exist', async () => {
    mockFindClass.mockResolvedValue(null)

    const response = await restoreClass(createRequest(), context('missing-class'))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Not found')
    expect(mockUpdateClass).not.toHaveBeenCalled()
  })

  it('restores a student when the teacher has school access', async () => {
    mockFindStudent.mockResolvedValue({ id: 'student-1', schoolId: 'school-1' })
    mockUpdateStudent.mockResolvedValue({ id: 'student-1', deletedAt: null })

    const response = await restoreStudent(createRequest(), context('student-1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.student.id).toBe('student-1')
    expect(mockUpdateStudent).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: { deletedAt: null },
    })
    expect(mockLogAction).toHaveBeenCalledWith('teacher-1', 'RESTORE_STUDENT', { studentId: 'student-1' }, '127.0.0.1')
  })

  it('rejects student restore without teacher-school access', async () => {
    mockFindStudent.mockResolvedValue({ id: 'student-1', schoolId: 'school-1' })
    mockFindUser.mockResolvedValue({
      id: 'teacher-1',
      email: 'teacher@test.com',
      isGlobalAdmin: false,
      schools: [],
    })

    const response = await restoreStudent(createRequest(), context('student-1'))
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
    expect(mockUpdateStudent).not.toHaveBeenCalled()
  })

  it('restores a school when the user is a global admin', async () => {
    mockFindUser.mockResolvedValue({
      id: 'teacher-1',
      email: 'teacher@test.com',
      isGlobalAdmin: true,
      schools: [],
    })
    mockUpdateSchool.mockResolvedValue({ id: 'school-1', deletedAt: null })

    const response = await restoreSchool(createRequest(), context('school-1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.school.id).toBe('school-1')
    expect(mockUpdateSchool).toHaveBeenCalledWith({
      where: { id: 'school-1' },
      data: { deletedAt: null },
    })
    expect(mockLogAction).toHaveBeenCalledWith('teacher-1', 'RESTORE_SCHOOL', { schoolId: 'school-1' }, '127.0.0.1')
  })

  it('returns 401 for restore requests with invalid tokens', async () => {
    mockVerifyToken.mockReturnValue(null)

    const response = await restoreSchool(createRequest('bad-token'), context('school-1'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid token')
    expect(mockUpdateSchool).not.toHaveBeenCalled()
  })
})
