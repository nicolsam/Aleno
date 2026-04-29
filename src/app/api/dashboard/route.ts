import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { isAttentionReadingLevel } from '@/lib/reading-levels'
import {
  getLatestAssessmentDate,
  getYearFromMonthKey,
  hasMonthlyReadingUpdate,
  resolveMonthInfo,
} from '@/lib/monthly-updates'

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const { month: selectedMonth, monthStatus, range: selectedMonthRange } = resolveMonthInfo(searchParams.get('month'))
    const selectedAcademicYear = getYearFromMonthKey(selectedMonth)

    let schoolIds: string[] = []

    if (schoolId) {
      schoolIds = [schoolId]
    } else {
      const teacherSchools = await prisma.teacherSchool.findMany({
        where: { teacherId: payload.id, school: { deletedAt: null } },
        select: { schoolId: true },
      })
      schoolIds = teacherSchools.map((ts) => ts.schoolId)
    }

    if (schoolIds.length === 0) {
      return NextResponse.json({ 
        totalStudents: 0,
        distribution: [],
        byLevel: [],
        needAttention: [],
        monthlyUpdates: {
          month: selectedMonth,
          monthStatus,
          academicYear: selectedAcademicYear,
          totalStudents: 0,
          updatedCount: 0,
          missingCount: 0,
          missingStudents: [],
        },
      })
    }

    const students = await prisma.student.findMany({
      where: { 
        schoolId: { in: schoolIds },
        deletedAt: null,
        school: { deletedAt: null },
        enrollments: {
          some: {
            deletedAt: null,
            class: {
              academicYear: selectedAcademicYear,
              schoolId: { in: schoolIds },
              deletedAt: null,
            },
          },
        },
      },
      include: {
        enrollments: {
          where: {
            deletedAt: null,
            class: {
              academicYear: selectedAcademicYear,
              schoolId: { in: schoolIds },
              deletedAt: null,
            },
          },
          include: { class: { include: { school: true } } },
          orderBy: { startedAt: 'desc' },
        },
        readingHistory: {
          where: {
            enrollment: {
              class: { academicYear: selectedAcademicYear },
            },
          },
          orderBy: { recordedAt: 'desc' },
          include: { readingLevel: true },
        },
        school: true,
      },
    })

    const levels = await prisma.readingLevel.findMany({
      orderBy: { order: 'asc' },
    })

    const distribution = levels.map((level) => {
      const count = students.filter(
        (s) => s.readingHistory[0]?.readingLevelId === level.id
      ).length
      return {
        level: level.code,
        name: level.name,
        count,
        percentage: students.length > 0 ? Math.round((count / students.length) * 100) : 0,
      }
    })

    const needAttention = students
      .filter((s) => isAttentionReadingLevel(s.readingHistory[0]?.readingLevel.code))
      .map((s) => ({
        id: s.id,
        name: s.name,
        studentNumber: s.studentNumber,
        schoolName: s.enrollments?.[0]?.class.school.name || s.school.name,
        level: s.readingHistory[0]?.readingLevel.name || 'Not assessed',
        levelCode: s.readingHistory[0]?.readingLevel.code || 'N/A',
      }))

    const missingMonthlyUpdateStudents = students
      .filter((s) => !hasMonthlyReadingUpdate(s.readingHistory, selectedMonthRange))
      .map((s) => ({
        id: s.id,
        name: s.name,
        studentNumber: s.studentNumber,
        schoolName: s.enrollments?.[0]?.class.school.name || s.school.name,
        level: s.readingHistory[0]?.readingLevel.name || 'Not assessed',
        levelCode: s.readingHistory[0]?.readingLevel.code || 'N/A',
        latestAssessmentDate: getLatestAssessmentDate(s.readingHistory),
      }))

    // Most common level
    const mostCommon = distribution.reduce((best, d) => d.count > best.count ? d : best, distribution[0])
    const mostCommonLevel = mostCommon && mostCommon.count > 0 ? mostCommon.level : null

    // Improved this month: students whose latest level is higher than their previous level,
    // where the latest assessment was recorded this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const improvedThisMonth = students.reduce((count, student) => {
      const history = student.readingHistory
      if (history.length >= 2) {
        const latest = history[0]
        const previous = history[1]
        if (
          new Date(latest.recordedAt) >= startOfMonth &&
          latest.readingLevel.order > previous.readingLevel.order
        ) {
          return count + 1
        }
      }

      return count
    }, 0)

    return NextResponse.json({
      totalStudents: students.length,
      distribution,
      byLevel: distribution,
      needAttention,
      mostCommonLevel,
      improvedThisMonth,
      monthlyUpdates: {
        month: selectedMonth,
        monthStatus,
        academicYear: selectedAcademicYear,
        totalStudents: students.length,
        updatedCount: students.length - missingMonthlyUpdateStudents.length,
        missingCount: missingMonthlyUpdateStudents.length,
        missingStudents: missingMonthlyUpdateStudents,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
