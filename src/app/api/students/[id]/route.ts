import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { logAction } from '@/lib/audit'

async function checkAccess(request: Request, studentId: string) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return { error: 'Unauthorized', status: 401 }
  const payload = verifyToken(token)
  if (!payload) return { error: 'Invalid token', status: 401 }

  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student) return { error: 'Not found', status: 404 }

  const teacherSchool = await prisma.teacherSchool.findUnique({
    where: { teacherId_schoolId: { teacherId: payload.id, schoolId: student.schoolId } }
  })
  if (!teacherSchool) return { error: 'Forbidden', status: 403 }
  
  return { payload, student }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await checkAccess(request, id)
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status })

    const { name, studentNumber, classId } = await request.json()
    if (!name || !studentNumber || !classId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const classRecord = await prisma.class.findUnique({ where: { id: classId } })
    if (!classRecord) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    // If changing classes, make sure the new class belongs to a school the teacher has access to
    if (access.student!.classId !== classId) {
      if (access.student!.schoolId !== classRecord.schoolId) {
        const ts = await prisma.teacherSchool.findUnique({
          where: { teacherId_schoolId: { teacherId: access.payload!.id, schoolId: classRecord.schoolId } }
        })
        if (!ts) return NextResponse.json({ error: 'Forbidden for new class' }, { status: 403 })
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { name, studentNumber, classId, schoolId: classRecord.schoolId },
      include: { class: true }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.payload!.id, 'UPDATE_STUDENT', { studentId: id, name }, ipAddress)

    return NextResponse.json({ student: updatedStudent })
  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await checkAccess(request, id)
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status })

    await prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.payload!.id, 'SOFT_DELETE_STUDENT', { studentId: id }, ipAddress)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
