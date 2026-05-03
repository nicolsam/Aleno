import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { forbiddenResponse, hasSchoolAccess, isAuthFailure, requireAuth } from '@/lib/permissions'
import { parseDateInput } from '@/lib/monthly-updates'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if (isAuthFailure(auth)) return auth.error
    
    const { id } = await params
    const body = await request.json()
    const { commentary, recordedAt } = body

    if (!commentary) return NextResponse.json({ error: 'Missing commentary' }, { status: 400 })

    const date = recordedAt ? parseDateInput(recordedAt) : new Date()

    const student = await prisma.student.findUnique({
      where: { id },
    })

    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!hasSchoolAccess(auth.user, student.schoolId)) return forbiddenResponse()

    const newCommentary = await prisma.studentCommentary.create({
      data: {
        studentId: id,
        userId: auth.user.id,
        commentary,
        recordedAt: date || new Date(),
      },
    })

    return NextResponse.json({ commentary: newCommentary })
  } catch (error) {
    console.error('Create commentary error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
