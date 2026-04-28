import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { logAction } from '@/lib/audit'

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

    const classFilters: any = { deletedAt: null }
    if (grade) classFilters.grade = grade
    if (section) classFilters.section = section
    if (shift) classFilters.shift = shift

    const students = await prisma.student.findMany({
      where: {
        schoolId: { in: validSchoolIds },
        deletedAt: null,
        school: { deletedAt: null },
        class: classFilters
      },
      include: {
        class: true,
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
      data: { name, studentNumber, schoolId: classRecord.schoolId, classId },
      include: { class: true }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(payload.id, 'CREATE_STUDENT', { studentId: student.id, name }, ipAddress)

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}