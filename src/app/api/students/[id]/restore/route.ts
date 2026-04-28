import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { id } = await params

    const student = await prisma.student.findUnique({ where: { id } })
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const teacherSchool = await prisma.teacherSchool.findUnique({
      where: { teacherId_schoolId: { teacherId: payload.id, schoolId: student.schoolId } }
    })
    if (!teacherSchool) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { deletedAt: null }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(payload.id, 'RESTORE_STUDENT', { studentId: id }, ipAddress)

    return NextResponse.json({ student: updatedStudent })
  } catch (error) {
    console.error('Restore student error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
