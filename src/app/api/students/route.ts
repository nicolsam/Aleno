import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { logAction } from '@/lib/audit'

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

    const students = await prisma.student.findMany({
      where: {
        schoolId: { in: validSchoolIds },
        deletedAt: null,
        school: { deletedAt: null }
      },
      include: {
        readingHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
          include: { readingLevel: true },
        },
      },
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Students error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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
    const { name, studentNumber, schoolId, readingLevelId, notes } = body

    if (!name || !studentNumber || !schoolId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const student = await prisma.student.create({
      data: {
        name,
        studentNumber,
        schoolId,
      },
    })

    if (readingLevelId) {
      await prisma.studentReadingHistory.create({
        data: {
          studentId: student.id,
          readingLevelId,
          teacherId: payload.id,
          notes,
        },
      })
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(payload.id, 'CREATE_STUDENT', { studentId: student.id, name, schoolId }, ipAddress)

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}