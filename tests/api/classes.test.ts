import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/classes/route'
import { PUT } from '@/app/api/classes/[id]/route'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

vi.mock('@/lib/db', () => ({
  prisma: {
    teacher: { findUnique: vi.fn() },
    teacherSchool: { findUnique: vi.fn(), findMany: vi.fn() },
    class: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() }
  }
}))

vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn()
}))

vi.mock('@/lib/audit', () => ({
  logAction: vi.fn()
}))

describe('Classes API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockRequest = (body?: any) => ({
    headers: new Headers({ authorization: 'Bearer valid-token', 'x-forwarded-for': '127.0.0.1' }),
    json: async () => body
  } as Request)

  const mockAccess = () => {
    vi.mocked(verifyToken).mockReturnValue({ id: 'teacher-1', email: 'test@example.com' })
    vi.mocked(prisma.teacherSchool.findUnique).mockResolvedValue({} as any)
  }

  it('POST should create a class if valid', async () => {
    mockAccess()
    vi.mocked(prisma.class.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.class.create).mockResolvedValue({ id: 'class-1', grade: '1º Ano' } as any)

    const res = await POST(mockRequest({ grade: '1º Ano', section: 'A', shift: 'Morning', schoolId: 'school-1' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.class.id).toBe('class-1')
    expect(prisma.class.create).toHaveBeenCalled()
  })

  it('POST should reject invalid shift', async () => {
    mockAccess()

    const res = await POST(mockRequest({ grade: '1º Ano', section: 'A', shift: 'InvalidShift', schoolId: 'school-1' }))
    expect(res.status).toBe(400)
  })

  it('POST should reject invalid grade', async () => {
    mockAccess()

    const res = await POST(mockRequest({ grade: 'InvalidGrade', section: 'A', shift: 'Morning', schoolId: 'school-1' }))
    expect(res.status).toBe(400)
  })

  it('PUT should update class details', async () => {
    mockAccess()
    vi.mocked(prisma.class.findUnique).mockResolvedValue({ id: 'class-1', schoolId: 'school-1' } as any)
    vi.mocked(prisma.class.update).mockResolvedValue({ id: 'class-1', grade: '2º Ano' } as any)

    const res = await PUT(mockRequest({ grade: '2º Ano', section: 'B', shift: 'Afternoon' }), { params: Promise.resolve({ id: 'class-1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.class.grade).toBe('2º Ano')
    expect(prisma.class.update).toHaveBeenCalled()
  })
})
