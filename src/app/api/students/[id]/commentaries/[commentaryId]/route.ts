import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { requireAuth, isAuthFailure } from '@/lib/permissions'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentaryId: string }> }
) {
  const { id: studentId, commentaryId } = await params
  const auth = await requireAuth(request)
  if (isAuthFailure(auth)) return auth.error

  try {
    const entry = await prisma.studentCommentary.findUnique({
      where: { id: commentaryId },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (entry.userId !== auth.user.id && !auth.user.isGlobalAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.studentCommentary.delete({
      where: { id: commentaryId },
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(auth.user.id, 'DELETE_COMMENTARY', { studentId, commentaryId }, ipAddress)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete commentary error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentaryId: string }> }
) {
  const { id: studentId, commentaryId } = await params
  const auth = await requireAuth(request)
  if (isAuthFailure(auth)) return auth.error

  try {
    const entry = await prisma.studentCommentary.findUnique({
      where: { id: commentaryId },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Permission: Only owners can edit commentaries (per user feedback)
    if (entry.userId !== auth.user.id && !auth.user.isGlobalAdmin) {
      return NextResponse.json({ error: 'Forbidden. Only the owner can edit this comment.' }, { status: 403 })
    }

    const body = await request.json()
    const { commentary, recordedAt } = body

    const updated = await prisma.studentCommentary.update({
      where: { id: commentaryId },
      data: {
        commentary: commentary !== undefined ? commentary : undefined,
        recordedAt: recordedAt ? new Date(recordedAt) : undefined,
      },
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(auth.user.id, 'UPDATE_COMMENTARY', { studentId, commentaryId }, ipAddress)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update commentary error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
