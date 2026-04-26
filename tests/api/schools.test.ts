import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PUT, DELETE, PATCH } from '@/app/api/schools/[id]/route' // Actually PATCH is in [id]/restore/route.ts
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

vi.mock('@/lib/db', () => ({
  prisma: {
    teacher: { findUnique: vi.fn() },
    teacherSchool: { findUnique: vi.fn() },
    school: { update: vi.fn() },
    auditLog: { create: vi.fn() }
  }
}))

vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn()
}))

vi.mock('@/lib/audit', () => ({
  logAction: vi.fn()
}))

describe('Schools API PUT & DELETE', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockRequest = (body?: any) => ({
    headers: new Headers({ authorization: 'Bearer valid-token' }),
    json: async () => body
  } as Request)

  const mockAccess = () => {
    vi.mocked(verifyToken).mockReturnValue({ id: 'teacher-1', email: 'test@example.com' })
    vi.mocked(prisma.teacher.findUnique).mockResolvedValue({ id: 'teacher-1' } as any)
    vi.mocked(prisma.teacherSchool.findUnique).mockResolvedValue({} as any)
  }

  it('PUT should update a school', async () => {
    mockAccess()
    vi.mocked(prisma.school.update).mockResolvedValue({ id: 'school-1', name: 'Updated' } as any)

    const res = await PUT(mockRequest({ name: 'Updated', address: '123' }), { params: Promise.resolve({ id: 'school-1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.school.name).toBe('Updated')
    expect(prisma.school.update).toHaveBeenCalledWith({
      where: { id: 'school-1' },
      data: { name: 'Updated', address: '123' }
    })
  })

  it('DELETE should soft delete a school', async () => {
    mockAccess()
    vi.mocked(prisma.school.update).mockResolvedValue({ id: 'school-1' } as any)

    const res = await DELETE(mockRequest(), { params: Promise.resolve({ id: 'school-1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.school.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'school-1' },
      data: expect.objectContaining({ deletedAt: expect.any(Date) })
    }))
  })
})
