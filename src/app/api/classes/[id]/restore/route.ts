import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { forbiddenResponse, isAuthFailure, isCoordinatorForSchool, requireAuth } from '@/lib/permissions'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if (isAuthFailure(auth)) return auth.error

    const { id } = await params

    const classRecord = await prisma.class.findUnique({ where: { id } })
    if (!classRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!isCoordinatorForSchool(auth.user, classRecord.schoolId)) return forbiddenResponse()

    const updatedClass = await prisma.class.update({
      where: { id },
      data: { deletedAt: null },
      include: { school: true }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(auth.user.id, 'RESTORE_CLASS', { classId: id }, ipAddress)

    return NextResponse.json({ class: updatedClass })
  } catch (error) {
    console.error('Restore class error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
