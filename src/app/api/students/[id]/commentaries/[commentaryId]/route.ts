import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { forbiddenResponse, hasSchoolAccess, isAuthFailure, requireAuth } from '@/lib/permissions'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string, commentaryId: string }> }) {
  try {
    const auth = await requireAuth(request)
    if (isAuthFailure(auth)) return auth.error
    
    const { id, commentaryId } = await params

    const student = await prisma.student.findUnique({
      where: { id },
    })

    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!hasSchoolAccess(auth.user, student.schoolId)) return forbiddenResponse()

    await prisma.studentCommentary.delete({
      where: { id: commentaryId, studentId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete commentary error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
