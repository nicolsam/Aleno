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

    const classRecord = await prisma.class.findUnique({ where: { id } })
    if (!classRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const teacherSchool = await prisma.teacherSchool.findUnique({
      where: { teacherId_schoolId: { teacherId: payload.id, schoolId: classRecord.schoolId } }
    })
    if (!teacherSchool) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const updatedClass = await prisma.class.update({
      where: { id },
      data: { deletedAt: null },
      include: { school: true }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(payload.id, 'RESTORE_CLASS', { classId: id }, ipAddress)

    return NextResponse.json({ class: updatedClass })
  } catch (error) {
    console.error('Restore class error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
