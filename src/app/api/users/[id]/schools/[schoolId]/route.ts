import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAction } from '@/lib/audit'
import {
  forbiddenResponse,
  getCoordinatorSchoolId,
  isAuthFailure,
  requireAuth,
  USER_SCHOOL_ROLES,
} from '@/lib/permissions'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; schoolId: string }> },
) {
  try {
    const auth = await requireAuth(request)
    if (isAuthFailure(auth)) return auth.error

    const { id, schoolId } = await params
    const coordinatorSchoolId = getCoordinatorSchoolId(auth.user)
    const canUnassign = auth.user.isGlobalAdmin || coordinatorSchoolId === schoolId
    if (!canUnassign) return forbiddenResponse()

    const assignment = await prisma.userSchool.findUnique({
      where: { userId_schoolId: { userId: id, schoolId } },
      include: { user: true },
    })

    if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (assignment.user.isGlobalAdmin) return forbiddenResponse()
    if (!auth.user.isGlobalAdmin && assignment.role !== USER_SCHOOL_ROLES.TEACHER) return forbiddenResponse()

    await prisma.userSchool.delete({
      where: { userId_schoolId: { userId: id, schoolId } },
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(auth.user.id, 'UNASSIGN_USER_SCHOOL', { userId: id, schoolId }, ipAddress)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('User school DELETE error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
