import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { forbiddenResponse, hasSchoolAccess, isAuthFailure, requireAuth } from '@/lib/permissions'
import { logAction } from '@/lib/audit'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string, historyId: string }> }) {
  try {
    const auth = await requireAuth(request)
    if (isAuthFailure(auth)) return auth.error
    
    const { id, historyId } = await params

    const student = await prisma.student.findUnique({
      where: { id },
    })

    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!hasSchoolAccess(auth.user, student.schoolId)) return forbiddenResponse()

    await prisma.studentReadingHistory.delete({
      where: { id: historyId, studentId: id },
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(auth.user.id, 'DELETE_STUDENT_LEVEL', { studentId: id, historyId }, ipAddress)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete history error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
