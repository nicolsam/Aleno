import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { getAcademicYearStartDate } from '@/lib/enrollments'
import { forbiddenResponse, hasSchoolAccess, isAuthFailure, isCoordinatorForSchool, requireAuth } from '@/lib/permissions'

async function checkAccess(request: Request, studentId: string, write = false) {
  const auth = await requireAuth(request)
  if (isAuthFailure(auth)) return { response: auth.error }

  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student) return { response: NextResponse.json({ error: 'Not found' }, { status: 404 }) }

  const allowed = write
    ? isCoordinatorForSchool(auth.user, student.schoolId)
    : hasSchoolAccess(auth.user, student.schoolId)
  if (!allowed) return { response: forbiddenResponse() }
  
  return { auth, student }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await checkAccess(request, id, true)
    if (access.response) return access.response

    const { name, studentNumber, classId } = await request.json()
    if (!name || !studentNumber || !classId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const classRecord = await prisma.class.findUnique({ where: { id: classId } })
    if (!classRecord) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    // If changing classes, make sure the new class belongs to a school the user can coordinate.
    if (access.student!.classId !== classId) {
      if (!isCoordinatorForSchool(access.auth!.user, classRecord.schoolId)) {
        return NextResponse.json({ error: 'Forbidden for new class' }, { status: 403 })
      }

      const enrollmentStart = getAcademicYearStartDate(classRecord.academicYear)
      const previousEnrollmentEnd = new Date(enrollmentStart.getTime() - 24 * 60 * 60 * 1000)

      await prisma.studentEnrollment.updateMany({
        where: {
          studentId: id,
          endedAt: null,
          deletedAt: null,
          NOT: { classId },
        },
        data: { endedAt: previousEnrollmentEnd },
      })

      const existingEnrollment = await prisma.studentEnrollment.findFirst({
        where: {
          studentId: id,
          classId,
          deletedAt: null,
        },
      })

      if (existingEnrollment) {
        await prisma.studentEnrollment.update({
          where: { id: existingEnrollment.id },
          data: { endedAt: null },
        })
      } else {
        await prisma.studentEnrollment.create({
          data: {
            studentId: id,
            classId,
            startedAt: enrollmentStart,
          },
        })
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { name, studentNumber, classId, schoolId: classRecord.schoolId },
      include: {
        class: true,
        enrollments: {
          include: { class: true },
          orderBy: { startedAt: 'desc' },
        },
      }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.auth!.user.id, 'UPDATE_STUDENT', { studentId: id, name }, ipAddress)

    return NextResponse.json({ student: updatedStudent })
  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await checkAccess(request, id, true)
    if (access.response) return access.response

    await prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.auth!.user.id, 'SOFT_DELETE_STUDENT', { studentId: id }, ipAddress)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
