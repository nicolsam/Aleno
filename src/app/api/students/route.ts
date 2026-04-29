import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { getAcademicYearStartDate, parseAcademicYear } from '@/lib/enrollments'
import {
  getLatestAssessmentDate,
  getYearFromMonthKey,
  hasMonthlyReadingUpdate,
  resolveMonthInfo,
} from '@/lib/monthly-updates'

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const grade = searchParams.get('grade')
    const section = searchParams.get('section')
    const shift = searchParams.get('shift')
    const { month: selectedMonth, monthStatus, range: selectedMonthRange } = resolveMonthInfo(searchParams.get('month'))
    const selectedAcademicYear = parseAcademicYear(searchParams.get('academicYear')) || getYearFromMonthKey(selectedMonth)

    let validSchoolIds: string[] = []

    if (schoolId) {
      const ts = await prisma.teacherSchool.findUnique({
        where: { teacherId_schoolId: { teacherId: payload.id, schoolId } }
      })
      if (ts) validSchoolIds = [schoolId]
    } else {
      const ts = await prisma.teacherSchool.findMany({
        where: { teacherId: payload.id, school: { deletedAt: null } }
      })
      validSchoolIds = ts.map(t => t.schoolId)
    }

    const classFilters: Prisma.ClassWhereInput = { deletedAt: null }
    classFilters.academicYear = selectedAcademicYear
    if (grade) classFilters.grade = grade
    if (section) classFilters.section = section
    if (shift) classFilters.shift = shift

    const students = await prisma.student.findMany({
      where: {
        schoolId: { in: validSchoolIds },
        deletedAt: null,
        school: { deletedAt: null },
        enrollments: {
          some: {
            deletedAt: null,
            class: {
              ...classFilters,
              schoolId: { in: validSchoolIds },
              school: { deletedAt: null },
            },
          },
        },
      },
      include: {
        class: true,
        enrollments: {
          where: {
            deletedAt: null,
            class: {
              academicYear: selectedAcademicYear,
              schoolId: { in: validSchoolIds },
              deletedAt: null,
            },
          },
          include: { class: true },
          orderBy: { startedAt: 'desc' },
        },
        readingHistory: {
          orderBy: { recordedAt: 'desc' },
          include: { readingLevel: true },
        },
      },
    })

    const studentsWithMonthlyStatus = students.map((student) => {
      const selectedEnrollment = student.enrollments?.[0] || null
      return {
        ...student,
        class: selectedEnrollment?.class || student.class,
        selectedEnrollment,
        selectedAcademicYear,
        monthlyUpdateStatus: hasMonthlyReadingUpdate(student.readingHistory, selectedMonthRange)
          ? 'updated'
          : 'missing',
        monthStatus,
        selectedMonth,
        latestAssessmentDate: getLatestAssessmentDate(student.readingHistory),
      }
    })

    return NextResponse.json({ students: studentsWithMonthlyStatus })
  } catch (error) {
    console.error('Students error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { name, studentNumber, classId } = await request.json()

    if (!name || !studentNumber || !classId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const classRecord = await prisma.class.findUnique({ where: { id: classId } })
    if (!classRecord) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    const ts = await prisma.teacherSchool.findUnique({
      where: { teacherId_schoolId: { teacherId: payload.id, schoolId: classRecord.schoolId } }
    })
    if (!ts) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const existingStudent = await prisma.student.findUnique({
      where: { studentNumber_schoolId: { studentNumber, schoolId: classRecord.schoolId } }
    })

    if (existingStudent) {
      return NextResponse.json({ error: 'Student number exists' }, { status: 400 })
    }

    const student = await prisma.student.create({
      data: {
        name,
        studentNumber,
        schoolId: classRecord.schoolId,
        classId,
        enrollments: {
          create: {
            classId,
            startedAt: getAcademicYearStartDate(classRecord.academicYear),
          },
        },
      },
      include: {
        class: true,
        enrollments: {
          include: { class: true },
        },
      }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(payload.id, 'CREATE_STUDENT', { studentId: student.id, name }, ipAddress)

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
