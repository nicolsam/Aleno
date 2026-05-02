import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { VALID_GRADES, VALID_SHIFTS } from '../route'
import { parseAcademicYear } from '@/lib/enrollments'
import { forbiddenResponse, isAuthFailure, isCoordinatorForSchool, requireAuth } from '@/lib/permissions'

function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error
    ? (error as { code?: unknown }).code === code
    : false
}

async function checkAccess(request: Request, classId: string) {
  const auth = await requireAuth(request)
  if (isAuthFailure(auth)) return { response: auth.error }

  const classRecord = await prisma.class.findUnique({ where: { id: classId } })
  if (!classRecord) return { response: NextResponse.json({ error: 'Not found' }, { status: 404 }) }

  if (!isCoordinatorForSchool(auth.user, classRecord.schoolId)) return { response: forbiddenResponse() }
  
  return { auth, classRecord }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await checkAccess(request, id)
    if (access.response) return access.response

    const { grade, section, shift, academicYear: rawAcademicYear } = await request.json()
    const academicYear = parseAcademicYear(rawAcademicYear)
    if (!grade || !section || !shift || !academicYear) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    if (!VALID_SHIFTS.includes(shift)) return NextResponse.json({ error: 'Invalid shift value' }, { status: 400 })
    if (!VALID_GRADES.includes(grade)) return NextResponse.json({ error: 'Invalid grade value' }, { status: 400 })

    const updatedClass = await prisma.class.update({
      where: { id },
      data: { grade, section, shift, academicYear },
      include: { school: true }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.auth!.user.id, 'UPDATE_CLASS', { classId: id }, ipAddress)

    return NextResponse.json({ class: updatedClass })
  } catch (error) {
    if (hasErrorCode(error, 'P2002')) return NextResponse.json({ error: 'Class already exists' }, { status: 400 })
    console.error('Update class error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await checkAccess(request, id)
    if (access.response) return access.response

    await prisma.class.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.auth!.user.id, 'SOFT_DELETE_CLASS', { classId: id }, ipAddress)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete class error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
