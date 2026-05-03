import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '@/app/api/students/[id]/contacts/route'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    student: { findUnique: vi.fn() },
    studentContact: {
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    auditLog: { create: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn(),
}))

vi.mock('@/lib/audit', () => ({
  logAction: vi.fn(),
}))

describe('student contacts API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const request = (body?: unknown) => ({
    headers: new Headers({ authorization: 'Bearer valid-token' }),
    json: async () => body,
  } as unknown as Request)

  function mockAccess(schools = [{ schoolId: 'school-1', role: 'TEACHER' }]) {
    vi.mocked(verifyToken).mockReturnValue({ id: 'teacher-1', email: 'teacher@test.com' })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'teacher-1',
      email: 'teacher@test.com',
      name: 'Teacher',
      isGlobalAdmin: false,
      schools,
    } as never)
    vi.mocked(prisma.student.findUnique).mockResolvedValue({ id: 'student-1', schoolId: 'school-1' } as never)
  }

  it('lists contacts for an accessible student', async () => {
    mockAccess()
    vi.mocked(prisma.studentContact.findMany).mockResolvedValue([{ id: 'contact-1', name: 'Maria' }] as never)

    const res = await GET(request(), { params: Promise.resolve({ id: 'student-1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.contacts).toHaveLength(1)
    expect(prisma.studentContact.findMany).toHaveBeenCalledWith({
      where: { studentId: 'student-1' },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    })
  })

  it('creates the first contact as primary and normalizes WhatsApp phone', async () => {
    mockAccess()
    vi.mocked(prisma.studentContact.count).mockResolvedValue(0)
    vi.mocked(prisma.studentContact.updateMany).mockResolvedValue({ count: 0 } as never)
    vi.mocked(prisma.studentContact.create).mockResolvedValue({
      id: 'contact-1',
      name: 'Maria',
      whatsappPhone: '5585999990000',
      isPrimary: true,
    } as never)

    const res = await POST(request({
      name: 'Maria',
      relationship: 'MOTHER',
      phone: '(85) 99999-0000',
    }), { params: Promise.resolve({ id: 'student-1' }) })
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.contact.isPrimary).toBe(true)
    expect(prisma.studentContact.create).toHaveBeenCalledWith({
      data: {
        studentId: 'student-1',
        name: 'Maria',
        relationship: 'MOTHER',
        phone: '(85) 99999-0000',
        whatsappPhone: '5585999990000',
        isPrimary: true,
      },
    })
  })

  it('rejects contact writes when the teacher cannot access the student school', async () => {
    mockAccess([])

    const res = await POST(request({
      name: 'Maria',
      relationship: 'MOTHER',
      phone: '(85) 99999-0000',
    }), { params: Promise.resolve({ id: 'student-1' }) })

    expect(res.status).toBe(403)
    expect(prisma.studentContact.create).not.toHaveBeenCalled()
  })

  it('returns 400 for invalid phone numbers', async () => {
    mockAccess()

    const res = await POST(request({ name: 'Maria', relationship: 'MOTHER', phone: '123' }), {
      params: Promise.resolve({ id: 'student-1' }),
    })
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toContain('Invalid Brazilian WhatsApp phone "123"')
  })
})
