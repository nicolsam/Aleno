import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { getEnrollmentForDate } from '@/lib/enrollments'
import { parseDateInput } from '@/lib/monthly-updates'

export async function PATCH(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { studentId, readingLevelId, notes, recordedAt } = body

    if (!studentId || !readingLevelId) {
      return NextResponse.json({ 
        error: 'Missing fields',
        details: { studentId: !!studentId, readingLevelId: !!readingLevelId }
      }, { status: 400 })
    }

    const assessmentDate = recordedAt ? parseDateInput(recordedAt) : new Date()
    if (!assessmentDate) {
      return NextResponse.json({ error: 'Invalid assessment date' }, { status: 400 })
    }

    if (assessmentDate > new Date()) {
      return NextResponse.json({ error: 'Future assessment dates are not allowed' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { deletedAt: null },
          include: { class: true },
          orderBy: { startedAt: 'desc' },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const teacherSchool = await prisma.teacherSchool.findUnique({
      where: { teacherId_schoolId: { teacherId: payload.id, schoolId: student.schoolId } },
    })

    if (!teacherSchool) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const enrollment = getEnrollmentForDate(student.enrollments, assessmentDate)
    if (!enrollment) {
      return NextResponse.json({
        error: 'No enrollment found for this assessment date. Create or fix the student enrollment first.',
      }, { status: 400 })
    }

    const history = await prisma.studentReadingHistory.create({
      data: {
        studentId,
        enrollmentId: enrollment.id,
        readingLevelId,
        teacherId: payload.id,
        recordedAt: assessmentDate,
        notes,
      },
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(payload.id, 'UPDATE_STUDENT_LEVEL', { studentId, readingLevelId }, ipAddress)

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Update reading level error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
