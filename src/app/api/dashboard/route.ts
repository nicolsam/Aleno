import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { isAttentionReadingLevel } from '@/lib/reading-levels'

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
      })
    }

    const students = await prisma.student.findMany({
      where: { 
        schoolId: { in: schoolIds },
        deletedAt: null,
        school: { deletedAt: null }
      },
      include: {
        readingHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
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
        schoolName: s.school.name,
        level: s.readingHistory[0]?.readingLevel.name || 'Not assessed',
        levelCode: s.readingHistory[0]?.readingLevel.code || 'N/A',
      }))

    // Most common level
    const mostCommon = distribution.reduce((best, d) => d.count > best.count ? d : best, distribution[0])
    const mostCommonLevel = mostCommon && mostCommon.count > 0 ? mostCommon.level : null

    // Improved this month: students whose latest level is higher than their previous level,
    // where the latest assessment was recorded this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    let improvedThisMonth = 0
    for (const student of students) {
      const history = await prisma.studentReadingHistory.findMany({
        where: { studentId: student.id },
        orderBy: { recordedAt: 'desc' },
        take: 2,
        include: { readingLevel: true },
      })

      if (history.length >= 2) {
        const latest = history[0]
        const previous = history[1]
        if (
          new Date(latest.recordedAt) >= startOfMonth &&
          latest.readingLevel.order > previous.readingLevel.order
        ) {
          improvedThisMonth++
        }
      }
    }

    return NextResponse.json({
      totalStudents: students.length,
      distribution,
      byLevel: distribution,
      needAttention,
      mostCommonLevel,
      improvedThisMonth,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
