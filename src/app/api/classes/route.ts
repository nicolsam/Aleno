import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { parseAcademicYear } from '@/lib/enrollments'

export const VALID_SHIFTS = ['Morning', 'Afternoon', 'Night']
export const VALID_GRADES = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano', '1ª Série', '2ª Série', '3ª Série']

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const academicYear = parseAcademicYear(searchParams.get('academicYear'))

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

    if (validSchoolIds.length === 0) {
      return NextResponse.json({ classes: [], academicYears: [] })
    }

    const academicYearRows = await prisma.class.findMany({
      where: {
        schoolId: { in: validSchoolIds },
        deletedAt: null,
        school: { deletedAt: null },
      },
      select: { academicYear: true },
      orderBy: { academicYear: 'desc' },
    })
    const academicYears = Array.from(new Set(academicYearRows.map((row) => row.academicYear)))

    const classes = await prisma.class.findMany({
      where: {
        schoolId: { in: validSchoolIds },
        ...(academicYear ? { academicYear } : {}),
        deletedAt: null,
        school: { deletedAt: null }
      },
      include: { school: true },
      orderBy: [
        { academicYear: 'desc' },
        { grade: 'asc' },
        { section: 'asc' }
      ]
    })

    return NextResponse.json({ classes, academicYears })
  } catch (error) {
    console.error('Classes GET error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { grade, section, shift, schoolId, academicYear: rawAcademicYear } = await request.json()
    const academicYear = parseAcademicYear(rawAcademicYear)

    if (!grade || !section || !shift || !schoolId || !academicYear) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!VALID_SHIFTS.includes(shift)) {
      return NextResponse.json({ error: 'Invalid shift value' }, { status: 400 })
    }

    if (!VALID_GRADES.includes(grade)) {
      return NextResponse.json({ error: 'Invalid grade value' }, { status: 400 })
    }

    const ts = await prisma.teacherSchool.findUnique({
      where: { teacherId_schoolId: { teacherId: payload.id, schoolId } }
    })

    if (!ts) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existingClass = await prisma.class.findUnique({
      where: { schoolId_grade_section_shift_academicYear: { schoolId, grade, section, shift, academicYear } }
    })

    if (existingClass) {
      return NextResponse.json({ error: 'Class already exists' }, { status: 400 })
    }

    const newClass = await prisma.class.create({
      data: { grade, section, shift, schoolId, academicYear },
      include: { school: true }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(payload.id, 'CREATE_CLASS', { classId: newClass.id }, ipAddress)

    return NextResponse.json({ class: newClass })
  } catch (error) {
    console.error('Classes POST error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
