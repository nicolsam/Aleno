import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { forbiddenResponse, isAuthFailure, requireAuth } from '@/lib/permissions'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if (isAuthFailure(auth)) return auth.error
    if (!auth.user.isGlobalAdmin) return forbiddenResponse()

    const { id } = await params

    const school = await prisma.school.update({
      where: { id },
      data: { deletedAt: null }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(auth.user.id, 'RESTORE_SCHOOL', { schoolId: id }, ipAddress)

    return NextResponse.json({ school })
  } catch (error) {
    console.error('Restore school error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
