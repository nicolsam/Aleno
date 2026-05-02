import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PUT, DELETE } from '@/app/api/students/[id]/route'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    userSchool: { findUnique: vi.fn() },
    student: { findUnique: vi.fn(), update: vi.fn() },
    studentEnrollment: { updateMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    class: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() }
  }
}))

vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn()
}))

vi.mock('@/lib/audit', () => ({
  logAction: vi.fn()
}))

describe('Students API PUT & DELETE', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockRequest = (body?: unknown) => ({
    headers: new Headers({ authorization: 'Bearer valid-token' }),
    json: async () => body
  } as unknown as Request)

  const mockAccess = () => {
    vi.mocked(verifyToken).mockReturnValue({ id: 'teacher-1', email: 'test@example.com' })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'teacher-1',
      isGlobalAdmin: false,
      schools: [{ schoolId: 'school-1', role: 'COORDINATOR' }],
    } as never)
    vi.mocked(prisma.student.findUnique).mockResolvedValue({ id: 'student-1', schoolId: 'school-1', classId: 'class-1' } as never)
    vi.mocked(prisma.userSchool.findUnique).mockResolvedValue({} as never)
    vi.mocked(prisma.class.findUnique).mockResolvedValue({ id: 'class-1', schoolId: 'school-1', academicYear: 2026 } as never)
  }

  it('PUT should update a student', async () => {
    mockAccess()
    vi.mocked(prisma.student.update).mockResolvedValue({ id: 'student-1', name: 'Updated' } as never)

    const res = await PUT(mockRequest({ name: 'Updated', studentNumber: '123', classId: 'class-1' }), { params: Promise.resolve({ id: 'student-1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.student.name).toBe('Updated')
    expect(prisma.student.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: { name: 'Updated', studentNumber: '123', classId: 'class-1', schoolId: 'school-1' },
      include: {
        class: true,
        enrollments: {
          include: { class: true },
          orderBy: { startedAt: 'desc' },
        },
      }
    })
  })

  it('DELETE should soft delete a student', async () => {
    mockAccess()
    vi.mocked(prisma.student.update).mockResolvedValue({ id: 'student-1' } as never)

    const res = await DELETE(mockRequest(), { params: Promise.resolve({ id: 'student-1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.student.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'student-1' },
      data: expect.objectContaining({ deletedAt: expect.any(Date) })
    }))
  })
})
