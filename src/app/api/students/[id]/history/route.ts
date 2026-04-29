import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { id } = await params

    const student = await prisma.student.findUnique({
      where: { id, deletedAt: null },
      include: {
        class: true,
        school: { select: { id: true, name: true } },
      },
    })

    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const teacherSchool = await prisma.teacherSchool.findUnique({
      where: { teacherId_schoolId: { teacherId: payload.id, schoolId: student.schoolId } },
    })
    if (!teacherSchool) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const history = await prisma.studentReadingHistory.findMany({
      where: { studentId: id },
      orderBy: [
        { recordedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        readingLevel: true,
        teacher: { select: { name: true } },
      },
    })

    return NextResponse.json({ student, history })
  } catch (error) {
    console.error('Student history error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
