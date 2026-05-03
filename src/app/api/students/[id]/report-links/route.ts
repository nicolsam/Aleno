import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { forbiddenResponse, hasSchoolAccess, isAuthFailure, requireAuth } from '@/lib/permissions'

async function getReportLinkStudent(request: Request, studentId: string) {
  const auth = await requireAuth(request)
  if (isAuthFailure(auth)) return { response: auth.error }

  const student = await prisma.student.findUnique({
    where: { id: studentId, deletedAt: null },
    select: { id: true, schoolId: true },
  })
  if (!student) return { response: NextResponse.json({ error: 'Student not found' }, { status: 404 }) }
  if (!hasSchoolAccess(auth.user, student.schoolId)) return { response: forbiddenResponse() }

  return { auth, student }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await getReportLinkStudent(request, id)
    if (access.response) return access.response

    const revoked = await prisma.studentParentReportLink.updateMany({
      where: { studentId: id, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { revokedAt: new Date() },
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.auth!.user.id, 'REVOKE_STUDENT_REPORT_LINKS', { studentId: id, count: revoked.count }, ipAddress)

    return NextResponse.json({ success: true, revokedCount: revoked.count })
  } catch (error) {
    console.error('Student report links DELETE error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
