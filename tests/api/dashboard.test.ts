import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockVerifyToken,
  mockFindTeacherSchools,
  mockFindStudents,
  mockFindLevels,
  mockFindHistory,
} = vi.hoisted(() => ({
  mockVerifyToken: vi.fn(),
  mockFindTeacherSchools: vi.fn(),
  mockFindStudents: vi.fn(),
  mockFindLevels: vi.fn(),
  mockFindHistory: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  verifyToken: mockVerifyToken,
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    teacherSchool: { findMany: mockFindTeacherSchools },
    student: { findMany: mockFindStudents },
    readingLevel: { findMany: mockFindLevels },
    studentReadingHistory: { findMany: mockFindHistory },
  },
}))

import { GET as getDashboard } from '../../src/app/api/dashboard/route'

const levels = [
  { id: 'level-dni', code: 'DNI', name: 'Does Not Identify', order: 1 },
  { id: 'level-lo', code: 'LO', name: 'Letters Only', order: 2 },
  { id: 'level-so', code: 'SO', name: 'Syllables Only', order: 3 },
  { id: 'level-rw', code: 'RW', name: 'Reads Words', order: 4 },
  { id: 'level-rs', code: 'RS', name: 'Reads Sentences', order: 5 },
  { id: 'level-rts', code: 'RTS', name: 'Reads Text Syllabically', order: 6 },
  { id: 'level-rtf', code: 'RTF', name: 'Reads Text Fluently', order: 7 },
]

function createStudent(id: string, code: string, recordedAt = new Date('2026-04-10T12:00:00.000Z')) {
  const level = levels.find((item) => item.code === code)!

  return {
    id,
    name: `Student ${id}`,
    studentNumber: id,
    school: { name: 'Test School' },
    enrollments: [{
      id: `enrollment-${id}`,
      class: {
        academicYear: 2026,
        school: { name: 'Test School' },
      },
    }],
    readingHistory: [{ readingLevelId: level.id, readingLevel: level, recordedAt }],
  }
}

describe('API: /api/dashboard GET', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockVerifyToken.mockReturnValue({ id: 'teacher-1', email: 'teacher@test.com' })
    mockFindTeacherSchools.mockResolvedValue([{ schoolId: 'school-1' }])
    mockFindLevels.mockResolvedValue(levels)
    mockFindHistory.mockResolvedValue([])
  })

  it('counts DNI, LO, and SO students as needing attention', async () => {
    mockFindStudents.mockResolvedValue([
      createStudent('student-1', 'DNI'),
      createStudent('student-2', 'LO'),
      createStudent('student-3', 'SO'),
    ])

    const request = new Request('http://localhost/api/dashboard', {
      headers: { authorization: 'Bearer valid-token' },
    })
    const response = await getDashboard(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.needAttention.map((student: { levelCode: string }) => student.levelCode)).toEqual([
      'DNI',
      'LO',
      'SO',
    ])
  })

  it('excludes RW, RS, RTS, and RTF students from needing attention', async () => {
    mockFindStudents.mockResolvedValue([
      createStudent('student-4', 'RW'),
      createStudent('student-5', 'RS'),
      createStudent('student-6', 'RTS'),
      createStudent('student-7', 'RTF'),
    ])

    const request = new Request('http://localhost/api/dashboard', {
      headers: { authorization: 'Bearer valid-token' },
    })
    const response = await getDashboard(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.needAttention).toEqual([])
    expect(data.improvedCount).toBe(0)
  })

  it('returns monthly update counts for the selected month', async () => {
    mockFindStudents.mockResolvedValue([
      createStudent('student-1', 'RW', new Date('2026-04-10T12:00:00.000Z')),
      createStudent('student-2', 'RS', new Date('2026-03-10T12:00:00.000Z')),
      { ...createStudent('student-3', 'RTS'), readingHistory: [] },
    ])

    const request = new Request('http://localhost/api/dashboard?month=04/2026', {
      headers: { authorization: 'Bearer valid-token' },
    })
    const response = await getDashboard(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.monthlyUpdates).toMatchObject({
      month: '04/2026',
      monthStatus: expect.stringMatching(/current|past/),
      totalStudents: 3,
      updatedCount: 1,
      missingCount: 2,
    })
    expect(data.monthlyUpdates.missingStudents.map((student: { id: string }) => student.id)).toEqual([
      'student-2',
      'student-3',
    ])
  })

  it('defaults monthly update counts to the current month', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T12:00:00.000Z'))
    mockFindStudents.mockResolvedValue([
      createStudent('student-1', 'RW', new Date('2026-05-10T12:00:00.000Z')),
    ])

    const request = new Request('http://localhost/api/dashboard', {
      headers: { authorization: 'Bearer valid-token' },
    })
    const response = await getDashboard(request)
    const data = await response.json()

    vi.useRealTimers()

    expect(response.status).toBe(200)
    expect(data.monthlyUpdates.month).toBe('05/2026')
    expect(data.monthlyUpdates.monthStatus).toBe('current')
    expect(data.monthlyUpdates.updatedCount).toBe(1)
    expect(data.monthlyUpdates.missingCount).toBe(0)
  })
})
