import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { forbiddenResponse, isAuthFailure, isCoordinatorForSchool, requireAuth } from '@/lib/permissions'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if (isAuthFailure(auth)) return auth.error

    const { id } = await params

    const student = await prisma.student.findUnique({ where: { id } })
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!isCoordinatorForSchool(auth.user, student.schoolId)) return forbiddenResponse()

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { deletedAt: null }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(auth.user.id, 'RESTORE_STUDENT', { studentId: id }, ipAddress)

    return NextResponse.json({ student: updatedStudent })
  } catch (error) {
    console.error('Restore student error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
